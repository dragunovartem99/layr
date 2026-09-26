import { describe, expect, it } from "vitest";

import { EventBuffer } from "./EventBuffer.ts";

describe("EventBuffer.since", () => {
	it("returns only the events after the cursor", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 2, payload: { event: "gtm.js" } });
		buffer.append({ tabId: 2, payload: { event: "page_view" } });
		buffer.append({ tabId: 2, payload: { event: "scroll" } });

		const missed = buffer.since(2, { generation: 0, seq: 1 });

		expect(missed?.map((e) => e.payload)).toEqual([
			{ event: "page_view" },
			{ event: "scroll" },
		]);
	});

	it("returns nothing when the cursor is current", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 2, payload: { event: "gtm.js" } });

		expect(buffer.since(2, { generation: 0, seq: 1 })).toEqual([]);
	});

	it("serves a cursor into an untouched tab", () => {
		const buffer = new EventBuffer();

		expect(buffer.since(2, { generation: 0, seq: 0 })).toEqual([]);
	});
});

describe("EventBuffer.since refusals", () => {
	it("refuses a cursor from a previous generation", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 2, payload: { event: "gtm.js" } });
		buffer.clear(2);

		expect(buffer.since(2, { generation: 0, seq: 1 })).toBeNull();
	});

	it("refuses a cursor whose next event has been evicted", () => {
		const buffer = new EventBuffer({ limit: 2 });
		buffer.append({ tabId: 2, payload: { event: "gtm.js" } });
		buffer.append({ tabId: 2, payload: { event: "page_view" } });
		buffer.append({ tabId: 2, payload: { event: "scroll" } });

		expect(buffer.since(2, { generation: 0, seq: 0 })).toBeNull();
		expect(buffer.since(2, { generation: 0, seq: 1 })).not.toBeNull();
	});

	it("refuses a cursor ahead of the buffer", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 2, payload: { event: "gtm.js" } });

		expect(buffer.since(2, { generation: 0, seq: 4 })).toBeNull();
	});
});

describe("EventBuffer persistence", () => {
	it("round-trips through snapshot and restore", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 12, payload: { event: "scroll", percent: 75 } });
		const restored = new EventBuffer();

		restored.restore(buffer.toJSON());

		expect(restored.get(12)).toEqual(buffer.get(12));
	});

	it("lets a cursor survive a worker restart", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 12, payload: { event: "gtm.js" } });
		const restored = new EventBuffer();
		restored.restore(buffer.toJSON());

		restored.append({ tabId: 12, payload: { event: "page_view" } });

		expect(restored.since(12, { generation: 0, seq: 1 })?.map((e) => e.payload)).toEqual([
			{ event: "page_view" },
		]);
	});

	it("drops a deleted tab from the snapshot", () => {
		const buffer = new EventBuffer();
		buffer.append({ tabId: 8, payload: { event: "gtm.load" } });

		buffer.delete(8);

		expect(buffer.toJSON()).toEqual({});
	});
});
