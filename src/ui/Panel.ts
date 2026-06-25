import { CSS } from "./css.ts";
import { panelHtml } from "./html.ts";

type PanelOptions = {
	onClear: () => void;
};

export class Panel {
	readonly el: HTMLElement;
	readonly log: HTMLElement;
	readonly toolbar: HTMLElement;
	readonly filterInput: HTMLInputElement;
	readonly countEl: HTMLElement;

	constructor({ onClear }: PanelOptions) {
		this.#injectStyles();
		this.el = this.#buildEl();
		this.toolbar = this.el.querySelector(".layr__toolbar")!;
		this.log = this.el.querySelector(".layr__log")!;
		this.filterInput = this.el.querySelector(".layr__filter")!;
		this.countEl = this.el.querySelector(".layr__count")!;

		this.el.querySelector(".layr__btn--clear")!.addEventListener("click", onClear);
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
