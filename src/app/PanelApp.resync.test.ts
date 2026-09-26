/* oxlint-disable unicorn/require-post-message-target-origin -- PortLike, not window */
import { describe, expect, it } from "vitest";

import { MESSAGE_TYPE } from "../protocol/messages.ts";
import { buffered } from "../testing/events.ts";
import { startApp, replay } from "../testing/panelApp.ts";

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
