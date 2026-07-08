import { describe, expect, it } from "vitest";

import { MockPanelPlatform } from "../platform/mock/MockPanelPlatform.ts";
import type { MockPort } from "../platform/mock/MockPort.ts";
import { MESSAGE_TYPE } from "../protocol/messages.ts";
import { flush } from "../testing/flush.ts";
import { PanelApp } from "./PanelApp.ts";

/* oxlint-disable unicorn/require-post-message-target-origin -- PortLike, not window */

type Setup = {
	platform: MockPanelPlatform;
	app: PanelApp;
	resets: object[][];
	events: object[];
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

	const resets: object[][] = [];
	const events: object[] = [];
	const tabs: (number | null)[] = [];
	const app = new PanelApp({
		platform,
		onReset: (e) => resets.push(e),
		onEvent: (p) => events.push(p),
		onTabSwitched: (t) => tabs.push(t),
	});
	await app.start();

	return {
		platform,
		app,
		resets,
		events,
		tabs,
		backgroundEnds,
		sentTo: (end) => sent.get(end) ?? [],
	};
}

describe("PanelApp startup", () => {
	it("requests the active tab's buffer", async () => {
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

		backgroundEnds[0]!.postMessage({
			type: MESSAGE_TYPE.RESET,
			tabId: 4,
			events: [{ event: "gtm.js" }, { event: "view_promotion" }],
		});

		expect(resets).toEqual([[{ event: "gtm.js" }, { event: "view_promotion" }]]);
	});

	it("drops a stale reset for another tab", async () => {
		const { backgroundEnds, resets } = await startApp(4);

		backgroundEnds[0]!.postMessage({
			type: MESSAGE_TYPE.RESET,
			tabId: 9,
			events: [{ event: "remove_from_cart" }],
		});

		expect(resets).toEqual([]);
	});

	it("forwards live events for the current tab only", async () => {
		const { backgroundEnds, events } = await startApp(4);

		backgroundEnds[0]!.postMessage({
			type: MESSAGE_TYPE.EVENT,
			tabId: 4,
			payload: { event: "search", search_term: "desk" },
		});
		backgroundEnds[0]!.postMessage({
			type: MESSAGE_TYPE.EVENT,
			tabId: 9,
			payload: { event: "share" },
		});

		expect(events).toEqual([{ event: "search", search_term: "desk" }]);
	});

	it("closes the panel when the background says so", async () => {
		const { platform, backgroundEnds } = await startApp(4);

		backgroundEnds[0]!.postMessage({ type: MESSAGE_TYPE.CLOSE });

		expect(platform.closed).toBe(true);
	});
});

describe("PanelApp tab switching", () => {
	it("switches and requests the new tab's buffer", async () => {
		const { platform, backgroundEnds, sentTo, tabs } = await startApp(4);

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
	it("reconnects and re-requests the current tab when the port drops", async () => {
		const { backgroundEnds, sentTo } = await startApp(4);

		backgroundEnds[0]!.disconnect();

		expect(backgroundEnds).toHaveLength(2);
		expect(sentTo(backgroundEnds[1]!)).toEqual([{ type: MESSAGE_TYPE.REQUEST, tabId: 4 }]);
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
