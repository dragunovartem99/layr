import type { FontScale } from "../core/FontScale.ts";
import type { SettingsControl } from "./SettingsView.ts";

const TEMPLATE = `
	<button class="layr__btn layr__btn--smaller" type="button"
		title="Smaller text" aria-label="Smaller text">A−</button>
	<span class="layr__setting-value" aria-live="polite"></span>
	<button class="layr__btn layr__btn--larger" type="button"
		title="Larger text" aria-label="Larger text">A+</button>`;

type FontScaleViewOptions = {
	fontScale: FontScale;
};

/** The font size row: steps FontScale up and down and pushes the result onto
 * the panel root, which every other size is relative to. */
export class FontScaleView implements SettingsControl {
	readonly label = "Font size";

	#fontScale: FontScale;
	#root!: HTMLElement;
	#smaller!: HTMLButtonElement;
	#larger!: HTMLButtonElement;
	#value!: HTMLElement;

	constructor({ fontScale }: FontScaleViewOptions) {
		this.#fontScale = fontScale;
	}

	mount(slot: HTMLElement, root: HTMLElement): void {
		slot.innerHTML = TEMPLATE;
		this.#root = root;
		this.#smaller = slot.querySelector(".layr__btn--smaller")!;
		this.#larger = slot.querySelector(".layr__btn--larger")!;
		this.#value = slot.querySelector(".layr__setting-value")!;

		this.#smaller.addEventListener("click", () => this.#fontScale.decrease());
		this.#larger.addEventListener("click", () => this.#fontScale.increase());

		this.#fontScale.scale.subscribe((scale) => this.#render(scale));
		this.#render(this.#fontScale.scale.value);
	}

	#render(scale: number): void {
		this.#root.style.setProperty("--layr-font-scale", String(scale / 100));
		this.#value.textContent = `${scale}%`;
		this.#smaller.disabled = !this.#fontScale.canDecrease;
		this.#larger.disabled = !this.#fontScale.canIncrease;
	}
}
