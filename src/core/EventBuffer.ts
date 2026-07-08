/** Plain-object form of the buffers, as stored in chrome.storage.session
 * (which stringifies map keys anyway). */
export type BufferSnapshot = Record<string, object[]>;

/** Per-tab ring buffer of dataLayer events. Pure bookkeeping: persistence and
 * broadcasting stay with the caller. */
export class EventBuffer {
	#buffers = new Map<number, object[]>();
	#limit: number;

	constructor({ limit = 500 }: { limit?: number } = {}) {
		this.#limit = limit;
	}

	append({ tabId, payload }: { tabId: number; payload: object }): void {
		const buf = this.#buffers.get(tabId) ?? [];
		buf.push(payload);
		if (buf.length > this.#limit) buf.shift();
		this.#buffers.set(tabId, buf);
	}

	get(tabId: number): object[] {
		return this.#buffers.get(tabId) ?? [];
	}

	clear(tabId: number): void {
		this.#buffers.set(tabId, []);
	}

	delete(tabId: number): void {
		this.#buffers.delete(tabId);
	}

	toJSON(): BufferSnapshot {
		return Object.fromEntries(this.#buffers);
	}

	restore(snapshot: BufferSnapshot): void {
		for (const [tabId, events] of Object.entries(snapshot)) {
			this.#buffers.set(Number(tabId), events);
		}
	}
}
