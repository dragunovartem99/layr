import type { FilterState } from "../core/FilterState.ts";
import type { Log } from "../core/Log.ts";
import { FilterView } from "./FilterView.ts";
import { LogView } from "./LogView.ts";

const TEMPLATE = `
	<header class="layr__toolbar">
		<input class="layr__filter" type="search" placeholder="Filter events…"
			autocomplete="off" spellcheck="false" />
		<span class="layr__count" aria-live="polite"></span>
		<button class="layr__btn layr__btn--clear" type="button">Clear</button>
	</header>
	<ol class="layr__log" aria-label="dataLayer events"></ol>`;

type PanelViewOptions = {
	log: Log;
	filter: FilterState;
	onClear: () => void;
};

/** The panel shell: builds the toolbar + list markup, mounts the child views
 * over it, and forwards the Clear click. */
export class PanelView {
	#onClear: () => void;
	#logView: LogView;
	#filterView: FilterView;

	constructor({ log, filter, onClear }: PanelViewOptions) {
		this.#onClear = onClear;
		this.#logView = new LogView({ log, filter });
		this.#filterView = new FilterView({ log, filter });
	}

	mount(parent: HTMLElement): void {
		const el = document.createElement("div");
		el.className = "layr";
		el.setAttribute("role", "complementary");
		el.setAttribute("aria-label", "dataLayer inspector");
		el.innerHTML = TEMPLATE;

		el.querySelector(".layr__btn--clear")!.addEventListener("click", this.#onClear);
		this.#logView.mount(el);
		this.#filterView.mount(el);
		parent.append(el);
	}
}
