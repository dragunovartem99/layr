import { describe, expect, it } from "vitest";

import { EventBuffer } from "./EventBuffer.ts";

describe("EventBuffer", () => {
	it("returns appended events for a tab in order", () => {
		const buffer = new EventBuffer();

		buffer.append({ tabId: 5, payload: { event: "gtm.js" } });
		buffer.append({ tabId: 5, payload: { event: "page_view" } });

		expect(buffer.get(5)).toEqual([{ event: "gtm.js" }, { event: "page_view" }]);
	});

	it("returns an empty list for an unknown tab", () => {
		const buffer = new EventBuffer();

		expect(buffer.get(99)).toEqual([]);
	});

	it("keeps tabs isolated from each other", () => {
		const buffer = new EventBuffer();

		buffer.append({ tabId: 1, payload: { event: "login" } });
		buffer.append({ tabId: 2, payload: { event: "sign_up" } });

		expect(buffer.get(1)).toEqual([{ event: "login" }]);
		expect(buffer.get(2)).toEqual([{ event: "sign_up" }]);
	});

	it("evicts the oldest event once the limit is reached", () => {
		const buffer = new EventBuffer({ limit: 2 });

		buffer.append({ tabId: 7, payload: { event: "view_item" } });
		buffer.append({ tabId: 7, payload: { event: "add_to_cart" } });
		buffer.append({ tabId: 7, payload: { event: "begin_checkout" } });

		expect(buffer.get(7)).toEqual([{ event: "add_to_cart" }, { event: "begin_checkout" }]);
	});

	it("clears a single tab without touching others", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 3, payload: { event: "purchase" } });
		buffer.append({ tabId: 4, payload: { event: "refund" } });

		buffer.clear(3);

		expect(buffer.get(3)).toEqual([]);
		expect(buffer.get(4)).toEqual([{ event: "refund" }]);
	});
});

describe("EventBuffer persistence", () => {
	it("round-trips through snapshot and restore", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 12, payload: { event: "scroll", percent: 75 } });
		const restored = new EventBuffer();

		restored.restore(buffer.toJSON());

		expect(restored.get(12)).toEqual([{ event: "scroll", percent: 75 }]);
	});

	it("drops a deleted tab from the snapshot", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 8, payload: { event: "gtm.load" } });

		buffer.delete(8);

		expect(buffer.toJSON()).toEqual({});
	});
});
