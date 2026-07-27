import type { Element } from "./elements.ts";
import { tint } from "./palette.ts";

// A field of dots behind the artwork. Flat colour reads as dead space and a
// coloured gradient muddies the palette, so the depth comes from geometry: an
// even grid of points, only just lighter than the field they sit on.
const SPACING = 20;
const RADIUS = 1.3;

export function dots(width: number, height: number): Element {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
	<defs>
		<pattern id="d" width="${SPACING}" height="${SPACING}" patternUnits="userSpaceOnUse">
			<circle cx="${SPACING / 2}" cy="${SPACING / 2}" r="${RADIUS}" fill="${tint(0.14)}" />
		</pattern>
	</defs>
	<rect width="${width}" height="${height}" fill="url(#d)" />
</svg>`;

	return {
		type: "img",
		props: {
			src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
			width,
			height,
			style: { position: "absolute", top: 0, left: 0 },
		},
	};
}
