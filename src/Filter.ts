import type { Entry } from "./Entry.ts";
import { Signal } from "./Signal.ts";
import type { Storage } from "./Storage.ts";

type FilterOptions = {
	input: HTMLInputElement;
	count: HTMLElement;
	storage: Storage;
	entries: Signal<Entry[]>;
};

export class Filter {
	readonly query: Signal<string>;

	#input: HTMLInputElement;
	#count: HTMLElement;
	#storage: Storage;
	#entries: Signal<Entry[]>;

	constructor({ input, count, storage, entries }: FilterOptions) {
		this.#input = input;
		this.#count = count;
		this.#storage = storage;
		this.#entries = entries;

		this.query = new Signal("");

		const saved = storage.filterQuery();
		if (saved) {
			this.#input.value = saved;
			this.query.value = saved;
		}

		let debounceTimer: ReturnType<typeof setTimeout> | undefined;
		this.#input.addEventListener("input", () => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				this.query.value = this.#input.value;
				this.#storage.setFilterQuery(this.#input.value);
			}, 300);
		});

		entries.subscribe(() => this.#applyAndCount());
		this.query.subscribe(() => this.#applyAndCount());
	}

	reset(): void {
		this.#input.value = "";
		this.query.value = "";
		this.#storage.clearFilterQuery();
		this.#applyAndCount();
	}

	#applyAndCount(): void {
		const q = this.query.value;
		const all = this.#entries.value;
		const visible = all.filter((e) => e.applyFilter(q)).length;
		this.#count.textContent = q ? `${visible} / ${all.length}` : `${all.length}`;
	}
}
