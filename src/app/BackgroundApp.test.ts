import { describe, expect, it } from "vitest";

import type { Cursor } from "../core/EventBuffer.ts";
import { MockBackgroundPlatform } from "../platform/mock/MockBackgroundPlatform.ts";
import { MockKeyValueStore } from "../platform/mock/MockKeyValueStore.ts";
import { MockPort } from "../platform/mock/MockPort.ts";
import { MESSAGE_TYPE } from "../protocol/messages.ts";
import { flush } from "../testing/flush.ts";
import { BackgroundApp } from "./BackgroundApp.ts";

/* oxlint-disable unicorn/require-post-message-target-origin -- PortLike, not window */

function startApp(platform: MockBackgroundPlatform): BackgroundApp {
	const app = new BackgroundApp(platform);
	app.start();
	return app;
}

function connectPanel(platform: MockBackgroundPlatform): {
	panel: MockPort;
	received: unknown[];
} {
	const [panel, backgroundEnd] = MockPort.pair();
	const received: unknown[] = [];
	panel.onMessage((m) => received.push(m));
	platform.emitPanelConnect(backgroundEnd);
	return { panel, received };
}

function pushEvent(platform: MockBackgroundPlatform, tabId: number, payload: object | null): void {
	platform.emitContentMessage({ type: MESSAGE_TYPE.EVENT, payload }, tabId);
}

function request(panel: MockPort, tabId: number, cursor?: Cursor): void {
	panel.postMessage(
		cursor
			? { type: MESSAGE_TYPE.REQUEST, tabId, cursor }
			: { type: MESSAGE_TYPE.REQUEST, tabId }
	);
}

// A buffered event as it goes over the wire; capture time isn't asserted.
const ev = (seq: number, payload: object): object => ({ seq, at: expect.any(Number), payload });

describe("BackgroundApp buffering", () => {
	it("replays a tab's buffered events when a panel requests them", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		pushEvent(platform, 21, { event: "page_view" });
		pushEvent(platform, 21, { event: "add_to_cart" });
		await flush();
		const { panel, received } = connectPanel(platform);

		request(panel, 21);
		await flush();

		expect(received).toEqual([
			{
				type: MESSAGE_TYPE.RESET,
				tabId: 21,
				generation: 0,
				events: [ev(1, { event: "page_view" }), ev(2, { event: "add_to_cart" })],
			},
		]);
	});

	it("broadcasts a live event to connected panels", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		const { received } = connectPanel(platform);

		pushEvent(platform, 3, { event: "purchase", transaction_id: "T-1207" });
		await flush();

		expect(received).toEqual([
			{
				type: MESSAGE_TYPE.EVENT,
				tabId: 3,
				generation: 0,
				event: ev(1, { event: "purchase", transaction_id: "T-1207" }),
			},
		]);
	});
});

describe("BackgroundApp payload normalization", () => {
	it("normalizes an unserializable payload to an empty object", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		const { received } = connectPanel(platform);

		pushEvent(platform, 6, null);
		await flush();

		expect(received).toEqual([
			{ type: MESSAGE_TYPE.EVENT, tabId: 6, generation: 0, event: ev(1, {}) },
		]);
	});
});

describe("BackgroundApp resuming a panel", () => {
	it("sends only the events a returning panel missed", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		pushEvent(platform, 21, { event: "gtm.js" });
		pushEvent(platform, 21, { event: "page_view" });
		await flush();
		const { panel, received } = connectPanel(platform);

		request(panel, 21, { generation: 0, seq: 1 });
		await flush();

		expect(received).toEqual([
			{
				type: MESSAGE_TYPE.SYNC,
				tabId: 21,
				generation: 0,
				events: [ev(2, { event: "page_view" })],
			},
		]);
	});

	it("sends an empty sync to a panel that missed nothing", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		pushEvent(platform, 21, { event: "gtm.js" });
		await flush();
		const { panel, received } = connectPanel(platform);

		request(panel, 21, { generation: 0, seq: 1 });
		await flush();

		expect(received).toEqual([
			{ type: MESSAGE_TYPE.SYNC, tabId: 21, generation: 0, events: [] },
		]);
	});
});

