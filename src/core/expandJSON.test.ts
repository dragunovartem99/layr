import { describe, expect, it } from "vitest";

import { expandJSONStrings } from "./expandJSON.ts";

describe("expandJSONStrings", () => {
	it("parses a JSON object embedded as a string value", () => {
		const value = { event: "purchase", ecommerce: '{"value":129.99,"currency":"EUR"}' };

		const result = expandJSONStrings({ value });

		expect(result).toEqual({
			event: "purchase",
			ecommerce: { value: 129.99, currency: "EUR" },
		});
	});

	it("expands nested JSON strings recursively", () => {
		const value = '{"items":"[{\\"item_id\\":\\"SKU-42\\"}]"}';

		const result = expandJSONStrings({ value });

		expect(result).toEqual({ items: [{ item_id: "SKU-42" }] });
	});

	it("expands JSON strings inside arrays", () => {
		const value = ['{"event":"gtm.click"}', "plain text"];

		const result = expandJSONStrings({ value });

		expect(result).toEqual([{ event: "gtm.click" }, "plain text"]);
	});

	it("keeps non-JSON and numeric strings as strings", () => {
		const value = { page_path: "/checkout/success", transaction_id: "10042" };

		const result = expandJSONStrings({ value });

		expect(result).toEqual({ page_path: "/checkout/success", transaction_id: "10042" });
	});

	it("passes through primitives and null", () => {
		const value = { quantity: 3, gdpr_consent: true, coupon: null };

		const result = expandJSONStrings({ value });

		expect(result).toEqual({ quantity: 3, gdpr_consent: true, coupon: null });
	});
});
