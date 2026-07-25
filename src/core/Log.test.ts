import { describe, expect, it } from "vitest";

import { buffered } from "../testing/events.ts";
import { Log } from "./Log.ts";

describe("Log appending", () => {
	it("appends entries with sequential order numbers", () => {
		const log = new Log();

		log.append(buffered([{ event: "page_view" }]));
		log.append(buffered([{ event: "select_item", item_id: "SKU-330" }], { from: 2 }));

		expect(log.entries.value.map((e) => e.order)).toEqual([1, 2]);
		expect(log.entries.value.map((e) => e.eventName)).toEqual(["page_view", "select_item"]);
	});

	it("keeps existing entries when appending", () => {
		const log = new Log();
		log.append(buffered([{ event: "gtm.js" }]));
		const [first] = log.entries.value;

		log.append(buffered([{ event: "gtm.dom" }], { from: 2 }));

		expect(log.entries.value[0]).toBe(first);
	});
});

describe("Log timestamps", () => {
	it("stamps entries with the time the event was captured, not replayed", () => {
		const log = new Log();
		const capturedAt = new Date(2024, 0, 1, 12, 34, 56, 789).getTime();

		log.append([{ seq: 1, at: capturedAt, payload: { event: "purchase" } }]);

		expect(log.entries.value[0]!.timestamp).toBe("12:34:56.789");
	});

	it("ignores an empty append", () => {
		const log = new Log();
		log.append(buffered([{ event: "login" }]));
		const before = log.entries.value;

		log.append([]);

		expect(log.entries.value).toBe(before);
	});
});

describe("Log replacing", () => {
	it("replaces all entries and renumbers on reset", () => {
		const log = new Log();
		log.append(buffered([{ event: "stale_before_reset" }]));

		log.reset(buffered([{ event: "gtm.js" }, { event: "gtm.dom" }, { event: "gtm.load" }]));

		expect(log.entries.value.map((e) => e.order)).toEqual([1, 2, 3]);
		expect(log.entries.value.map((e) => e.eventName)).toEqual([
			"gtm.js",
			"gtm.dom",
			"gtm.load",
		]);
	});

	it("empties on clear", () => {
		const log = new Log();
		log.append(buffered([{ event: "view_cart" }]));

		log.clear();

		expect(log.entries.value).toEqual([]);
	});

	it("notifies subscribers on every mutation", () => {
		const log = new Log();
		const lengths: number[] = [];
		log.entries.subscribe((entries) => lengths.push(entries.length));

		log.append(buffered([{ event: "login" }]));
		log.reset(buffered([{ event: "a" }, { event: "b" }]));
		log.clear();

		expect(lengths).toEqual([1, 2, 0]);
	});
});
