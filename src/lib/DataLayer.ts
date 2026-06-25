import { Signal } from "./Signal.ts";

declare global {
	interface Window {
		dataLayer?: object[];
	}
}

const PATCHED = "__layrPatched__";

export class DataLayer {
	#item = new Signal<object | null>(null);
	#existing: object[] = [];

	constructor() {
		const dl = (window.dataLayer ??= []);
		this.#existing = [...dl];
		if ((dl.push as unknown as Record<string, unknown>)[PATCHED]) return;
		this.#patch(dl);
	}

	subscribe(fn: (item: object) => void): () => void {
		for (const item of this.#existing) fn(item);
		return this.#item.subscribe((v) => v && fn(v));
	}

	#patch(dl: object[]): void {
		const original = dl.push.bind(dl);
		const patched = (...items: object[]): number => {
			const n = original(...items);
			for (const item of items) this.#item.value = item;
			return n;
		};
		(patched as unknown as Record<string, unknown>)[PATCHED] = true;
		dl.push = patched;
	}
}
