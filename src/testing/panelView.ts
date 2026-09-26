import { FilterState } from "../core/FilterState.ts";
import { FontScale } from "../core/FontScale.ts";
import { Log } from "../core/Log.ts";
import { MockSyncKeyValueStore } from "../platform/mock/MockSyncKeyValueStore.ts";
import { PanelView } from "../ui/PanelView.ts";

export type Setup = {
	log: Log;
	filter: FilterState;
	fontScale: FontScale;
	cleared: { count: number };
};

export function setup(): Setup {
	document.body.innerHTML = "";
	const log = new Log();
	const store = new MockSyncKeyValueStore();
	const filter = new FilterState(store);
	const fontScale = new FontScale(store);
	const cleared = { count: 0 };
	const panel = new PanelView({ log, filter, fontScale, onClear: () => cleared.count++ });
	panel.mount(document.body);
	return { log, filter, fontScale, cleared };
}

export const rows = (): HTMLElement[] => [
	...document.querySelectorAll<HTMLElement>(".layr__entry"),
];
export const visibleRows = (): HTMLElement[] => rows().filter((r) => !r.hidden);
export const countText = (): string | null | undefined =>
	document.querySelector(".layr__count")?.textContent;
export const panelRoot = (): HTMLElement => document.querySelector<HTMLElement>(".layr")!;
export const settings = (): HTMLElement => document.querySelector<HTMLElement>(".layr__settings")!;
export const button = (modifier: string): HTMLButtonElement =>
	document.querySelector<HTMLButtonElement>(`.layr__btn--${modifier}`)!;
export const fontVar = (): string => panelRoot().style.getPropertyValue("--layr-font-scale");
