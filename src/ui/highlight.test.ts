import { describe, expect, it } from "vitest";

import { highlight } from "./highlight.ts";

describe("highlight", () => {
	it("wraps a single match in <mark>", () => {
		const result = highlight({ text: "checkout_started", query: "checkout" });

		expect(result).toBe("<mark>checkout</mark>_started");
	});

	it("wraps every occurrence of the query", () => {
		const result = highlight({ text: "view_item view_item_list", query: "view_item" });

		expect(result).toBe("<mark>view_item</mark> <mark>view_item</mark>_list");
	});

	it("matches case-insensitively but preserves original casing", () => {
		const result = highlight({ text: "ecommerce.currencyCode: USD", query: "CURRENCY" });

		expect(result).toBe("ecommerce.<mark>currency</mark>Code: USD");
	});

	it("escapes HTML in the text", () => {
		const result = highlight({ text: '<script>alert("x")</script>', query: "alert" });

		expect(result).toBe('&lt;script&gt;<mark>alert</mark>("x")&lt;/script&gt;');
	});

	it("escapes HTML inside the matched slice", () => {
		const result = highlight({ text: "a < b && b > c", query: "< b" });

		expect(result).toBe("a <mark>&lt; b</mark> &amp;&amp; b &gt; c");
	});

	it("returns escaped text unchanged when the query is empty", () => {
		const result = highlight({ text: "price > 100", query: "" });

		expect(result).toBe("price &gt; 100");
	});

	it("returns escaped text when nothing matches", () => {
		const result = highlight({ text: "gtm.load", query: "purchase" });

		expect(result).toBe("gtm.load");
	});
});