describe("BackgroundApp resync fallback", () => {
	it("falls back to a full reset when the cursor is from a dropped buffer", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		pushEvent(platform, 21, { event: "gtm.js" });
		await flush();
		platform.emitContentMessage({ type: MESSAGE_TYPE.NAVIGATE }, 21);
		pushEvent(platform, 21, { event: "gtm.js" });
		await flush();
		const { panel, received } = connectPanel(platform);

		request(panel, 21, { generation: 0, seq: 1 });
		await flush();

		expect(received).toEqual([
			{
				type: MESSAGE_TYPE.RESET,
				tabId: 21,
				generation: 1,
				events: [ev(1, { event: "gtm.js" })],
			},
		]);
	});
});

describe("BackgroundApp buffer lifecycle", () => {
	it("drops a tab's buffer when the page fully reloads", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		pushEvent(platform, 17, { event: "view_item" });
		await flush();

		platform.emitContentMessage({ type: MESSAGE_TYPE.NAVIGATE }, 17);
		await flush();
		const { panel, received } = connectPanel(platform);
		request(panel, 17);
		await flush();

		expect(received).toEqual([
			{ type: MESSAGE_TYPE.RESET, tabId: 17, generation: 1, events: [] },
		]);
	});

	it("clears a tab's buffer on panel request and notifies panels", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		pushEvent(platform, 11, { event: "login" });
		await flush();
		const { panel, received } = connectPanel(platform);

		panel.postMessage({ type: MESSAGE_TYPE.CLEAR, tabId: 11 });
		await flush();

		expect(received).toEqual([
			{ type: MESSAGE_TYPE.RESET, tabId: 11, generation: 1, events: [] },
		]);
	});

	it("forgets a tab's buffer when the tab closes", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		pushEvent(platform, 30, { event: "sign_up" });
		await flush();

		platform.emitTabRemoved(30);
		await flush();
		const { panel, received } = connectPanel(platform);
		request(panel, 30);
		await flush();

		expect(received).toEqual([
			{ type: MESSAGE_TYPE.RESET, tabId: 30, generation: 0, events: [] },
		]);
	});
});

describe("BackgroundApp worker restart", () => {
	it("resumes across a worker restart", async () => {
		const store = new MockKeyValueStore();
		const before = new MockBackgroundPlatform({ store });
		startApp(before);
		pushEvent(before, 9, { event: "gtm.js" });
		await flush();

		const after = new MockBackgroundPlatform({ store });
		startApp(after);
		pushEvent(after, 9, { event: "purchase", value: 89 });
		await flush();
		const { panel, received } = connectPanel(after);
		request(panel, 9, { generation: 0, seq: 1 });
		await flush();

		expect(received).toEqual([
			{
				type: MESSAGE_TYPE.SYNC,
				tabId: 9,
				generation: 0,
				events: [ev(2, { event: "purchase", value: 89 })],
			},
		]);
	});

	it("serves events buffered before the restart", async () => {
		const store = new MockKeyValueStore();
		const before = new MockBackgroundPlatform({ store });
		startApp(before);
		pushEvent(before, 9, { event: "purchase", value: 89 });
		await flush();

		const after = new MockBackgroundPlatform({ store });
		startApp(after);
		const { panel, received } = connectPanel(after);
		request(panel, 9);
		await flush();

		expect(received).toEqual([
			{
				type: MESSAGE_TYPE.RESET,
				tabId: 9,
				generation: 0,
				events: [ev(1, { event: "purchase", value: 89 })],
			},
		]);
	});
});

describe("BackgroundApp action clicks", () => {
	it("opens the side panel when no panel is connected", () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);

		platform.emitActionClicked(44);

		expect(platform.openedPanels).toEqual([44]);
	});

	it("closes connected panels instead of opening another", () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		const { received } = connectPanel(platform);

		platform.emitActionClicked(44);

		expect(received).toEqual([{ type: MESSAGE_TYPE.CLOSE }]);
		expect(platform.openedPanels).toEqual([]);
	});
});

describe("BackgroundApp disconnected panels", () => {
	it("stops broadcasting to a panel after it disconnects", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		const { panel, received } = connectPanel(platform);

		panel.disconnect();
		pushEvent(platform, 5, { event: "scroll" });
		await flush();

		expect(received).toEqual([]);
	});
});
