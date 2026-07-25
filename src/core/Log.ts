import { Entry } from "./Entry.ts";
import type { BufferedEvent } from "./EventBuffer.ts";
import { Signal } from "./Signal.ts";

/** Panel-side store of the entries currently on screen. Views subscribe to
 * `entries`; mutation happens only through the methods below. */
export class Log {
	readonly entries = new Signal<readonly Entry[]>([]);

	// Extends the log. Entries already on screen keep their identity, so views
	// can leave the rows they've built alone.
	append(events: readonly BufferedEvent[]): void {
		if (events.length === 0) return;
		const current = this.entries.value;
		this.entries.value = [...current, ...toEntries(events, current.length)];
	}

	reset(events: readonly BufferedEvent[]): void {
		this.entries.value = toEntries(events, 0);
	}

	clear(): void {
		this.entries.value = [];
	}
}

function toEntries(events: readonly BufferedEvent[], offset: number): Entry[] {
	return events.map(
		(event, index) =>
			new Entry({
				order: offset + index + 1,
				raw: event.payload,
				receivedAt: new Date(event.at),
			})
	);
}
