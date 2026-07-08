// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { Entry } from "../core/Entry.ts";
import { EntryView } from "./EntryView.ts";

function makeView(): EntryView {
	const entry = new Entry({
		order: 3,
		raw: { event: "add_to_cart", currency: "EUR" },
		receivedAt: new Date(2026, 6, 9, 10, 30, 0, 5),
	});
	return new EntryView(entry);
}

describe("EntryView rendering", () => {
	it("renders order, event name, time and payload", () => {
		const view = makeView();

		expect(view.el.querySelector(".layr__order")?.textContent).toBe("3");
		expect(view.el.querySelector(".layr__event")?.textContent).toBe("add_to_cart");
		expect(view.el.querySelector(".layr__time")?.textContent).toBe("10:30:00.005");
		expect(view.el.querySelector("code")?.textContent).toBe(view.model.formattedJSON);
	});
});

describe("EntryView filtering", () => {
	it("stays visible and highlights on a matching query", () => {
		const view = makeView();

		view.update("cart");

		expect(view.el.hidden).toBe(false);
		expect(view.el.querySelector(".layr__event")?.innerHTML).toContain("<mark>cart</mark>");
	});

	it("hides on a non-matching query", () => {
		const view = makeView();

		view.update("refund");

		expect(view.el.hidden).toBe(true);
	});

	it("restores plain text when the query clears", () => {
		const view = makeView();
		view.update("cart");

		view.update("");

		expect(view.el.hidden).toBe(false);
		expect(view.el.querySelector(".layr__event")?.innerHTML).toBe("add_to_cart");
	});
});
