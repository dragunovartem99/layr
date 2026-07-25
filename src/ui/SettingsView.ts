/** One row in the settings panel: a label plus whatever control the view
 * builds into its slot. `root` is the panel root, for controls that need to
 * push a value onto it (font size, theme, …). */
export type SettingsControl = {
	readonly label: string;
	mount(slot: HTMLElement, root: HTMLElement): void;
};

type SettingsViewOptions = {
	controls: SettingsControl[];
};

/** The collapsible settings panel under the toolbar. Owns the toggle button
 * and lays out one labelled row per control. */
export class SettingsView {
	#controls: SettingsControl[];
	#toggle!: HTMLButtonElement;
	#panel!: HTMLElement;
	#open = false;

	constructor({ controls }: SettingsViewOptions) {
		this.#controls = controls;
	}

	mount(root: HTMLElement): void {
		this.#toggle = root.querySelector(".layr__btn--settings")!;
		this.#panel = root.querySelector(".layr__settings")!;

		for (const control of this.#controls) {
			this.#panel.append(this.#buildRow(control, root));
		}

		this.#toggle.addEventListener("click", () => this.#setOpen(!this.#open));
		this.#setOpen(this.#open);
	}

	#buildRow(control: SettingsControl, root: HTMLElement): HTMLElement {
		const row = document.createElement("div");
		row.className = "layr__setting";

		const label = document.createElement("span");
		label.className = "layr__setting-label";
		label.textContent = control.label;

		const slot = document.createElement("div");
		slot.className = "layr__setting-control";

		row.append(label, slot);
		control.mount(slot, root);
		return row;
	}

	#setOpen(open: boolean): void {
		this.#open = open;
		this.#panel.hidden = !open;
		this.#toggle.setAttribute("aria-expanded", String(open));
	}
}
