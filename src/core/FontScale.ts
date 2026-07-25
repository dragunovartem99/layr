import { Signal } from "./Signal.ts";

/** What FontScale needs from storage; localStorage-shaped, injected so the
 * core stays browser-free. */
type ScaleStore = {
	get(key: string): string | null;
	set(key: string, value: string): void;
};

const SCALE_KEY = "layr-font-scale";

/** Percent of the panel's base font size, so the stored value survives a
 * change to that base. */
export const DEFAULT_FONT_SCALE = 100;
export const MIN_FONT_SCALE = 80;
export const MAX_FONT_SCALE = 140;
const STEP = 10;

const clamp = (scale: number): number => Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, scale));

// Steps land on the scale's own grid, so a value restored from an older range
// still snaps to a reachable stop.
const snap = (scale: number): number => clamp(Math.round(scale / STEP) * STEP);

/** How large the panel renders, as a percentage. Chrome never delivers its
 * zoom shortcuts to a side panel, so the panel carries its own. */
export class FontScale {
	readonly scale = new Signal<number>(DEFAULT_FONT_SCALE);

	#store: ScaleStore;

	constructor(store: ScaleStore) {
		this.#store = store;
		const saved = Number(store.get(SCALE_KEY));
		if (Number.isFinite(saved) && saved > 0) this.scale.value = snap(saved);
	}

	get canIncrease(): boolean {
		return this.scale.value < MAX_FONT_SCALE;
	}

	get canDecrease(): boolean {
		return this.scale.value > MIN_FONT_SCALE;
	}

	increase(): void {
		this.#setScale(this.scale.value + STEP);
	}

	decrease(): void {
		this.#setScale(this.scale.value - STEP);
	}

	reset(): void {
		this.#setScale(DEFAULT_FONT_SCALE);
	}

	#setScale(scale: number): void {
		this.scale.value = clamp(scale);
		this.#store.set(SCALE_KEY, String(this.scale.value));
	}
}
