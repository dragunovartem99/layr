import type { KeyValueStore } from "../types.ts";

export class ChromeSessionStore implements KeyValueStore {
	async get(key: string): Promise<unknown> {
		const data = await chrome.storage.session.get(key);
		return data[key];
	}

	async set(key: string, value: unknown): Promise<void> {
		await chrome.storage.session.set({ [key]: value });
	}
}
