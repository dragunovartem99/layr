import { GREEN, YELLOW } from "./palette.ts";

// What the artwork shows: a plausible session, as the panel would list and print it.

export type Event = { n: number; name: string; time: string };

/** A plausible ecommerce funnel — the events a GA4 debugger actually watches. */
export const EVENTS: readonly Event[] = [
	{ n: 1, name: "gtm.js", time: "14:21:52" },
	{ n: 2, name: "consent_update", time: "14:21:52" },
	{ n: 3, name: "page_view", time: "14:21:53" },
	{ n: 4, name: "user_data", time: "14:21:54" },
	{ n: 5, name: "view_item_list", time: "14:22:01" },
	{ n: 6, name: "view_item", time: "14:22:07" },
	{ n: 7, name: "add_to_cart", time: "14:22:31" },
	{ n: 8, name: "begin_checkout", time: "14:23:02" },
	{ n: 9, name: "purchase", time: "14:23:48" },
];

/**
 * One pretty-printed line. `key` is absent on the lines that only open or close
 * a brace, and `value` on the ones that only open a nested object.
 */
export type JsonLine = {
	depth: number;
	key?: string;
	value?: string;
	color?: string;
	/** Set on every line the payload continues past. */
	comma?: boolean;
};

/** The compact payload, for the tile's shallower pane. */
export const PURCHASE_BRIEF: readonly JsonLine[] = [
	{ depth: 0, value: "{" },
	{ depth: 1, key: "event", value: '"purchase"', color: GREEN, comma: true },
	{ depth: 1, key: "value", value: "129.90", color: YELLOW, comma: true },
	{ depth: 1, key: "currency", value: '"EUR"', color: GREEN, comma: true },
	{ depth: 1, key: "items", value: "[ { … } ]" },
	{ depth: 0, value: "}" },
];

/** The full payload, which fills the promo shot's taller pane. */
export const PURCHASE_FULL: readonly JsonLine[] = [
	{ depth: 0, value: "{" },
	{ depth: 1, key: "event", value: '"purchase"', color: GREEN, comma: true },
	{ depth: 1, key: "ecommerce", value: "{" },
	{ depth: 2, key: "transaction_id", value: '"T-48219"', color: GREEN, comma: true },
	{ depth: 2, key: "value", value: "129.90", color: YELLOW, comma: true },
	{ depth: 2, key: "currency", value: '"EUR"', color: GREEN, comma: true },
	{ depth: 2, key: "items", value: "[" },
	{ depth: 3, value: "{" },
	{ depth: 4, key: "item_id", value: '"SKU-771"', color: GREEN, comma: true },
	{ depth: 4, key: "item_name", value: '"Trail Runner"', color: GREEN, comma: true },
	{ depth: 4, key: "price", value: "129.90", color: YELLOW, comma: true },
	{ depth: 4, key: "quantity", value: "1", color: YELLOW },
	{ depth: 3, value: "}" },
	{ depth: 2, value: "]" },
	{ depth: 1, value: "}" },
	{ depth: 0, value: "}" },
];
