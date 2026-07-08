// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilterState } from "../core/FilterState.ts";
import { Log } from "../core/Log.ts";
import { MockSyncKeyValueStore } from "../platform/mock/MockSyncKeyValueStore.ts";
import { PanelView } from "./PanelView.ts";

type Setup = {
	log: Log;
	filter: FilterState;
	cleared: { count: number };
};

function setup(): Setup {
	document.body.innerHTML = "";
	const log = new Log();
	const filter = new FilterState(new MockSyncKeyValueStore());
	const cleared = { count: 0 };
	const panel = new PanelView({ log, filter, onClear: () => cleared.count++ });
	panel.mount(document.body);
	return { log, filter, cleared };
}

const rows = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>(".layr__entry")];
const visibleRows = (): HTMLElement[] => rows().filter((r) => !r.hidden);
const countText = (): string | null | undefined =>
	document.querySelector(".layr__count")?.textContent;

afterEach(() => {
	vi.useRealTimers();
});

describe("PanelView rendering", () => {
	it("renders appended entries in order with a total count", () => {
		const { log } = setup();

		log.append({ event: "page_view" });
		log.append({ event: "view_item", item_id: "SKU-77" });

		expect(rows()).toHaveLength(2);
		expect(rows()[0]?.textContent).toContain("page_view");
		expect(rows()[1]?.textContent).toContain("view_item");
		expect(countText()).toBe("2");
	});

	it("rebuilds the list on reset", () => {
		const { log } = setup();
		log.append({ event: "stale_before_reload" });

		log.reset([{ event: "gtm.js" }, { event: "gtm.dom" }]);

		expect(rows()).toHaveLength(2);
		expect(document.body.textContent).not.toContain("stale_before_reload");
	});

	it("empties the list on clear", () => {
		const { log } = setup();
		log.append({ event: "sign_up" });

		log.clear();

		expect(rows()).toHaveLength(0);
		expect(countText()).toBe("0");
	});
});

describe("PanelView filtering", () => {
	it("hides non-matching rows and shows the filtered count", () => {
		const { log, filter } = setup();
		log.append({ event: "page_view" });
		log.append({ event: "purchase", value: 120 });

		filter.setQuery("purchase");

		expect(visibleRows()).toHaveLength(1);
		expect(visibleRows()[0]?.textContent).toContain("purchase");
		expect(countText()).toBe("1 / 2");
	});

	it("applies the active query to entries appended later", () => {
		const { log, filter } = setup();
		filter.setQuery("purchase");

		log.append({ event: "page_view" });
		log.append({ event: "purchase" });

		expect(visibleRows()).toHaveLength(1);
		expect(countText()).toBe("1 / 2");
	});

	it("restores all rows when the query clears", () => {
		const { log, filter } = setup();
		log.append({ event: "page_view" });
		log.append({ event: "purchase" });
		filter.setQuery("purchase");

		filter.setQuery("");

		expect(visibleRows()).toHaveLength(2);
		expect(countText()).toBe("2");
	});

	it("applies typed input after the debounce", () => {
		vi.useFakeTimers();
		const { filter } = setup();
		const input = document.querySelector<HTMLInputElement>(".layr__filter")!;
		input.value = "gtm";

		input.dispatchEvent(new Event("input"));
		vi.advanceTimersByTime(300);

		expect(filter.query.value).toBe("gtm");
	});
});

describe("PanelView clearing", () => {
	it("forwards the Clear click to onClear", () => {
		const { cleared } = setup();

		document.querySelector<HTMLButtonElement>(".layr__btn--clear")?.click();

		expect(cleared.count).toBe(1);
	});
});
