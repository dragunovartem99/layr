import { describe, expect, it } from "vitest";

import { MockBackgroundPlatform } from "../platform/mock/MockBackgroundPlatform.ts";
import { MockKeyValueStore } from "../platform/mock/MockKeyValueStore.ts";
import { MESSAGE_TYPE } from "../protocol/messages.ts";
import { startApp, connectPanel, pushEvent, request, ev } from "../testing/background.ts";
import { flush } from "../testing/flush.ts";

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
