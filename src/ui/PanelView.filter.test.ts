// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { pushEvents } from "../testing/events.ts";
import { setup, visibleRows, countText } from "../testing/panelView.ts";

afterEach(() => {
	vi.useRealTimers();
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
