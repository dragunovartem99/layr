import type { FilterState } from "../core/FilterState.ts";
import type { Log } from "../core/Log.ts";

const DEBOUNCE_MS = 300;

type FilterViewOptions = {
	log: Log;
	filter: FilterState;
};

/** Binds the search input to FilterState and renders the visible/total count. */
export class FilterView {
	#log: Log;
	#filter: FilterState;
	#input!: HTMLInputElement;
	#count!: HTMLElement;
	#debounceTimer: ReturnType<typeof setTimeout> | undefined;

	constructor({ log, filter }: FilterViewOptions) {
		this.#log = log;
		this.#filter = filter;
	}

	mount(root: HTMLElement): void {
		this.#input = root.querySelector(".layr__filter")!;
		this.#count = root.querySelector(".layr__count")!;

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
