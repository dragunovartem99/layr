import { Signal } from "./Signal.ts";

export type DataLayerHost = { dataLayer?: object[] };

const PATCHED = "__layrPatched__";

/** Watches a dataLayer array by patching its push. The host is injectable
 * (window in production) so the observer runs anywhere. */
export class DataLayerObserver {
	#item = new Signal<object | null>(null);
	#existing: object[] = [];

	constructor(host: DataLayerHost) {
		const dl = (host.dataLayer ??= []);
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
