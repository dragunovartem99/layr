// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { buffered, pushEvents } from "../testing/events.ts";
import { setup, rows, countText } from "../testing/panelView.ts";

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

describe("PanelView clearing", () => {
	it("forwards the Clear click to onClear", () => {
		const { cleared } = setup();

		document.querySelector<HTMLButtonElement>(".layr__btn--clear")?.click();

		expect(cleared.count).toBe(1);
	});
});
