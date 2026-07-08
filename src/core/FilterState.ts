import { Signal } from "./Signal.ts";

/** What FilterState needs from storage; localStorage-shaped, injected so the
 * core stays browser-free. */
type QueryStore = {
	get(key: string): string | null;
	set(key: string, value: string): void;
	remove(key: string): void;
};

const queryKey = (tabId: number): string => `layr-filter:${tabId}`;

/** The filter query for the tab the panel is showing, persisted per tab so
 * switching back restores it. */
export class FilterState {
	readonly query = new Signal<string>("");

	#store: QueryStore;
	#tabId: number | null = null;

	constructor(store: QueryStore) {
		this.#store = store;
	}

	setQuery(query: string): void {
		this.query.value = query;
		if (this.#tabId !== null) this.#store.set(queryKey(this.#tabId), query);
	}

	// Switches to the given tab, restoring whatever query was last saved for it.
	loadForTab(tabId: number): void {
		this.#tabId = tabId;
		this.query.value = this.#store.get(queryKey(tabId)) ?? "";
	}

	reset(): void {
		this.query.value = "";
		if (this.#tabId !== null) this.#store.remove(queryKey(this.#tabId));
	}
}
