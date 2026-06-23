import { defineConfig } from "vite";

export default defineConfig({
	publicDir: "public",
	build: {
		outDir: "dist",
		lib: {
			entry: "src/index.ts",
			formats: ["iife"],
			name: "Layr",
		},
		rollupOptions: {
			output: {
				entryFileNames: "content.js",
			},
		},
	},
});
