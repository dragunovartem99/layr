import type { Entry } from "../core/Entry.ts";
import type { FilterState } from "../core/FilterState.ts";
import type { Log } from "../core/Log.ts";
import { CSS } from "./css.ts";
import { EntryView } from "./EntryView.ts";
import { FilterView } from "./FilterView.ts";
import { panelHtml } from "./html.ts";

const SCROLL_PIN_THRESHOLD = 50;

type PanelViewOptions = {
	log: Log;
	filter: FilterState;
	onClear: () => void;
};

/** The panel shell. Renders the Log as EntryViews, keeps the list pinned to
 * the bottom while the user is there, and forwards the Clear click. */
export class PanelView {
	readonly el: HTMLElement;

	#log: Log;
	#filter: FilterState;
	#filterView: FilterView;
	#onClear: () => void;
	#listEl: HTMLElement;
	#views: EntryView[] = [];

	constructor({ log, filter, onClear }: PanelViewOptions) {
		this.#log = log;
		this.#filter = filter;
		this.#onClear = onClear;

		this.#injectStyles();
		this.el = this.#buildEl();
		this.#listEl = this.el.querySelector(".layr__log")!;
		this.#filterView = new FilterView({
			input: this.el.querySelector(".layr__filter")!,
			count: this.el.querySelector(".layr__count")!,
			log,
			filter,
		});
	}

	mount(): void {
		this.el.querySelector(".layr__btn--clear")!.addEventListener("click", this.#onClear);
		this.#filterView.mount();
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
			view.update(query);
			this.#views.push(view);
			this.#listEl.append(view.el);
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

	#injectStyles(): void {
		if (document.querySelector("#layr-styles")) return;
		const style = document.createElement("style");
		style.id = "layr-styles";
		style.textContent = CSS;
		document.head.append(style);
	}

	#buildEl(): HTMLElement {
		const el = document.createElement("div");
		el.className = "layr";
		el.setAttribute("role", "complementary");
		el.setAttribute("aria-label", "dataLayer inspector");
		el.innerHTML = panelHtml();
		return el;
	}
}
