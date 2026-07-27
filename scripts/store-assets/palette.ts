/**
 * The artwork is drawn outside the browser, so it cannot read
 * src/ui/panel.css. These are the Tomorrow Night values the panel itself uses —
 * the store artwork is limited to this set so it stays the same product.
 */
export const BG = "#1D1F21";
export const SURFACE = "#282A2E";
export const BLUE = "#81A2BE";
export const GREEN = "#B5BD68";
export const YELLOW = "#F0C674";
export const RED = "#CC6666";
export const TEXT = "#C5C8C6";
export const TEXT_BRIGHT = "#E2E4E3";
export const TEXT_DIM = "#969896";

// Hairlines and fills are alpha tints of the foreground rather than new greys.
export function tint(alpha: number): string {
	return `rgba(197, 200, 198, ${alpha})`;
}
