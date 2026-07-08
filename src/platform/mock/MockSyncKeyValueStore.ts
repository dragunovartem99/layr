import type { SyncKeyValueStore } from "../types.ts";

export class MockSyncKeyValueStore implements SyncKeyValueStore {
	#data = new Map<string, string>();

	get(key: string): string | null {
		return this.#data.get(key) ?? null;
	}

	set(key: string, value: string): void {
		this.#data.set(key, value);
	}

	remove(key: string): void {
		this.#data.delete(key);
	}
}
