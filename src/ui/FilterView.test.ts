// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { FilterState } from "../core/FilterState.ts";
import { Log } from "../core/Log.ts";
import { MockSyncKeyValueStore } from "../platform/mock/MockSyncKeyValueStore.ts";
import { FilterView } from "./FilterView.ts";

type Setup = {
	log: Log;
	filter: FilterState;
	input: HTMLInputElement;
	count: HTMLElement;
};

function setup(): Setup {
	document.body.innerHTML = `
		<div>
			<input class="layr__filter" type="search" />
			<span class="layr__count"></span>
		</div>`;
	const root = document.body.firstElementChild as HTMLElement;
	const log = new Log();
	const filter = new FilterState(new MockSyncKeyValueStore());
	new FilterView({ log, filter }).mount(root);
	return {
		log,
		filter,
		input: root.querySelector(".layr__filter")!,
		count: root.querySelector(".layr__count")!,
	};
}

function type(input: HTMLInputElement, value: string): void {
	input.value = value;
	input.dispatchEvent(new Event("input"));
}

afterEach(() => {
	vi.useRealTimers();
});

describe("FilterView count", () => {
	it("renders the total count as entries arrive", () => {
		const { log, count } = setup();

		log.append({ event: "gtm.js" });
		log.append({ event: "checkout_progress", step: 2 });
		log.append({ event: "login", method: "google" });

		expect(count.textContent).toBe("3");
	});

	it("renders visible / total while a query is active", () => {
		const { log, filter, count } = setup();
		log.append({ event: "view_promotion", promotion_id: "SUMMER24" });
		log.append({ event: "select_promotion", promotion_id: "SUMMER24" });
		log.append({ event: "scroll", percent: 90 });

		filter.setQuery("promotion");

		expect(count.textContent).toBe("2 / 3");
	});

	it("restores the total count when the query clears", () => {
		const { log, filter, count } = setup();
		log.append({ event: "add_payment_info" });
		filter.setQuery("refund");

		filter.setQuery("");

		expect(count.textContent).toBe("1");
	});
});

describe("FilterView input", () => {
	it("applies only the last typed value after the debounce restarts", () => {
		vi.useFakeTimers();
		const { filter, input } = setup();

		type(input, "pur");
		vi.advanceTimersByTime(200);
		type(input, "purchase");
		vi.advanceTimersByTime(200);

		expect(filter.query.value).toBe("");

		vi.advanceTimersByTime(100);

		expect(filter.query.value).toBe("purchase");
	});

	it("syncs the input box when the query changes programmatically", () => {
		const { filter, input } = setup();

		filter.setQuery("gtm.dom");

		expect(input.value).toBe("gtm.dom");
	});
});
