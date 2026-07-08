import { DataLayer } from "./lib/DataLayer.ts";
import { PAGE_SOURCE } from "./protocol/messages.ts";
import type { PageMessage } from "./protocol/messages.ts";

const dataLayer = new DataLayer();

function toCloneable(value: unknown): object | null {
	try {
		return JSON.parse(JSON.stringify(value, (_, v) => (v instanceof Node ? undefined : v)));
	} catch {
		return null;
	}
}

dataLayer.subscribe((raw) => {
	const message: PageMessage = { source: PAGE_SOURCE, payload: toCloneable(raw) };
	window.postMessage(message, "*");
});
