import { describe, expect, it } from "vitest";

import { MESSAGE_TYPE } from "../protocol/messages.ts";
import { flush } from "../testing/flush.ts";
import { startApp, replay } from "../testing/panelApp.ts";

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
