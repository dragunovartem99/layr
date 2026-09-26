import { describe, expect, it } from "vitest";

import { payloads } from "../testing/buffer.ts";
import { EventBuffer } from "./EventBuffer.ts";

describe("EventBuffer", () => {
	it("returns appended events for a tab in order", () => {
		const buffer = new EventBuffer();

		buffer.append({ tabId: 5, payload: { event: "gtm.js" } });
		buffer.append({ tabId: 5, payload: { event: "page_view" } });

		expect(payloads(buffer, 5)).toEqual([{ event: "gtm.js" }, { event: "page_view" }]);
	});

	it("numbers events within a tab so readers can resume", () => {
		const buffer = new EventBuffer();

		buffer.append({ tabId: 5, payload: { event: "gtm.js" } });
		const second = buffer.append({ tabId: 5, payload: { event: "page_view" } });

		expect(second.seq).toBe(2);
		expect(buffer.get(5).events.map((e) => e.seq)).toEqual([1, 2]);
	});

	it("returns an empty buffer for an unknown tab", () => {
		const buffer = new EventBuffer();

		expect(buffer.get(99)).toEqual({ generation: 0, events: [] });
	});

	it("keeps tabs isolated from each other", () => {
		const buffer = new EventBuffer();

		buffer.append({ tabId: 1, payload: { event: "login" } });
		buffer.append({ tabId: 2, payload: { event: "sign_up" } });

		expect(payloads(buffer, 1)).toEqual([{ event: "login" }]);
		expect(payloads(buffer, 2)).toEqual([{ event: "sign_up" }]);
	});
});

describe("EventBuffer eviction", () => {
	it("evicts the oldest event once the limit is reached", () => {
		const buffer = new EventBuffer({ limit: 2 });

		buffer.append({ tabId: 7, payload: { event: "view_item" } });
		buffer.append({ tabId: 7, payload: { event: "add_to_cart" } });
		buffer.append({ tabId: 7, payload: { event: "begin_checkout" } });

		expect(payloads(buffer, 7)).toEqual([
			{ event: "add_to_cart" },
			{ event: "begin_checkout" },
		]);
	});

	it("keeps numbering past an eviction", () => {
		const buffer = new EventBuffer({ limit: 2 });

		buffer.append({ tabId: 7, payload: { event: "view_item" } });
		buffer.append({ tabId: 7, payload: { event: "add_to_cart" } });
		buffer.append({ tabId: 7, payload: { event: "begin_checkout" } });

		expect(buffer.get(7).events.map((e) => e.seq)).toEqual([2, 3]);
	});
});

describe("EventBuffer clearing", () => {
	it("clears a single tab without touching others", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 3, payload: { event: "purchase" } });
		buffer.append({ tabId: 4, payload: { event: "refund" } });

		buffer.clear(3);

		expect(payloads(buffer, 3)).toEqual([]);
		expect(payloads(buffer, 4)).toEqual([{ event: "refund" }]);
	});

	it("starts a new generation on clear", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 3, payload: { event: "purchase" } });

		buffer.clear(3);

		expect(buffer.get(3).generation).toBe(1);
		expect(buffer.append({ tabId: 3, payload: { event: "page_view" } }).seq).toBe(1);
	});
});
