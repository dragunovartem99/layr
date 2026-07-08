import { describe, expect, it } from "vitest";

import { MockSyncKeyValueStore } from "../platform/mock/MockSyncKeyValueStore.ts";
import { FilterState } from "./FilterState.ts";

function makeFilter(): { filter: FilterState; store: MockSyncKeyValueStore } {
	const store = new MockSyncKeyValueStore();
	return { filter: new FilterState(store), store };
}

describe("FilterState", () => {
	it("persists the query for the loaded tab", () => {
		const { filter, store } = makeFilter();
		filter.loadForTab(12);

		filter.setQuery("ecommerce");

		expect(store.get("layr-filter:12")).toBe("ecommerce");
	});

	it("restores the saved query when switching back to a tab", () => {
		const { filter } = makeFilter();
		filter.loadForTab(12);
		filter.setQuery("purchase");
		filter.loadForTab(3);

		filter.loadForTab(12);

		expect(filter.query.value).toBe("purchase");
	});

	it("starts blank on a tab without a saved query", () => {
		const { filter } = makeFilter();
		filter.loadForTab(12);
		filter.setQuery("checkout");

		filter.loadForTab(99);

		expect(filter.query.value).toBe("");
	});
});

describe("FilterState clearing", () => {
	it("clears the query and its stored copy on reset", () => {
		const { filter, store } = makeFilter();
		filter.loadForTab(7);
		filter.setQuery("gtm.click");

		filter.reset();

		expect(filter.query.value).toBe("");
		expect(store.get("layr-filter:7")).toBeNull();
	});

	it("does not persist while no tab is loaded", () => {
		const { filter, store } = makeFilter();

		filter.setQuery("user_id");

		expect(filter.query.value).toBe("user_id");
		expect(store.get("layr-filter:0")).toBeNull();
	});
});
