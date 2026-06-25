import { defineConfig } from "vite";

export default defineConfig({
	publicDir: "public",
	build: {
		outDir: "dist",
		lib: {
			entry: "src/content-main.ts",
			formats: ["iife"],
			name: "Layr",
		},
		rollupOptions: {
			output: {
				entryFileNames: "content-main.js",
			},
		},
		emptyOutDir: true,
	},
});
