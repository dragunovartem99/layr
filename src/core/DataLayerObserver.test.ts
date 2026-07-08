import { describe, expect, it } from "vitest";

import { DataLayerObserver } from "./DataLayerObserver.ts";
import type { DataLayerHost } from "./DataLayerObserver.ts";

const observe = (host: DataLayerHost): DataLayerObserver => new DataLayerObserver(host);

describe("DataLayerObserver patching", () => {
	it("creates the dataLayer array when the host has none", () => {
		const host: DataLayerHost = {};

		observe(host);

		expect(Array.isArray(host.dataLayer)).toBe(true);
		expect(host.dataLayer).toHaveLength(0);
	});

	it("keeps push returning the new array length", () => {
		const host: DataLayerHost = { dataLayer: [{ event: "gtm.js" }] };
		observe(host);

		const length = host.dataLayer?.push({ event: "gtm.dom" });

		expect(length).toBe(2);
		expect(host.dataLayer).toHaveLength(2);
	});

	it("does not patch push twice for the same dataLayer", () => {
		const host: DataLayerHost = {};
		observe(host);
		const patchedPush = host.dataLayer?.push;

		observe(host);

		expect(host.dataLayer?.push).toBe(patchedPush);
	});
});

describe("DataLayerObserver subscription", () => {
	it("replays events that were pushed before subscribing", () => {
		const host: DataLayerHost = { dataLayer: [{ event: "gtm.js" }, { event: "page_view" }] };
		const observer = observe(host);
		const seen: object[] = [];

		observer.subscribe((item) => seen.push(item));

		expect(seen).toEqual([{ event: "gtm.js" }, { event: "page_view" }]);
	});

	it("delivers events pushed after subscribing", () => {
		const host: DataLayerHost = {};
		const observer = observe(host);
		const seen: object[] = [];
		observer.subscribe((item) => seen.push(item));

		host.dataLayer?.push({ event: "add_to_wishlist", item_id: "SKU-901" });

		expect(seen).toEqual([{ event: "add_to_wishlist", item_id: "SKU-901" }]);
	});
});
