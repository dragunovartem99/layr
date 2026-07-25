import type { FilterState } from "../core/FilterState.ts";
import type { FontScale } from "../core/FontScale.ts";
import type { Log } from "../core/Log.ts";
import { FilterView } from "./FilterView.ts";
import { FontScaleView } from "./FontScaleView.ts";
import { LogView } from "./LogView.ts";
import { SettingsView } from "./SettingsView.ts";

// Stroke icon (Lucide "settings") rather than the ⚙ glyph, which renders thin
// on some platforms and as a colour emoji on others. Inherits the button's
// colour and size.
const ICON_SETTINGS = `
	<svg class="layr__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
		stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
		aria-hidden="true" focusable="false">
		<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
		<circle cx="12" cy="12" r="3" />
	</svg>`;

const TEMPLATE = `
	<header class="layr__toolbar">
		<input class="layr__filter" type="search" placeholder="Filter events…"
			autocomplete="off" spellcheck="false" />
		<span class="layr__count" aria-live="polite"></span>
		<button class="layr__btn layr__btn--icon layr__btn--settings" type="button"
			title="Settings" aria-label="Settings" aria-expanded="false">${ICON_SETTINGS}</button>
		<button class="layr__btn layr__btn--clear" type="button">Clear</button>
	</header>
	<div class="layr__settings" aria-label="Settings" hidden></div>
	<ol class="layr__log" aria-label="dataLayer events"></ol>`;

type PanelViewOptions = {
	log: Log;
	filter: FilterState;
	fontScale: FontScale;
	onClear: () => void;
};

/** The panel shell: builds the toolbar + list markup, mounts the child views
 * over it, and forwards the Clear click. */
export class PanelView {
	#onClear: () => void;
	#logView: LogView;
	#filterView: FilterView;
	#settingsView: SettingsView;

	constructor({ log, filter, fontScale, onClear }: PanelViewOptions) {
		this.#onClear = onClear;
		this.#logView = new LogView({ log, filter });
		this.#filterView = new FilterView({ log, filter });
		this.#settingsView = new SettingsView({ controls: [new FontScaleView({ fontScale })] });
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
		this.#settingsView.mount(el);
		parent.append(el);
	}
}
