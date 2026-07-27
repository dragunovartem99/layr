import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

import type { Element } from "./elements.ts";
import { FONTS } from "./fonts.ts";
import { promo, PROMO_HEIGHT, PROMO_WIDTH } from "./promo.ts";
import { tile, TILE_HEIGHT, TILE_WIDTH } from "./tile.ts";

// The Chrome Web Store rejects artwork that is off by a pixel, so each piece is
// laid out at its exact size. satori draws the layout to SVG and resvg
// rasterises it: no browser, and text and the mark stay vector to the last step
// rather than being downsampled from a screenshot.
const ART_DIR = join(import.meta.dirname, "..", "..", "store", "assets");

const artwork = [
	{ out: "screenshot-1280x800.png", build: promo, width: PROMO_WIDTH, height: PROMO_HEIGHT },
	{ out: "tile-440x280.png", build: tile, width: TILE_WIDTH, height: TILE_HEIGHT },
];

async function render(build: () => Element, width: number, height: number): Promise<Buffer> {
	const svg = await satori(build() as never, { width, height, fonts: FONTS });

	return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng());
}

await Promise.all(
	artwork.map(async ({ out, build, width, height }) => {
		const png = await render(build, width, height);
		const outputPath = resolve(ART_DIR, out);

		mkdirSync(dirname(outputPath), { recursive: true });
		writeFileSync(outputPath, png);

		console.log(`store/assets/${out}  ${width}x${height}`);
	})
);
