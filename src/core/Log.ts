import { Entry } from "./Entry.ts";
import { Signal } from "./Signal.ts";

/** Panel-side store of the entries currently on screen. Views subscribe to
 * `entries`; mutation happens only through the methods below. */
export class Log {
	readonly entries = new Signal<readonly Entry[]>([]);

	append(raw: object): void {
		const entry = new Entry({ order: this.entries.value.length + 1, raw });
		this.entries.value = [...this.entries.value, entry];
	}

	reset(raws: readonly object[]): void {
		this.entries.value = raws.map((raw, index) => new Entry({ order: index + 1, raw }));
	}

	clear(): void {
		this.entries.value = [];
	}
}
