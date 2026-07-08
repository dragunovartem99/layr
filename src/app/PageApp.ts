import type { DataLayerObserver } from "../core/DataLayerObserver.ts";
import { PAGE_SOURCE } from "../protocol/messages.ts";
import type { PageMessage } from "../protocol/messages.ts";

const isDOMNode = (v: unknown): boolean => typeof Node !== "undefined" && v instanceof Node;

// dataLayer values can hold anything — DOM nodes, functions, cycles — but only
// structured-cloneable data survives postMessage, so the payload is squeezed
// through JSON first. Unserializable payloads become null.
function toCloneable(value: unknown): object | null {
	try {
		return JSON.parse(JSON.stringify(value, (_, v) => (isDOMNode(v) ? undefined : v)));
	} catch {
		return null;
	}
}

type PageAppOptions = {
	observer: DataLayerObserver;
	post: (message: PageMessage) => void;
};

/** MAIN-world side: relays every dataLayer push out of the page. */
export class PageApp {
	#observer: DataLayerObserver;
	#post: (message: PageMessage) => void;

	constructor({ observer, post }: PageAppOptions) {
		this.#observer = observer;
		this.#post = post;
	}

	start(): void {
		this.#observer.subscribe((raw) => {
			this.#post({ source: PAGE_SOURCE, payload: toCloneable(raw) });
		});
	}
}
