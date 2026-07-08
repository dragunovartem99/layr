import { expandJSONStrings } from "./expandJSON.ts";

const pad = (n: number, len = 2): string => String(n).padStart(len, "0");

function formatTime(d: Date): string {
	return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

type EntryOptions = {
	order: number;
	raw: object;
	receivedAt?: Date;
};

/** One received dataLayer push: naming, formatting, and query matching.
 * Rendering belongs to the UI layer. */
export class Entry {
	readonly order: number;
	readonly raw: object;
	readonly eventName: string;
	readonly formattedJSON: string;
	readonly timestamp: string;

	#rawJSONLower: string;

	constructor({ order, raw, receivedAt = new Date() }: EntryOptions) {
		this.order = order;
		this.raw = raw;
		this.eventName = ((raw as Record<string, unknown>).event as string) ?? "(anonymous)";
		this.formattedJSON = JSON.stringify(expandJSONStrings({ value: raw }), null, 2);
		this.timestamp = formatTime(receivedAt);
		this.#rawJSONLower = JSON.stringify(raw).toLowerCase();
	}

	matches(query: string): boolean {
		return this.#rawJSONLower.includes(query.toLowerCase());
	}
}
