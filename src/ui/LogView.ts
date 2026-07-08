import type { Entry } from "../core/Entry.ts";
import type { FilterState } from "../core/FilterState.ts";
import type { Log } from "../core/Log.ts";
import { EntryView } from "./EntryView.ts";

const SCROLL_PIN_THRESHOLD = 50;

type LogViewOptions = {
	log: Log;
	filter: FilterState;
};

/** Renders the Log as EntryViews, keeps the list pinned to the bottom while
 * the user is there, and re-applies the filter query to every row. */
export class LogView {
	#log: Log;
	#filter: FilterState;
	#listEl!: HTMLElement;
	#views: EntryView[] = [];

	constructor({ log, filter }: LogViewOptions) {
		this.#log = log;
		this.#filter = filter;
	}

	mount(root: HTMLElement): void {
		this.#listEl = root.querySelector(".layr__log")!;
		this.#log.entries.subscribe((entries) => this.#render(entries));
		this.#filter.query.subscribe((query) => this.#applyQuery(query));
	}

	#render(entries: readonly Entry[]): void {
		const pinned = this.#isScrolledToBottom();
		const extendsCurrent =
			entries.length >= this.#views.length &&
			this.#views.every((view, i) => view.model === entries[i]);

		if (!extendsCurrent) {
			this.#views = [];
			this.#listEl.innerHTML = "";
		}

		const query = this.#filter.query.value;
		for (const entry of entries.slice(this.#views.length)) {
			const view = new EntryView(entry);
			view.mount(this.#listEl);
			view.update(query);
			this.#views.push(view);
		}
		if (pinned) this.#listEl.scrollTop = this.#listEl.scrollHeight;
	}

	#applyQuery(query: string): void {
		for (const view of this.#views) view.update(query);
	}

	#isScrolledToBottom(): boolean {
		const { scrollTop, scrollHeight, clientHeight } = this.#listEl;
		return scrollHeight - scrollTop - clientHeight < SCROLL_PIN_THRESHOLD;
	}
}
