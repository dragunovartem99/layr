import type { BufferedEvent } from "../core/EventBuffer.ts";
import type { Log } from "../core/Log.ts";

// Buffered events with predictable seq/at, for tests driving the panel side.
export function buffered(payloads: readonly object[], { from = 1 } = {}): BufferedEvent[] {
	return payloads.map((payload, index) => ({
		seq: from + index,
		at: Date.UTC(2024, 0, 1) + (from + index) * 1000,
		payload,
	}));
}

// Appends payloads to a log the way live events arrive: one at a time.
export function pushEvents(log: Log, ...payloads: object[]): void {
	for (const payload of payloads) log.append(buffered([payload]));
}
