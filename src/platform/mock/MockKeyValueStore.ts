import type { KeyValueStore } from "../types.ts";

export class MockKeyValueStore implements KeyValueStore {
	#data = new Map<string, unknown>();

	get(key: string): Promise<unknown> {
		return Promise.resolve(this.#data.get(key));
	}

	set(key: string, value: unknown): Promise<void> {
		this.#data.set(key, value);
		return Promise.resolve();
	}
}
