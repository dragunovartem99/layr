import { describe, expect, it } from "vitest";

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

describe("BackgroundApp buffering", () => {
	it("replays a tab's buffered events when a panel requests them", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		pushEvent(platform, 21, { event: "page_view" });
		pushEvent(platform, 21, { event: "add_to_cart" });
		await flush();
		const { panel, received } = connectPanel(platform);

		panel.postMessage({ type: MESSAGE_TYPE.REQUEST, tabId: 21 });
		await flush();

		expect(received).toEqual([
			{
				type: MESSAGE_TYPE.RESET,
				tabId: 21,
				events: [{ event: "page_view" }, { event: "add_to_cart" }],
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
				payload: { event: "purchase", transaction_id: "T-1207" },
			},
		]);
	});

	it("normalizes an unserializable payload to an empty object", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		const { received } = connectPanel(platform);

		pushEvent(platform, 6, null);
		await flush();

		expect(received).toEqual([{ type: MESSAGE_TYPE.EVENT, tabId: 6, payload: {} }]);
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
		panel.postMessage({ type: MESSAGE_TYPE.REQUEST, tabId: 17 });
		await flush();

		expect(received).toEqual([{ type: MESSAGE_TYPE.RESET, tabId: 17, events: [] }]);
	});

	it("clears a tab's buffer on panel request and notifies panels", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		pushEvent(platform, 11, { event: "login" });
		await flush();
		const { panel, received } = connectPanel(platform);

		panel.postMessage({ type: MESSAGE_TYPE.CLEAR, tabId: 11 });
		await flush();

		expect(received).toEqual([{ type: MESSAGE_TYPE.RESET, tabId: 11, events: [] }]);
	});

	it("forgets a tab's buffer when the tab closes", async () => {
		const platform = new MockBackgroundPlatform();
		startApp(platform);
		pushEvent(platform, 30, { event: "sign_up" });
		await flush();

		platform.emitTabRemoved(30);
		await flush();
		const { panel, received } = connectPanel(platform);
		panel.postMessage({ type: MESSAGE_TYPE.REQUEST, tabId: 30 });
		await flush();

		expect(received).toEqual([{ type: MESSAGE_TYPE.RESET, tabId: 30, events: [] }]);
	});
});

describe("BackgroundApp worker restart", () => {
	it("serves events buffered before the restart", async () => {
		const store = new MockKeyValueStore();
		const before = new MockBackgroundPlatform({ store });
		startApp(before);
		pushEvent(before, 9, { event: "purchase", value: 89 });
		await flush();

		const after = new MockBackgroundPlatform({ store });
		startApp(after);
		const { panel, received } = connectPanel(after);
		panel.postMessage({ type: MESSAGE_TYPE.REQUEST, tabId: 9 });
		await flush();

		expect(received).toEqual([
			{ type: MESSAGE_TYPE.RESET, tabId: 9, events: [{ event: "purchase", value: 89 }] },
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
