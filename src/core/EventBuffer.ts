/** One buffered dataLayer push. `seq` is monotonic within a tab generation and
 * `at` is capture time, so a replayed event keeps the identity and timestamp it
 * had when it was live. */
export type BufferedEvent = { seq: number; at: number; payload: object };

/** A reader's position in one tab's buffer: everything up to and including
 * `seq` of `generation` has been seen. */
export type Cursor = { generation: number; seq: number };

/** Per-tab buffer state. `generation` changes whenever the buffer is dropped
 * (navigation or Clear), which invalidates any cursor a panel still holds. */
export type TabBuffer = { generation: number; events: BufferedEvent[] };

/** Plain-object form of the buffers, as stored in chrome.storage.session
 * (which stringifies map keys anyway). */
export type BufferSnapshot = Record<string, TabBuffer>;

const EMPTY: TabBuffer = { generation: 0, events: [] };

/** Per-tab ring buffer of dataLayer events. Pure bookkeeping: persistence and
 * broadcasting stay with the caller. */
export class EventBuffer {
	#buffers = new Map<number, TabBuffer>();
	#limit: number;

	constructor({ limit = 500 }: { limit?: number } = {}) {
		this.#limit = limit;
	}

	append({ tabId, payload }: { tabId: number; payload: object }): BufferedEvent {
		const buf = this.#buffers.get(tabId) ?? { generation: 0, events: [] };
		const event: BufferedEvent = { seq: lastSeq(buf.events) + 1, at: Date.now(), payload };
		buf.events.push(event);
		if (buf.events.length > this.#limit) buf.events.shift();
		this.#buffers.set(tabId, buf);
		return event;
	}

	get(tabId: number): TabBuffer {
		return this.#buffers.get(tabId) ?? EMPTY;
	}

	// The events a holder of `cursor` hasn't seen, or null when the gap can't
	// be filled incrementally — a stale generation, or an event that has already
	// been evicted — and the caller has to replace the reader's copy instead.
	since(tabId: number, cursor: Cursor): BufferedEvent[] | null {
		const { generation, events } = this.get(tabId);
		if (cursor.generation !== generation) return null;
		if (cursor.seq > lastSeq(events)) return null;
		if (events.length > 0 && events[0]!.seq > cursor.seq + 1) return null;
		return events.filter((event) => event.seq > cursor.seq);
	}

	// Empties the tab and opens a new generation, so readers holding a cursor
	// into the old one resync from scratch.
	clear(tabId: number): void {
		this.#buffers.set(tabId, { generation: this.get(tabId).generation + 1, events: [] });
	}

	delete(tabId: number): void {
		this.#buffers.delete(tabId);
	}

	toJSON(): BufferSnapshot {
		return Object.fromEntries(this.#buffers);
	}

	restore(snapshot: BufferSnapshot): void {
		for (const [tabId, buf] of Object.entries(snapshot)) {
			this.#buffers.set(Number(tabId), buf);
		}
	}
}

function lastSeq(events: readonly BufferedEvent[]): number {
	return events.at(-1)?.seq ?? 0;
}
