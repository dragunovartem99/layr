import { describe, expect, it } from "vitest";

import { MockSyncKeyValueStore } from "../platform/mock/MockSyncKeyValueStore.ts";
import { DEFAULT_FONT_SCALE, FontScale, MAX_FONT_SCALE, MIN_FONT_SCALE } from "./FontScale.ts";

function makeScale(store = new MockSyncKeyValueStore()): {
	scale: FontScale;
	store: MockSyncKeyValueStore;
} {
	return { scale: new FontScale(store), store };
}

describe("FontScale", () => {
	it("starts at the default scale", () => {
		const { scale } = makeScale();

		expect(scale.scale.value).toBe(DEFAULT_FONT_SCALE);
	});

	it("steps the scale up and down", () => {
		const { scale } = makeScale();

		scale.increase();
		expect(scale.scale.value).toBe(DEFAULT_FONT_SCALE + 10);

		scale.decrease();
		expect(scale.scale.value).toBe(DEFAULT_FONT_SCALE);
	});

	it("clamps at the bounds", () => {
		const { scale } = makeScale();

		for (let i = 0; i < 50; i++) scale.increase();
		expect(scale.scale.value).toBe(MAX_FONT_SCALE);
		expect(scale.canIncrease).toBe(false);

		for (let i = 0; i < 50; i++) scale.decrease();
		expect(scale.scale.value).toBe(MIN_FONT_SCALE);
		expect(scale.canDecrease).toBe(false);
	});
});

describe("FontScale persistence", () => {
	it("persists the scale and restores it", () => {
		const { scale, store } = makeScale();

		scale.increase();

		expect(store.get("layr-font-scale")).toBe(String(DEFAULT_FONT_SCALE + 10));
		expect(new FontScale(store).scale.value).toBe(DEFAULT_FONT_SCALE + 10);
	});

	it("clamps a saved scale that is out of range", () => {
		const store = new MockSyncKeyValueStore();
		store.set("layr-font-scale", "999");

		expect(new FontScale(store).scale.value).toBe(MAX_FONT_SCALE);
	});

	it("snaps a saved scale onto the step grid", () => {
		const store = new MockSyncKeyValueStore();
		store.set("layr-font-scale", "113");

		expect(new FontScale(store).scale.value).toBe(110);
	});

	it("falls back to the default when nothing valid is saved", () => {
		const store = new MockSyncKeyValueStore();
		store.set("layr-font-scale", "not-a-number");

		expect(new FontScale(store).scale.value).toBe(DEFAULT_FONT_SCALE);
	});

	it("returns to the default on reset", () => {
		const { scale } = makeScale();
		scale.increase();

		scale.reset();

		expect(scale.scale.value).toBe(DEFAULT_FONT_SCALE);
	});
});
