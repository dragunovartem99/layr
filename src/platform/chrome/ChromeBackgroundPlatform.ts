import type { BackgroundPlatform, KeyValueStore, PortLike } from "../types.ts";
import { ChromeSessionStore } from "./ChromeSessionStore.ts";
import { wrapPort } from "./wrapPort.ts";

export class ChromeBackgroundPlatform implements BackgroundPlatform {
	readonly store: KeyValueStore = new ChromeSessionStore();

	#panelPortName: string;

	constructor({ panelPortName }: { panelPortName: string }) {
		this.#panelPortName = panelPortName;
	}

	onContentMessage(fn: (message: unknown, tabId: number) => void): void {
		chrome.runtime.onMessage.addListener((message: unknown, sender) => {
			const tabId = sender.tab?.id;
			if (tabId !== undefined) fn(message, tabId);
		});
	}

	onPanelConnect(fn: (port: PortLike) => void): void {
		chrome.runtime.onConnect.addListener((port) => {
			if (port.name === this.#panelPortName) fn(wrapPort(port));
		});
	}

	onActionClicked(fn: (tabId: number) => void): void {
		chrome.action.onClicked.addListener((tab) => {
			if (tab.id !== undefined) fn(tab.id);
		});
	}

	onTabRemoved(fn: (tabId: number) => void): void {
		chrome.tabs.onRemoved.addListener(fn);
	}

	openSidePanel(tabId: number): void {
		void chrome.sidePanel.open({ tabId });
	}
}
