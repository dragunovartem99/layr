import { div, line, text } from "./elements.ts";
import type { Element } from "./elements.ts";
import { UI } from "./fonts.ts";
import { BG, GREEN, RED, SURFACE, TEXT_DIM, tint, YELLOW } from "./palette.ts";
import { json, row, toolbar } from "./panel.ts";
import type { PanelScale } from "./panel.ts";
import { EVENTS, PURCHASE_FULL } from "./sample.ts";

const SCALE: PanelScale = { font: 15, padding: 14, radius: 0 };

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

export function framedPanel(): Element {
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
