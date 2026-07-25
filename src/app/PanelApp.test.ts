import { describe, expect, it } from "vitest";

import type { BufferedEvent } from "../core/EventBuffer.ts";
import { MockPanelPlatform } from "../platform/mock/MockPanelPlatform.ts";
import type { MockPort } from "../platform/mock/MockPort.ts";
import { MESSAGE_TYPE } from "../protocol/messages.ts";
import { buffered } from "../testing/events.ts";
import { flush } from "../testing/flush.ts";
import { PanelApp } from "./PanelApp.ts";

/* oxlint-disable unicorn/require-post-message-target-origin -- PortLike, not window */

type Setup = {
	platform: MockPanelPlatform;
	app: PanelApp;
	resets: BufferedEvent[][];
	appends: BufferedEvent[][];
	tabs: (number | null)[];
	backgroundEnds: MockPort[];
	sentTo: (end: MockPort) => unknown[];
};

async function startApp(activeTabId: number | null): Promise<Setup> {
	const platform = new MockPanelPlatform();
	platform.activeTabId = activeTabId;

	const backgroundEnds: MockPort[] = [];
	const sent = new Map<MockPort, unknown[]>();
	platform.onConnect = (end) => {
		backgroundEnds.push(end);
		const messages: unknown[] = [];
		end.onMessage((m) => messages.push(m));
		sent.set(end, messages);
	};

	const resets: BufferedEvent[][] = [];
	const appends: BufferedEvent[][] = [];
	const tabs: (number | null)[] = [];
	const app = new PanelApp({
		platform,
		onReset: (e) => resets.push(e),
		onAppend: (e) => appends.push(e),
		onTabSwitched: (t) => tabs.push(t),
	});
	await app.start();

	return {
		platform,
		app,
		resets,
		appends,
		tabs,
		backgroundEnds,
		sentTo: (end) => sent.get(end) ?? [],
	};
}

// Puts the panel in the state it's in after a normal startup replay.
function replay(end: MockPort, tabId: number, payloads: object[]): BufferedEvent[] {
	const events = buffered(payloads);
	end.postMessage({ type: MESSAGE_TYPE.RESET, tabId, generation: 0, events });
	return events;
}

describe("PanelApp startup", () => {
	it("requests the active tab's buffer from scratch", async () => {
		const { backgroundEnds, sentTo, tabs } = await startApp(4);

		expect(sentTo(backgroundEnds[0]!)).toEqual([{ type: MESSAGE_TYPE.REQUEST, tabId: 4 }]);
		expect(tabs).toEqual([4]);
	});

	it("requests nothing when the window has no tab", async () => {
		const { backgroundEnds, sentTo, tabs } = await startApp(null);

		expect(sentTo(backgroundEnds[0]!)).toEqual([]);
		expect(tabs).toEqual([]);
	});
});

describe("PanelApp incoming messages", () => {
	it("applies a reset for the current tab", async () => {
		const { backgroundEnds, resets } = await startApp(4);

		const events = replay(backgroundEnds[0]!, 4, [
			{ event: "gtm.js" },
			{ event: "view_promotion" },
		]);

		expect(resets).toEqual([events]);
	});

	it("drops a stale reset for another tab", async () => {
		const { backgroundEnds, resets } = await startApp(4);

		replay(backgroundEnds[0]!, 9, [{ event: "remove_from_cart" }]);

		expect(resets).toEqual([]);
	});

	it("forwards live events for the current tab only", async () => {
		const { backgroundEnds, appends } = await startApp(4);
		replay(backgroundEnds[0]!, 4, [{ event: "gtm.js" }]);
		const [live] = buffered([{ event: "search", search_term: "desk" }], { from: 2 });

		backgroundEnds[0]!.postMessage({
			type: MESSAGE_TYPE.EVENT,
			tabId: 4,
			generation: 0,
			event: live,
		});
		backgroundEnds[0]!.postMessage({
			type: MESSAGE_TYPE.EVENT,
			tabId: 9,
			generation: 0,
			event: buffered([{ event: "share" }])[0],
		});

		expect(appends).toEqual([[live]]);
	});

	it("closes the panel when the background says so", async () => {
		const { platform, backgroundEnds } = await startApp(4);

		backgroundEnds[0]!.postMessage({ type: MESSAGE_TYPE.CLOSE });

		expect(platform.closed).toBe(true);
	});
});

