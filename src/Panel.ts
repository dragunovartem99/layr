import { CSS } from "./css.ts";
import { panelHtml } from "./html.ts";
import type { Storage } from "./Storage.ts";

type PanelOptions = {
	iconUrl: string;
	storage: Storage;
	onClear: () => void;
	onClose: () => void;
};

export class Panel {
	readonly el: HTMLElement;
	readonly log: HTMLElement;
	readonly toolbar: HTMLElement;
	readonly filterInput: HTMLInputElement;
	readonly countEl: HTMLElement;
	readonly resizeHandle: HTMLElement;

	constructor({ iconUrl, storage, onClear, onClose }: PanelOptions) {
		this.#injectStyles();
		this.el = this.#buildEl({ iconUrl });
		this.toolbar = this.el.querySelector(".layr__toolbar")!;
		this.log = this.el.querySelector(".layr__log")!;
		this.filterInput = this.el.querySelector(".layr__filter")!;
		this.countEl = this.el.querySelector(".layr__count")!;
		this.resizeHandle = this.el.querySelector(".layr__resize")!;

		for (const type of ["pointerdown", "mousedown", "click"] as const) {
			this.el.addEventListener(type, (e) => e.stopPropagation());
		}

		const pos = storage.pos();
		if (pos) {
			this.el.style.left = `${pos.x}px`;
			this.el.style.top = `${pos.y}px`;
		} else {
			this.el.style.left = `${window.innerWidth - 440}px`;
			this.el.style.top = `${window.innerHeight - 540}px`;
		}

		const size = storage.size();
		if (size) {
			this.el.style.width = `${size.w}px`;
			this.el.style.height = `${size.h}px`;
		}

		this.el.querySelector(".layr__btn--clear")!.addEventListener("click", onClear);
		this.el.querySelector(".layr__btn--close")!.addEventListener("click", onClose);

		document.body.append(this.el);
	}

	#injectStyles(): void {
		if (document.querySelector("#layr-styles")) return;
		const style = document.createElement("style");
		style.id = "layr-styles";
		style.textContent = CSS;
		document.head.append(style);
	}

	#buildEl({ iconUrl }: { iconUrl: string }): HTMLElement {
		const el = document.createElement("div");
		el.className = "layr";
		el.setAttribute("role", "complementary");
		el.setAttribute("aria-label", "dataLayer inspector");
		el.innerHTML = panelHtml({ iconUrl });
		return el;
	}
}
