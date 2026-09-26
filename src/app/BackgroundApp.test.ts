import { describe, expect, it } from "vitest";

import { MockBackgroundPlatform } from "../platform/mock/MockBackgroundPlatform.ts";
import { MESSAGE_TYPE } from "../protocol/messages.ts";
import { startApp, connectPanel, pushEvent, request, ev } from "../testing/background.ts";
import { flush } from "../testing/flush.ts";

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
