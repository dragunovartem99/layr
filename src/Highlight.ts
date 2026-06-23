export class Highlight {
	#text: string;

	constructor(text: string) {
		this.#text = text;
	}

	apply(query: string): string {
		if (!query) return this.#escape(this.#text);
		const lower = this.#text.toLowerCase();
		const lq = query.toLowerCase();
		let result = "";
		let i = 0;
		while (i < this.#text.length) {
			const idx = lower.indexOf(lq, i);
			if (idx === -1) {
				result += this.#escape(this.#text.slice(i));
				break;
			}
			result += this.#escape(this.#text.slice(i, idx));
			result += `<mark>${this.#escape(this.#text.slice(idx, idx + query.length))}</mark>`;
			i = idx + query.length;
		}
		return result;
	}

	#escape(s: string): string {
		return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
	}
}
