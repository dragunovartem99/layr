import { entryHtml } from "./html.ts";
import { Highlight } from "./Highlight.ts";
import { Parse } from "./Parse.ts";

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

function timestamp(): string {
	const d = new Date();
	return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

type EntryOptions = { order: number; raw: object };

export class Entry {
	readonly el: HTMLLIElement;
	readonly rawJson: string;

	#eventName: string;
	#formattedJson: string;
	#eventEl: HTMLElement;
	#codeEl: HTMLElement;
	#rawJsonLower: string;
	#lastQuery: string | undefined;

	constructor({ order, raw }: EntryOptions) {
		this.rawJson = JSON.stringify(raw);
		this.#rawJsonLower = this.rawJson.toLowerCase();
		this.#eventName = ((raw as Record<string, unknown>).event as string) ?? "(anonymous)";
		this.#formattedJson = JSON.stringify(new Parse(raw).jsonStrings(), null, 2);

		this.el = document.createElement("li");
		this.el.className = "layr__entry";
		this.el.innerHTML = entryHtml({ order, time: timestamp() });

		this.#eventEl = this.el.querySelector(".layr__event")!;
		this.#codeEl = this.el.querySelector("code")!;
		this.#eventEl.textContent = this.#eventName;
		this.#codeEl.textContent = this.#formattedJson;

		const copyBtn = this.el.querySelector(".layr__btn--copy")! as HTMLButtonElement;
		copyBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			navigator.clipboard.writeText(this.#formattedJson).then(() => {
				copyBtn.textContent = "Copied!";
				setTimeout(() => {
					copyBtn.textContent = "Copy";
				}, 1500);
				return;
			});
		});
	}

	applyFilter(query: string): boolean {
		if (query === this.#lastQuery) return !this.el.hidden;
		this.#lastQuery = query;

		if (!query) {
			this.el.hidden = false;
			this.#eventEl.textContent = this.#eventName;
			this.#codeEl.textContent = this.#formattedJson;
			return true;
		}
		const matches = this.#rawJsonLower.includes(query.toLowerCase());
		this.el.hidden = !matches;
		if (matches) {
			this.#eventEl.innerHTML = new Highlight(this.#eventName).apply(query);
			this.#codeEl.innerHTML = new Highlight(this.#formattedJson).apply(query);
		}
		return matches;
	}
}
