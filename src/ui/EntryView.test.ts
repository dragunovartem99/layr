// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";

import { Entry } from "../core/Entry.ts";
import { EntryView } from "./EntryView.ts";

function mountView(): EntryView {
	document.body.innerHTML = "";
	const entry = new Entry({
		order: 3,
		raw: { event: "add_to_cart", currency: "EUR" },
		receivedAt: new Date(2026, 6, 9, 10, 30, 0, 5),
	});
	const view = new EntryView(entry);
	view.mount(document.body);
	return view;
}

const row = (): HTMLElement => document.querySelector<HTMLElement>(".layr__entry")!;

describe("EntryView rendering", () => {
	it("renders order, event name, time and payload", () => {
		const view = mountView();

		expect(row().querySelector(".layr__order")?.textContent).toBe("3");
		expect(row().querySelector(".layr__event")?.textContent).toBe("add_to_cart");
		expect(row().querySelector(".layr__time")?.textContent).toBe("10:30:00.005");
		expect(row().querySelector("code")?.textContent).toBe(view.model.formattedJSON);
	});
});

describe("EntryView filtering", () => {
	it("stays visible and highlights on a matching query", () => {
		const view = mountView();

		view.update("cart");

		expect(row().hidden).toBe(false);
		expect(row().querySelector(".layr__event")?.innerHTML).toContain("<mark>cart</mark>");
	});

	it("hides on a non-matching query", () => {
		const view = mountView();

		view.update("refund");

		expect(row().hidden).toBe(true);
	});

	it("restores plain text when the query clears", () => {
		const view = mountView();
		view.update("cart");

		view.update("");

		expect(row().hidden).toBe(false);
		expect(row().querySelector(".layr__event")?.innerHTML).toBe("add_to_cart");
	});
});
