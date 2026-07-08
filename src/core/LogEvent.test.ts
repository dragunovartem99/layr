import { describe, expect, it } from "vitest";

import { LogEvent } from "./LogEvent.ts";

const makeEvent = (raw: object): LogEvent => new LogEvent({ order: 1, raw });

describe("LogEvent", () => {
	it("uses the event field as the name", () => {
		const event = makeEvent({ event: "add_payment_info", currency: "GBP" });

		expect(event.eventName).toBe("add_payment_info");
	});

	it("falls back to (anonymous) when there is no event field", () => {
		const event = makeEvent({ ecommerce: { value: 49.9 } });

		expect(event.eventName).toBe("(anonymous)");
	});

	it("pretty-prints the payload with embedded JSON strings expanded", () => {
		const event = makeEvent({ event: "select_promotion", promo: '{"id":"SUMMER25"}' });

		expect(event.formattedJSON).toBe(
			JSON.stringify({ event: "select_promotion", promo: { id: "SUMMER25" } }, null, 2)
		);
	});

	it("formats the received time as hh:mm:ss.mmm", () => {
		const receivedAt = new Date(2026, 6, 9, 14, 5, 3, 42);

		const event = new LogEvent({ order: 2, raw: { event: "gtm.dom" }, receivedAt });

		expect(event.timestamp).toBe("14:05:03.042");
	});

	it("matches against the raw JSON case-insensitively", () => {
		const event = makeEvent({ event: "view_cart", items: [{ item_name: "Aeron Chair" }] });

		expect(event.matches("AERON")).toBe(true);
		expect(event.matches("item_name")).toBe(true);
		expect(event.matches("standing desk")).toBe(false);
	});

	it("matches any query when the query is empty", () => {
		const event = makeEvent({ event: "gtm.click" });

		expect(event.matches("")).toBe(true);
	});
});
