import type { EventBuffer } from "../core/EventBuffer.ts";

export const payloads = (buffer: EventBuffer, tabId: number): object[] =>
	buffer.get(tabId).events.map((event) => event.payload);
