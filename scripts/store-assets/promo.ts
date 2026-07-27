import { dots } from "./backdrop.ts";
import { div, line, text, type Element } from "./elements.ts";
import { DISPLAY, UI } from "./fonts.ts";
import { mark } from "./mark.ts";
import {
	BG,
	BLUE,
	GREEN,
	RED,
	SURFACE,
	TEXT,
	TEXT_BRIGHT,
	TEXT_DIM,
	tint,
	YELLOW,
} from "./palette.ts";
import { EVENTS, json, PURCHASE_FULL, row, toolbar, type PanelScale } from "./panel.ts";

export const PROMO_WIDTH = 1280;
export const PROMO_HEIGHT = 800;

const SCALE: PanelScale = { font: 15, padding: 14, radius: 0 };

const FEATURES = [
	"Live capture from document start",
	"Full, pretty-printed JSON payloads",
	"Search and copy any event",
	"No network requests, ever",
];

// Drawn rather than set: the mono face has no U+2713, and a missing glyph
// rasterises as tofu instead of failing loudly.
const CHECK = `data:image/svg+xml;base64,${Buffer.from(
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M2.5 8.5l3.5 3.5 7.5-8" fill="none" stroke="${BLUE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
).toString("base64")}`;

function check(): Element {
	return {
		type: "img",
		props: { src: CHECK, width: 16, height: 16, style: { marginRight: 12 } },
	};
}

// Broken by hand for the same reason as the tile's: the accent word has to
// land whole on the first line.
function headline(): Element {
	return div(
		{
			flexDirection: "column",
			fontFamily: DISPLAY,
			fontSize: 45,
			fontWeight: 700,
			letterSpacing: -1.6,
			lineHeight: 1.18,
			marginBottom: 22,
		},
		[
			div({ flexDirection: "row" }, [
				text({ color: TEXT_BRIGHT, marginRight: 13 }, "Every"),
				text({ color: BLUE, marginRight: 13 }, "dataLayer"),
				text({ color: TEXT_BRIGHT }, "push,"),
			]),
			text({ color: TEXT_BRIGHT }, "right next to the page."),
		]
	);
}

function copy(): Element {
	return div({ flexDirection: "column", width: 520, flexShrink: 0, marginLeft: 64 }, [
		div({ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 22 }, [
			mark(44),
			text(
				{
					fontFamily: DISPLAY,
					fontSize: 44,
					fontWeight: 700,
					letterSpacing: -1.4,
					color: TEXT_BRIGHT,
				},
				"Layr"
			),
		]),
		headline(),
		div(
			{
				flexDirection: "column",
				fontFamily: DISPLAY,
				fontSize: 18,
				lineHeight: 1.5,
				color: TEXT_DIM,
				marginBottom: 32,
			},
			[
				text({}, "A side-panel inspector for GTM and GA4 debugging —"),
				text({ marginTop: 6 }, "including the pushes that fired before you opened it."),
			]
		),
		div(
			{ flexDirection: "column", gap: 13 },
			FEATURES.map((feature) =>
				line({ alignItems: "center" }, [
					check(),
					text({ fontFamily: DISPLAY, fontSize: 16, color: TEXT }, feature),
				])
			)
		),
	]);
}

function dot(color: string): Element {
	return div({ width: 11, height: 11, borderRadius: 6, backgroundColor: color });
}

// A window frame, so the mock reads as the side panel docked in a browser.
function chromeBar(): Element {
	return line(
		{
			alignItems: "center",
			gap: 8,
			padding: "0 14px",
			height: 38,
			flexShrink: 0,
			backgroundColor: SURFACE,
			borderBottom: `1px solid ${tint(0.14)}`,
		},
		[
			dot(RED),
			dot(YELLOW),
			dot(GREEN),
			text(
				{ marginLeft: 10, fontFamily: UI, fontSize: 13, color: TEXT_DIM },
				"Layr — side panel"
			),
		]
	);
}

function panel(): Element {
	return div(
		{
			flexDirection: "column",
			width: 512,
			height: 704,
			marginLeft: 56,
			backgroundColor: BG,
			border: `1px solid ${tint(0.22)}`,
			borderRadius: 14,
			overflow: "hidden",
			boxShadow: "0 30px 70px rgba(0, 0, 0, 0.55)",
		},
		[
			chromeBar(),
			toolbar(SCALE, EVENTS.length),
			...EVENTS.slice(0, 8).map((event) => row(SCALE, event)),
			row(SCALE, EVENTS[8] as (typeof EVENTS)[number], true),
			json(SCALE, PURCHASE_FULL),
		]
	);
}

export function promo(): Element {
	return div(
		{
			width: PROMO_WIDTH,
			height: PROMO_HEIGHT,
			position: "relative",
			backgroundColor: BG,
		},
		[
			dots(PROMO_WIDTH, PROMO_HEIGHT),
			div({ width: PROMO_WIDTH, height: PROMO_HEIGHT, alignItems: "center" }, [
				copy(),
				panel(),
			]),
		]
	);
}
