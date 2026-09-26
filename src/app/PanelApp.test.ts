/* oxlint-disable unicorn/require-post-message-target-origin -- PortLike, not window */
import { describe, expect, it } from "vitest";

import { MESSAGE_TYPE } from "../protocol/messages.ts";
import { buffered } from "../testing/events.ts";
import { startApp, replay } from "../testing/panelApp.ts";

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
