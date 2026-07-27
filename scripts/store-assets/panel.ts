import { div, line, text, type Element } from "./elements.ts";
import { MONO, UI } from "./fonts.ts";
import { BG, BLUE, GREEN, SURFACE, TEXT, TEXT_BRIGHT, TEXT_DIM, tint, YELLOW } from "./palette.ts";

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

export type PanelScale = {
	/** Row and toolbar text size; everything else is derived from it. */
	font: number;
	padding: number;
	radius: number;
};

export function toolbar({ font, padding }: PanelScale, count: number): Element {
	const control = {
		fontSize: font * 0.88,
		color: TEXT,
		backgroundColor: BG,
		border: `1px solid ${tint(0.16)}`,
		borderRadius: 5,
		padding: `${padding * 0.3}px ${padding * 0.7}px`,
	};

	return div(
		{
			flexDirection: "row",
			alignItems: "center",
			gap: padding * 0.6,
			padding: `${padding * 0.7}px ${padding}px`,
			backgroundColor: SURFACE,
			borderBottom: `1px solid ${tint(0.14)}`,
			fontFamily: UI,
		},
		[
			text({ ...control, flexGrow: 1, color: TEXT_DIM }, "Filter events…"),
			text({ fontSize: font * 0.88, color: TEXT }, String(count)),
			text(control, "Clear"),
		]
	);
}

export function row(
	{ font, padding }: PanelScale,
	{ n, name, time }: Event,
	selected = false
): Element {
	return line(
		{
			alignItems: "center",
			gap: padding * 0.7,
			padding: `${padding * 0.45}px ${padding}px`,
			borderBottom: `1px solid ${tint(0.1)}`,
			backgroundColor: selected ? SURFACE : "transparent",
			fontSize: font,
			fontFamily: UI,
		},
		[
			text(
				{ color: TEXT_DIM, fontSize: font * 0.85, width: font, justifyContent: "flex-end" },
				String(n)
			),
			text({ color: selected ? TEXT_BRIGHT : BLUE, flexGrow: 1 }, name),
			text({ color: TEXT_DIM, fontSize: font * 0.85 }, time),
		]
	);
}

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

// The payload of the selected event, rendered as the panel pretty-prints it.
export function json({ font, padding }: PanelScale, lines: readonly JsonLine[]): Element {
	const size = font * 0.87;

	return div(
		{
			flexDirection: "column",
			flexGrow: 1,
			padding: `${padding * 0.7}px ${padding}px`,
			fontFamily: MONO,
			fontSize: size,
			lineHeight: 1.55,
		},
		lines.map(({ depth, key, value, color, comma }) =>
			line({ paddingLeft: depth * size * 1.2 }, [
				...(key === undefined
					? []
					: [
							text({ color: BLUE }, `"${key}"`),
							text(
								{ color: TEXT, marginRight: value === undefined ? 0 : size * 0.6 },
								":"
							),
						]),
				...(value === undefined ? [] : [text({ color: color ?? TEXT }, value)]),
				...(comma ? [text({ color: TEXT }, ",")] : []),
			])
		)
	);
}

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
