/* oxlint-disable unicorn/require-post-message-target-origin -- PortLike, not window */
import { describe, expect, it } from "vitest";

import { MockBackgroundPlatform } from "../platform/mock/MockBackgroundPlatform.ts";
import { MESSAGE_TYPE } from "../protocol/messages.ts";
import { startApp, connectPanel, pushEvent, request, ev } from "../testing/background.ts";
import { flush } from "../testing/flush.ts";

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
