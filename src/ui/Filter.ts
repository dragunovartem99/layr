import { Signal } from "../core/Signal.ts";
import { getFilterQuery, setFilterQuery, clearFilterQuery } from "../lib/storage.ts";
import type { Entry } from "./Entry.ts";

type FilterOptions = {
	input: HTMLInputElement;
	count: HTMLElement;
	entries: Signal<Entry[]>;
};

export class Filter {
	readonly query: Signal<string>;

	#input: HTMLInputElement;
	#count: HTMLElement;
	#entries: Signal<Entry[]>;
	#tabId: number | null = null;

	constructor({ input, count, entries }: FilterOptions) {
		this.#input = input;
		this.#count = count;
		this.#entries = entries;

		this.query = new Signal("");

		let debounceTimer: ReturnType<typeof setTimeout> | undefined;
		this.#input.addEventListener("input", () => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				this.query.value = this.#input.value;
				if (this.#tabId !== null)
					setFilterQuery({ tabId: this.#tabId, query: this.#input.value });
			}, 300);
		});

		entries.subscribe(() => this.#applyAndCount());
		this.query.subscribe(() => this.#applyAndCount());
	}

	// Switches the filter to the given tab, restoring whatever query was last saved for it.
	loadForTab(tabId: number): void {
		this.#tabId = tabId;
		const saved = getFilterQuery(tabId) ?? "";
		this.#input.value = saved;
		this.query.value = saved;
	}

	reset(): void {
		this.#input.value = "";
		this.query.value = "";
		if (this.#tabId !== null) clearFilterQuery(this.#tabId);
		this.#applyAndCount();
	}

	#applyAndCount(): void {
		const q = this.query.value;
		const all = this.#entries.value;
		const visible = all.filter((e) => e.applyFilter(q)).length;
		this.#count.textContent = q ? `${visible} / ${all.length}` : `${all.length}`;
	}
}
