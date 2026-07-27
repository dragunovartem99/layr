import { dots } from "./backdrop.ts";
import { div, text, type Element } from "./elements.ts";
import { DISPLAY } from "./fonts.ts";
import { mark } from "./mark.ts";
import { BG, BLUE, TEXT_BRIGHT, TEXT_DIM, tint } from "./palette.ts";
import { EVENTS, json, PURCHASE_BRIEF, row, toolbar, type PanelScale } from "./panel.ts";

export const TILE_WIDTH = 440;
export const TILE_HEIGHT = 280;

const SCALE: PanelScale = { font: 10.5, padding: 10, radius: 11 };

// The headline is broken by hand: the accent word has to land whole on the
// first line, which no wrapping rule would guarantee.
function headline(): Element {
	return div(
		{
			flexDirection: "column",
			fontFamily: DISPLAY,
			fontSize: 18.5,
			fontWeight: 700,
			letterSpacing: -0.5,
			lineHeight: 1.32,
			marginBottom: 10,
		},
		[
			div({ flexDirection: "row" }, [
				text({ color: TEXT_BRIGHT, marginRight: 6 }, "Every"),
				text({ color: BLUE, marginRight: 6 }, "dataLayer"),
				text({ color: TEXT_BRIGHT }, "push,"),
			]),
			text({ color: TEXT_BRIGHT }, "right next to the page."),
		]
	);
}

function copy(): Element {
	return div(
		{
			flexDirection: "column",
			justifyContent: "center",
			position: "absolute",
			top: 24,
			bottom: 24,
			left: 24,
			width: 214,
		},
		[
			div({ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }, [
				mark(32),
				text(
					{
						fontFamily: DISPLAY,
						fontSize: 30,
						fontWeight: 700,
						letterSpacing: -0.8,
						color: TEXT_BRIGHT,
					},
					"Layr"
				),
			]),
			headline(),
			text(
				{ fontFamily: DISPLAY, fontSize: 12, lineHeight: 1.5, color: TEXT_DIM },
				"Live GTM & GA4 event inspector in the Chrome side panel."
			),
		]
	);
}

// The panel mock bleeds off the right and bottom edges, so the tile reads as a
// window onto the real side panel rather than a boxed-in illustration.
function panel(): Element {
	return div(
		{
			flexDirection: "column",
			position: "absolute",
			top: 26,
			right: -8,
			bottom: -14,
			width: 196,
			backgroundColor: BG,
			border: `1px solid ${tint(0.22)}`,
			borderRadius: `${SCALE.radius}px ${SCALE.radius}px 0 0`,
			overflow: "hidden",
			boxShadow: "0 18px 40px rgba(0, 0, 0, 0.55)",
		},
		[
			toolbar(SCALE, EVENTS.length),
			...EVENTS.slice(5, 8).map((event) => row(SCALE, event)),
			row(SCALE, EVENTS[8] as (typeof EVENTS)[number], true),
			json(SCALE, PURCHASE_BRIEF),
		]
	);
}

export function tile(): Element {
	return div(
		{ width: TILE_WIDTH, height: TILE_HEIGHT, position: "relative", backgroundColor: BG },
		[dots(TILE_WIDTH, TILE_HEIGHT), copy(), panel()]
	);
}
