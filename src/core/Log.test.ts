import { describe, expect, it } from "vitest";

import { Log } from "./Log.ts";

describe("Log", () => {
	it("appends entries with sequential order numbers", () => {
		const log = new Log();

		log.append({ event: "page_view" });
		log.append({ event: "select_item", item_id: "SKU-330" });

		expect(log.entries.value.map((e) => e.order)).toEqual([1, 2]);
		expect(log.entries.value.map((e) => e.eventName)).toEqual(["page_view", "select_item"]);
	});

	it("replaces all entries and renumbers on reset", () => {
		const log = new Log();
		log.append({ event: "stale_before_reset" });

		log.reset([{ event: "gtm.js" }, { event: "gtm.dom" }, { event: "gtm.load" }]);

		expect(log.entries.value.map((e) => e.order)).toEqual([1, 2, 3]);
		expect(log.entries.value.map((e) => e.eventName)).toEqual([
			"gtm.js",
			"gtm.dom",
			"gtm.load",
		]);
	});

	it("empties on clear", () => {
		const log = new Log();
		log.append({ event: "view_cart" });

		log.clear();

		expect(log.entries.value).toEqual([]);
	});

	it("notifies subscribers on every mutation", () => {
		const log = new Log();
		const lengths: number[] = [];
		log.entries.subscribe((entries) => lengths.push(entries.length));

		log.append({ event: "login" });
		log.reset([{ event: "a" }, { event: "b" }]);
		log.clear();

		expect(lengths).toEqual([1, 2, 0]);
	});
});
