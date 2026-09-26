import { waves } from "./backdrop.ts";
import { copy } from "./copy.ts";
import { div } from "./elements.ts";
import type { Element } from "./elements.ts";
import { framedPanel } from "./frame.ts";
import { BG } from "./palette.ts";

export const PROMO_WIDTH = 1280;
export const PROMO_HEIGHT = 800;

export function promo(): Element {
	return div(
		{
			width: PROMO_WIDTH,
			height: PROMO_HEIGHT,
			position: "relative",
			backgroundColor: BG,
		},
		[
			waves(PROMO_WIDTH, PROMO_HEIGHT),
			div({ width: PROMO_WIDTH, height: PROMO_HEIGHT, alignItems: "center" }, [
				copy(),
				framedPanel(),
			]),
		]
	);
}
