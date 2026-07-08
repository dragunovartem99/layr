import type { PanelPlatform, PortLike, SyncKeyValueStore } from "../types.ts";
import { LocalStorageStore } from "./LocalStorageStore.ts";
import { wrapPort } from "./wrapPort.ts";

type ChromePanelPlatformOptions = {
	panelPortName: string;
	windowId: number | undefined;
};

export class ChromePanelPlatform implements PanelPlatform {
	readonly filterStore: SyncKeyValueStore = new LocalStorageStore();

	#panelPortName: string;
	#windowId: number | undefined;

	private constructor({ panelPortName, windowId }: ChromePanelPlatformOptions) {
		this.#panelPortName = panelPortName;
		this.#windowId = windowId;
	}

	// The panel's own window id is resolved once up front; every tab lookup
	// afterwards is scoped to it.
	static async create({
		panelPortName,
	}: {
		panelPortName: string;
	}): Promise<ChromePanelPlatform> {
		const { id: windowId } = await chrome.windows.getCurrent();
		return new ChromePanelPlatform({ panelPortName, windowId });
	}

	connectToBackground(): PortLike {
		return wrapPort(chrome.runtime.connect({ name: this.#panelPortName }));
	}

	async getActiveTabId(): Promise<number | null> {
		if (this.#windowId === undefined) return null;
		const [tab] = await chrome.tabs.query({ active: true, windowId: this.#windowId });
		return tab?.id ?? null;
	}

	onActiveTabChanged(fn: () => void): void {
		chrome.tabs.onActivated.addListener((info) => {
			if (info.windowId === this.#windowId) fn();
		});
	}

	closePanel(): void {
		window.close();
	}
}
