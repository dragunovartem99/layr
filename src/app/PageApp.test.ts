import { describe, expect, it } from "vitest";

import { DataLayerObserver } from "../core/DataLayerObserver.ts";
import type { DataLayerHost } from "../core/DataLayerObserver.ts";
import type { PageMessage } from "../protocol/messages.ts";
import { PageApp } from "./PageApp.ts";

function setup(host: DataLayerHost = {}): { host: DataLayerHost; posted: PageMessage[] } {
	const posted: PageMessage[] = [];
	new PageApp({ observer: new DataLayerObserver(host), post: (m) => posted.push(m) }).start();
	return { host, posted };
}

describe("PageApp", () => {
	it("posts every dataLayer push tagged with the layr source", () => {
		const { host, posted } = setup();

		host.dataLayer?.push({ event: "begin_checkout", value: 214.5 });

		expect(posted).toEqual([
			{ source: "layr", payload: { event: "begin_checkout", value: 214.5 } },
		]);
	});

	it("relays events pushed before it started", () => {
		const { posted } = setup({ dataLayer: [{ event: "gtm.js" }] });

		expect(posted).toEqual([{ source: "layr", payload: { event: "gtm.js" } }]);
	});

	it("posts null for a payload JSON cannot serialize", () => {
		const { host, posted } = setup();
		const cyclic: Record<string, unknown> = { event: "menu_open" };
		cyclic.self = cyclic;

		host.dataLayer?.push(cyclic);

		expect(posted).toEqual([{ source: "layr", payload: null }]);
	});

	it("drops functions from the payload", () => {
		const { host, posted } = setup();

		host.dataLayer?.push({ "event": "gtm.click", "gtm.element": () => {} });

		expect(posted).toEqual([{ source: "layr", payload: { event: "gtm.click" } }]);
	});
});
