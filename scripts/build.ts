import { build } from "vite";

// The side panel is a regular ESM page; this build also empties dist and
// copies public/ (manifest, icons).
await build({
	configFile: false,
	publicDir: "public",
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			input: { sidepanel: "./sidepanel.html" },
		},
	},
});

// Content scripts and the service worker cannot be ES modules, so each one is
// bundled separately as a self-contained IIFE.
for (const entry of ["background", "content-main", "content-isolated"]) {
	// oxlint-disable-next-line no-await-in-loop -- builds share dist/, so they must not race
	await build({
		configFile: false,
		publicDir: false,
		build: {
			outDir: "dist",
			emptyOutDir: false,
			lib: {
				entry: `src/${entry}.ts`,
				formats: ["iife"],
				name: "Layr",
			},
			rollupOptions: {
				output: { entryFileNames: `${entry}.js` },
			},
		},
	});
}
