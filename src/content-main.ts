import { DataLayer } from "./lib/DataLayer.ts";

const dataLayer = new DataLayer();

function toCloneable(value: unknown): unknown {
	try {
		return JSON.parse(JSON.stringify(value, (_, v) => (v instanceof Node ? undefined : v)));
	} catch {
		return null;
	}
}

dataLayer.subscribe((raw) => {
	window.postMessage({ source: "layr", payload: toCloneable(raw) }, "*");
});
