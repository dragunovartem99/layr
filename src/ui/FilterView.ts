import type { FilterState } from "../core/FilterState.ts";
import type { Log } from "../core/Log.ts";

const DEBOUNCE_MS = 300;

type FilterViewOptions = {
	input: HTMLInputElement;
	count: HTMLElement;
	log: Log;
	filter: FilterState;
};

/** Binds the search input to FilterState and renders the visible/total count. */
export class FilterView {
	#input: HTMLInputElement;
	#count: HTMLElement;
	#log: Log;
	#filter: FilterState;
	#debounceTimer: ReturnType<typeof setTimeout> | undefined;

	constructor({ input, count, log, filter }: FilterViewOptions) {
		this.#input = input;
		this.#count = count;
		this.#log = log;
		this.#filter = filter;
	}

	mount(): void {
		this.#input.addEventListener("input", () => {
			clearTimeout(this.#debounceTimer);
			this.#debounceTimer = setTimeout(
				() => this.#filter.setQuery(this.#input.value),
				DEBOUNCE_MS
			);
		});

		this.#filter.query.subscribe((query) => {
			if (this.#input.value !== query) this.#input.value = query;
			this.#renderCount();
		});
		this.#log.entries.subscribe(() => this.#renderCount());
	}

	#renderCount(): void {
		const query = this.#filter.query.value;
		const entries = this.#log.entries.value;
		const visible = query ? entries.filter((e) => e.matches(query)).length : entries.length;
		this.#count.textContent = query ? `${visible} / ${entries.length}` : `${entries.length}`;
	}
}
