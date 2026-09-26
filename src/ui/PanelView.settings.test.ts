// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_FONT_SCALE, MIN_FONT_SCALE } from "../core/FontScale.ts";
import { setup, settings, button, fontVar } from "../testing/panelView.ts";

afterEach(() => {
	vi.useRealTimers();
});

describe("PanelView settings", () => {
	it("keeps the settings panel closed until the toggle is clicked", () => {
		setup();

		expect(settings().hidden).toBe(true);
		expect(button("settings").getAttribute("aria-expanded")).toBe("false");

		button("settings").click();

		expect(settings().hidden).toBe(false);
		expect(button("settings").getAttribute("aria-expanded")).toBe("true");
	});

	it("closes the settings panel on a second click", () => {
		setup();
		button("settings").click();

		button("settings").click();

		expect(settings().hidden).toBe(true);
	});

	it("renders a labelled row per setting", () => {
		setup();

		const labels = [...document.querySelectorAll(".layr__setting-label")].map(
			(el) => el.textContent
		);
		expect(labels).toEqual(["Font size"]);
	});
});

describe("PanelView font size", () => {
	it("applies the current scale to the panel root on mount", () => {
		setup();

		expect(fontVar()).toBe("1");
	});

	it("grows and shrinks the scale from the settings buttons", () => {
		const { fontScale } = setup();

		button("larger").click();

		expect(fontScale.scale.value).toBe(DEFAULT_FONT_SCALE + 10);
		expect(fontVar()).toBe("1.1");

		button("smaller").click();

		expect(fontScale.scale.value).toBe(DEFAULT_FONT_SCALE);
		expect(fontVar()).toBe("1");
	});

	it("disables the button that would go past a bound", () => {
		const { fontScale } = setup();

		while (fontScale.canDecrease) button("smaller").click();

		expect(fontScale.scale.value).toBe(MIN_FONT_SCALE);
		expect(button("smaller").disabled).toBe(true);
		expect(button("larger").disabled).toBe(false);
	});
});
