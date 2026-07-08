import { Signal } from "../core/Signal.ts";
import type { SyncKeyValueStore } from "../platform/types.ts";
import type { Entry } from "./Entry.ts";

const queryKey = (tabId: number): string => `layr-filter:${tabId}`;

type FilterOptions = {
	input: HTMLInputElement;
	count: HTMLElement;
	entries: Signal<Entry[]>;
	store: SyncKeyValueStore;
};

export class Filter {
	readonly query: Signal<string>;

	#input: HTMLInputElement;
	#count: HTMLElement;
	#entries: Signal<Entry[]>;
	#store: SyncKeyValueStore;
	#tabId: number | null = null;

	constructor({ input, count, entries, store }: FilterOptions) {
		this.#input = input;
		this.#count = count;
		this.#entries = entries;
		this.#store = store;

		this.query = new Signal("");

		let debounceTimer: ReturnType<typeof setTimeout> | undefined;
		this.#input.addEventListener("input", () => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				this.query.value = this.#input.value;
				if (this.#tabId !== null) this.#store.set(queryKey(this.#tabId), this.#input.value);
			}, 300);
		});

		entries.subscribe(() => this.#applyAndCount());
		this.query.subscribe(() => this.#applyAndCount());
	}

	// Switches the filter to the given tab, restoring whatever query was last saved for it.
	loadForTab(tabId: number): void {
		this.#tabId = tabId;
		const saved = this.#store.get(queryKey(tabId)) ?? "";
		this.#input.value = saved;
		this.query.value = saved;
	}

	reset(): void {
		this.#input.value = "";
		this.query.value = "";
		if (this.#tabId !== null) this.#store.remove(queryKey(this.#tabId));
		this.#applyAndCount();
	}

	#applyAndCount(): void {
		const q = this.query.value;
		const all = this.#entries.value;
		const visible = all.filter((e) => e.applyFilter(q)).length;
		this.#count.textContent = q ? `${visible} / ${all.length}` : `${all.length}`;
	}
}