describe("PanelApp resyncing", () => {
	it("appends the events it missed while the worker was gone", async () => {
		const { backgroundEnds, resets, appends } = await startApp(4);
		replay(backgroundEnds[0]!, 4, [{ event: "gtm.js" }]);
		const missed = buffered([{ event: "page_view" }, { event: "scroll" }], { from: 2 });

		backgroundEnds[0]!.postMessage({
			type: MESSAGE_TYPE.SYNC,
			tabId: 4,
			generation: 0,
			events: missed,
		});

		expect(appends).toEqual([missed]);
		expect(resets).toHaveLength(1);
	});

	it("ignores a sync that carries nothing", async () => {
		const { backgroundEnds, appends, sentTo } = await startApp(4);
		replay(backgroundEnds[0]!, 4, [{ event: "gtm.js" }]);

		backgroundEnds[0]!.postMessage({
			type: MESSAGE_TYPE.SYNC,
			tabId: 4,
			generation: 0,
			events: [],
		});

		expect(appends).toEqual([]);
		expect(sentTo(backgroundEnds[0]!)).toEqual([{ type: MESSAGE_TYPE.REQUEST, tabId: 4 }]);
	});
});

describe("PanelApp resync fallbacks", () => {
	it("asks for a full buffer when events would leave a gap", async () => {
		const { backgroundEnds, appends, sentTo } = await startApp(4);
		replay(backgroundEnds[0]!, 4, [{ event: "gtm.js" }]);

		backgroundEnds[0]!.postMessage({
			type: MESSAGE_TYPE.EVENT,
			tabId: 4,
			generation: 0,
			event: buffered([{ event: "scroll" }], { from: 9 })[0],
		});

		expect(appends).toEqual([]);
		expect(sentTo(backgroundEnds[0]!)).toEqual([
			{ type: MESSAGE_TYPE.REQUEST, tabId: 4 },
			{ type: MESSAGE_TYPE.REQUEST, tabId: 4 },
		]);
	});

	it("asks for a full buffer when the generation moved on", async () => {
		const { backgroundEnds, appends, sentTo } = await startApp(4);
		replay(backgroundEnds[0]!, 4, [{ event: "gtm.js" }]);

		backgroundEnds[0]!.postMessage({
			type: MESSAGE_TYPE.EVENT,
			tabId: 4,
			generation: 1,
			event: buffered([{ event: "gtm.js" }])[0],
		});

		expect(appends).toEqual([]);
		expect(sentTo(backgroundEnds[0]!)).toEqual([
			{ type: MESSAGE_TYPE.REQUEST, tabId: 4 },
			{ type: MESSAGE_TYPE.REQUEST, tabId: 4 },
		]);
	});
});

describe("PanelApp tab switching", () => {
	it("switches and requests the new tab's buffer from scratch", async () => {
		const { platform, backgroundEnds, sentTo, tabs } = await startApp(4);
		replay(backgroundEnds[0]!, 4, [{ event: "gtm.js" }]);

		platform.switchToTab(7);
		await flush();

		expect(tabs).toEqual([4, 7]);
		expect(sentTo(backgroundEnds[0]!)).toEqual([
			{ type: MESSAGE_TYPE.REQUEST, tabId: 4 },
			{ type: MESSAGE_TYPE.REQUEST, tabId: 7 },
		]);
	});

	it("ignores activation of the tab it already shows", async () => {
		const { platform, tabs } = await startApp(4);

		platform.switchToTab(4);
		await flush();

		expect(tabs).toEqual([4]);
	});
});

describe("PanelApp reconnection", () => {
	it("resumes from its cursor when the port drops", async () => {
		const { backgroundEnds, sentTo } = await startApp(4);
		replay(backgroundEnds[0]!, 4, [{ event: "gtm.js" }, { event: "page_view" }]);

		backgroundEnds[0]!.disconnect();

		expect(backgroundEnds).toHaveLength(2);
		expect(sentTo(backgroundEnds[1]!)).toEqual([
			{ type: MESSAGE_TYPE.REQUEST, tabId: 4, cursor: { generation: 0, seq: 2 } },
		]);
	});

	it("requests from scratch when it has nothing to resume from", async () => {
		const { backgroundEnds, sentTo } = await startApp(4);

		backgroundEnds[0]!.disconnect();

		expect(sentTo(backgroundEnds[1]!)).toEqual([{ type: MESSAGE_TYPE.REQUEST, tabId: 4 }]);
	});

	it("requests nothing when the window has no tab", async () => {
		const { backgroundEnds, sentTo } = await startApp(null);

		backgroundEnds[0]!.disconnect();

		expect(sentTo(backgroundEnds[1]!)).toEqual([]);
	});
});

describe("PanelApp clearing", () => {
	it("asks the background to clear the current tab", async () => {
		const { app, backgroundEnds, sentTo } = await startApp(4);

		app.clearCurrentTab();

		expect(sentTo(backgroundEnds[0]!)).toEqual([
			{ type: MESSAGE_TYPE.REQUEST, tabId: 4 },
			{ type: MESSAGE_TYPE.CLEAR, tabId: 4 },
		]);
	});
});
