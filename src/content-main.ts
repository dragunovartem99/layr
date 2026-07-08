import { PageApp } from "./app/PageApp.ts";
import { DataLayerObserver } from "./core/DataLayerObserver.ts";

declare global {
	interface Window {
		dataLayer?: object[];
	}
}

new PageApp({
	observer: new DataLayerObserver(window),
	post: (message) => window.postMessage(message, "*"),
}).start();
