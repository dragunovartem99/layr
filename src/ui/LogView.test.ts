// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { FilterState } from "../core/FilterState.ts";
import { Log } from "../core/Log.ts";
import { MockSyncKeyValueStore } from "../platform/mock/MockSyncKeyValueStore.ts";
import { buffered, pushEvents } from "../testing/events.ts";
import { LogView } from "./LogView.ts";

type Setup = {
	log: Log;
	filter: FilterState;
	list: HTMLElement;
};

function setup(): Setup {
	document.body.innerHTML = `<div><ol class="layr__log"></ol></div>`;
	const root = document.body.firstElementChild as HTMLElement;
	const log = new Log();
	const filter = new FilterState(new MockSyncKeyValueStore());
	new LogView({ log, filter }).mount(root);
	return { log, filter, list: root.querySelector(".layr__log")! };
}

function fakeScrollMetrics(
	list: HTMLElement,
	{ scrollTop, scrollHeight, clientHeight }: Record<string, number>
): void {
	Object.defineProperty(list, "scrollHeight", { value: scrollHeight, configurable: true });
	Object.defineProperty(list, "clientHeight", { value: clientHeight, configurable: true });
	list.scrollTop = scrollTop;
}

describe("LogView incremental rendering", () => {
	it("reuses existing row elements when entries are appended", () => {
		const { log, list } = setup();
		pushEvents(log, { event: "view_cart", value: 49.9 });
		const firstRow = list.children[0];

		pushEvents(log, { event: "begin_checkout" });

		expect(list.children).toHaveLength(2);
		expect(list.children[0]).toBe(firstRow);
	});

	it("rebuilds every row on reset", () => {
		const { log, list } = setup();
		pushEvents(log, { event: "stale_before_reload" });
		const staleRow = list.children[0];

		log.reset(buffered([{ event: "gtm.js" }, { event: "search", search_term: "boots" }]));

		expect(list.children).toHaveLength(2);
		expect([...list.children]).not.toContain(staleRow);
	});
});

describe("LogView scroll pinning", () => {
	it("keeps the list pinned to the bottom when the user is there", () => {
		const { log, list } = setup();
		fakeScrollMetrics(list, { scrollTop: 380, scrollHeight: 600, clientHeight: 200 });

		pushEvents(log, { event: "generate_lead", currency: "USD" });

		expect(list.scrollTop).toBe(600);
	});

	it("leaves the scroll position alone when the user scrolled up", () => {
		const { log, list } = setup();
		fakeScrollMetrics(list, { scrollTop: 100, scrollHeight: 600, clientHeight: 200 });

		pushEvents(log, { event: "purchase", transaction_id: "T-1042" });

		expect(list.scrollTop).toBe(100);
	});
});
