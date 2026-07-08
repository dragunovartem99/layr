import { describe, expect, it } from "vitest";

import { Signal } from "./Signal.ts";

describe("Signal", () => {
	it("exposes its current value", () => {
		const signal = new Signal("page_view");

		expect(signal.value).toBe("page_view");
	});

	it("notifies subscribers on every set", () => {
		const signal = new Signal(0);
		const seen: number[] = [];
		signal.subscribe((v) => seen.push(v));

		signal.value = 1;
		signal.value = 2;

		expect(seen).toEqual([1, 2]);
	});

	it("does not notify on subscribe", () => {
		const signal = new Signal("initial");
		const seen: string[] = [];

		signal.subscribe((v) => seen.push(v));

		expect(seen).toEqual([]);
	});
});

describe("Signal unsubscription", () => {
	it("stops notifying after unsubscribe", () => {
		const signal = new Signal(10);
		const seen: number[] = [];
		const unsubscribe = signal.subscribe((v) => seen.push(v));

		unsubscribe();
		signal.value = 20;

		expect(seen).toEqual([]);
	});

	it("notifies every subscriber independently", () => {
		const signal = new Signal("a");
		const first: string[] = [];
		const second: string[] = [];
		signal.subscribe((v) => first.push(v));
		signal.subscribe((v) => second.push(v));

		signal.value = "b";

		expect(first).toEqual(["b"]);
		expect(second).toEqual(["b"]);
	});
});
