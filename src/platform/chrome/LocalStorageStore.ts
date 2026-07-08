import type { SyncKeyValueStore } from "../types.ts";

export class LocalStorageStore implements SyncKeyValueStore {
	get(key: string): string | null {
		return localStorage.getItem(key);
	}

	set(key: string, value: string): void {
		localStorage.setItem(key, value);
	}

	remove(key: string): void {
		localStorage.removeItem(key);
	}
}
