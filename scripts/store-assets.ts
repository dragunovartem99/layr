import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Renders the Chrome Web Store artwork in store/ to PNGs of the exact
// dimensions the store accepts — it rejects anything off by a pixel, so the
// pages are authored at 1:1 and shot at a device scale factor of 1.
const shots = [
	{
		page: "store/promo.html",
		out: "store/assets/screenshot-1280x800.png",
		width: 1280,
		height: 800,
	},
	{ page: "store/tile.html", out: "store/assets/tile-440x280.png", width: 440, height: 280 },
];

const CANDIDATES = [
	process.env.CHROME,
	"google-chrome",
	"google-chrome-stable",
	"chromium",
	"chromium-browser",
];

function findChrome(): string {
	for (const candidate of CANDIDATES) {
		if (!candidate) continue;
		try {
			execFileSync(candidate, ["--version"], { stdio: "ignore" });
			return candidate;
		} catch {
			// not on PATH; try the next one
		}
	}
	throw new Error("No Chrome found. Install Chrome or set CHROME to its path.");
}

const chrome = findChrome();

for (const { page, out, width, height } of shots) {
	execFileSync(
		chrome,
		[
			"--headless",
			"--disable-gpu",
			"--hide-scrollbars",
			"--force-device-scale-factor=1",
			`--window-size=${width},${height}`,
			`--screenshot=${resolve(out)}`,
			resolve(page),
		],
		{ stdio: "ignore" }
	);

	if (!existsSync(out)) throw new Error(`Chrome wrote no screenshot for ${page}`);
	console.log(`${out}  ${width}x${height}`);
}
