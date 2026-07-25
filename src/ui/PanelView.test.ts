// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilterState } from "../core/FilterState.ts";
import { DEFAULT_FONT_SCALE, FontScale, MIN_FONT_SCALE } from "../core/FontScale.ts";
import { Log } from "../core/Log.ts";
import { MockSyncKeyValueStore } from "../platform/mock/MockSyncKeyValueStore.ts";
import { buffered, pushEvents } from "../testing/events.ts";
import { PanelView } from "./PanelView.ts";

type Setup = {
	log: Log;
	filter: FilterState;
	fontScale: FontScale;
	cleared: { count: number };
};

function setup(): Setup {
	document.body.innerHTML = "";
	const log = new Log();
	const store = new MockSyncKeyValueStore();
	const filter = new FilterState(store);
	const fontScale = new FontScale(store);
	const cleared = { count: 0 };
	const panel = new PanelView({ log, filter, fontScale, onClear: () => cleared.count++ });
	panel.mount(document.body);
	return { log, filter, fontScale, cleared };
}

const rows = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>(".layr__entry")];
const visibleRows = (): HTMLElement[] => rows().filter((r) => !r.hidden);
const countText = (): string | null | undefined =>
	document.querySelector(".layr__count")?.textContent;
const panelRoot = (): HTMLElement => document.querySelector<HTMLElement>(".layr")!;
const settings = (): HTMLElement => document.querySelector<HTMLElement>(".layr__settings")!;
const button = (modifier: string): HTMLButtonElement =>
	document.querySelector<HTMLButtonElement>(`.layr__btn--${modifier}`)!;
const fontVar = (): string => panelRoot().style.getPropertyValue("--layr-font-scale");

afterEach(() => {
	vi.useRealTimers();
});

describe("PanelView rendering", () => {
	it("renders appended entries in order with a total count", () => {
		const { log } = setup();

		pushEvents(log, { event: "page_view" });
		pushEvents(log, { event: "view_item", item_id: "SKU-77" });

		expect(rows()).toHaveLength(2);
		expect(rows()[0]?.textContent).toContain("page_view");
		expect(rows()[1]?.textContent).toContain("view_item");
		expect(countText()).toBe("2");
	});

	it("rebuilds the list on reset", () => {
		const { log } = setup();
		pushEvents(log, { event: "stale_before_reload" });

		log.reset(buffered([{ event: "gtm.js" }, { event: "gtm.dom" }]));

		expect(rows()).toHaveLength(2);
		expect(document.body.textContent).not.toContain("stale_before_reload");
	});

	it("empties the list on clear", () => {
		const { log } = setup();
		pushEvents(log, { event: "sign_up" });

		log.clear();

		expect(rows()).toHaveLength(0);
		expect(countText()).toBe("0");
	});
});

describe("PanelView filtering", () => {
	it("hides non-matching rows and shows the filtered count", () => {
		const { log, filter } = setup();
		pushEvents(log, { event: "page_view" });
		pushEvents(log, { event: "purchase", value: 120 });

		filter.setQuery("purchase");

		expect(visibleRows()).toHaveLength(1);
		expect(visibleRows()[0]?.textContent).toContain("purchase");
		expect(countText()).toBe("1 / 2");
	});

	it("applies the active query to entries appended later", () => {
		const { log, filter } = setup();
		filter.setQuery("purchase");

		pushEvents(log, { event: "page_view" });
		pushEvents(log, { event: "purchase" });

		expect(visibleRows()).toHaveLength(1);
		expect(countText()).toBe("1 / 2");
	});

	it("restores all rows when the query clears", () => {
		const { log, filter } = setup();
		pushEvents(log, { event: "page_view" });
		pushEvents(log, { event: "purchase" });
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

describe("PanelView settings", () => {
	it("keeps the settings panel closed until the toggle is clicked", () => {
		setup();

		expect(settings().hidden).toBe(true);
		expect(button("settings").getAttribute("aria-expanded")).toBe("false");

		button("settings").click();

		expect(settings().hidden).toBe(false);
		expect(button("settings").getAttribute("aria-expanded")).toBe("true");
	});

	it("closes the settings panel on a second click", () => {
		setup();
		button("settings").click();

		button("settings").click();

		expect(settings().hidden).toBe(true);
	});

	it("renders a labelled row per setting", () => {
		setup();

		const labels = [...document.querySelectorAll(".layr__setting-label")].map(
			(el) => el.textContent
		);
		expect(labels).toEqual(["Font size"]);
	});
});

describe("PanelView font size", () => {
	it("applies the current scale to the panel root on mount", () => {
		setup();

		expect(fontVar()).toBe("1");
	});

	it("grows and shrinks the scale from the settings buttons", () => {
		const { fontScale } = setup();

		button("larger").click();

		expect(fontScale.scale.value).toBe(DEFAULT_FONT_SCALE + 10);
		expect(fontVar()).toBe("1.1");

		button("smaller").click();

		expect(fontScale.scale.value).toBe(DEFAULT_FONT_SCALE);
		expect(fontVar()).toBe("1");
	});

	it("disables the button that would go past a bound", () => {
		const { fontScale } = setup();

		while (fontScale.canDecrease) button("smaller").click();

		expect(fontScale.scale.value).toBe(MIN_FONT_SCALE);
		expect(button("smaller").disabled).toBe(true);
		expect(button("larger").disabled).toBe(false);
	});
});
