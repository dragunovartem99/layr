import type { Element } from "./elements.ts";
import { tint } from "./palette.ts";

// Layered waves behind the artwork, echoing the mark's stacked layers. Flat
// colour reads as dead space and a coloured gradient muddies the palette, so
// the depth comes from geometry: evenly spaced sine lines, each phase-shifted
// from the last, only just lighter than the field they sit on.
const SPACING = 16;
const AMPLITUDE = 9;
const WAVELENGTH = 180;
const PHASE_STEP = 0.35;
const STEP = 6;

function wave(width: number, y: number, phase: number): string {
	const points: string[] = [];

	for (let x = -STEP; x <= width + STEP; x += STEP) {
		const dy = AMPLITUDE * Math.sin((x / WAVELENGTH) * 2 * Math.PI + phase);

		points.push(`${x.toFixed(1)},${(y + dy).toFixed(2)}`);
	}

	return `<polyline points="${points.join(" ")}" fill="none" stroke="${tint(0.11)}" stroke-width="1.2" stroke-linejoin="round" />`;
}

export function waves(width: number, height: number): Element {
	const lines: string[] = [];

	for (let y = -AMPLITUDE, i = 0; y <= height + AMPLITUDE; y += SPACING, i++) {
		lines.push(wave(width, y, i * PHASE_STEP));
	}

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
	${lines.join("\n\t")}
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
