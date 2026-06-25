import { defineConfig } from "vite";

export default defineConfig({
	publicDir: false,
	build: {
		outDir: "dist",
		rollupOptions: {
			input: {
				sidepanel: "./sidepanel.html",
			},
		},
		emptyOutDir: false,
	},
});
