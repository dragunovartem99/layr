import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { SatoriOptions } from "satori";

const FONTS_DIR = join(import.meta.dirname, "..", "..", "store", "fonts");

function load(file: string): Buffer {
	return readFileSync(join(FONTS_DIR, file));
}

/**
 * satori has no system fonts, so every family the artwork draws with is
 * vendored. Two families, split by who is speaking: DM Sans addresses the reader,
 * IBM Plex Mono is what the panel itself shows.
 */
export const FONTS: SatoriOptions["fonts"] = [
	{ name: "DM Sans", data: load("DMSans-Regular.ttf"), weight: 400, style: "normal" },
	{ name: "DM Sans", data: load("DMSans-Bold.ttf"), weight: 700, style: "normal" },
	{ name: "IBM Plex Mono", data: load("IBMPlexMono-Regular.ttf"), weight: 400, style: "normal" },
	{ name: "IBM Plex Mono", data: load("IBMPlexMono-SemiBold.ttf"), weight: 600, style: "normal" },
];

// The wordmark, headline and selling copy — everything addressed to the reader.
export const DISPLAY = "DM Sans";

// The panel mock, down to its toolbar and rows: it is a picture of a developer
// tool, so it is set in the face such a tool would use.
export const UI = "IBM Plex Mono";
export const MONO = "IBM Plex Mono";
