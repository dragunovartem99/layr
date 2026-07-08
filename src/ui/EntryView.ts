import type { Entry } from "../core/Entry.ts";
import { highlight } from "./highlight.ts";
import { entryHtml } from "./html.ts";

/** Renders one Entry as a collapsible row. `update` applies the filter query:
 * hides the row on a miss, highlights matches otherwise. */
export class EntryView {
	readonly el: HTMLLIElement;
	readonly model: Entry;

	#eventEl: HTMLElement;
	#codeEl: HTMLElement;
	#lastQuery: string | undefined;

	constructor(model: Entry) {
		this.model = model;

		this.el = document.createElement("li");
		this.el.className = "layr__entry";
		this.el.innerHTML = entryHtml({ order: model.order, time: model.timestamp });

		this.#eventEl = this.el.querySelector(".layr__event")!;
		this.#codeEl = this.el.querySelector("code")!;
		this.#eventEl.textContent = model.eventName;
		this.#codeEl.textContent = model.formattedJSON;

		this.#bindCopyButton();
	}

	update(query: string): void {
		if (query === this.#lastQuery) return;
		this.#lastQuery = query;

		if (!query) {
			this.el.hidden = false;
			this.#eventEl.textContent = this.model.eventName;
			this.#codeEl.textContent = this.model.formattedJSON;
			return;
		}
		const matches = this.model.matches(query);
		this.el.hidden = !matches;
		if (matches) {
			this.#eventEl.innerHTML = highlight({ text: this.model.eventName, query });
			this.#codeEl.innerHTML = highlight({ text: this.model.formattedJSON, query });
		}
	}

	#bindCopyButton(): void {
		const copyBtn = this.el.querySelector(".layr__btn--copy")! as HTMLButtonElement;
		copyBtn.addEventListener("click", async (e) => {
			e.stopPropagation();
			await navigator.clipboard.writeText(this.model.formattedJSON);
			copyBtn.textContent = "Copied!";
			setTimeout(() => {
				copyBtn.textContent = "Copy";
			}, 1500);
		});
	}
}
