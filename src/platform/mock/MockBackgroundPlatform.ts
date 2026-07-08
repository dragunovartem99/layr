import type { BackgroundPlatform, PortLike } from "../types.ts";
import { MockKeyValueStore } from "./MockKeyValueStore.ts";

/** Test double for the background worker's browser surface. Tests drive it
 * through the emit* methods and observe side panel opens via openedPanels. */
export class MockBackgroundPlatform implements BackgroundPlatform {
	readonly store: MockKeyValueStore;
	readonly openedPanels: number[] = [];

	#contentHandlers: ((message: unknown, tabId: number) => void)[] = [];
	#connectHandlers: ((port: PortLike) => void)[] = [];
	#actionHandlers: ((tabId: number) => void)[] = [];
	#tabRemovedHandlers: ((tabId: number) => void)[] = [];

	/** Pass a shared store to simulate a service worker restart: the map
	 * outlives the platform the way chrome.storage.session outlives the worker. */
	constructor({ store = new MockKeyValueStore() }: { store?: MockKeyValueStore } = {}) {
		this.store = store;
	}

	onContentMessage(fn: (message: unknown, tabId: number) => void): void {
		this.#contentHandlers.push(fn);
	}

	onPanelConnect(fn: (port: PortLike) => void): void {
		this.#connectHandlers.push(fn);
	}

	onActionClicked(fn: (tabId: number) => void): void {
		this.#actionHandlers.push(fn);
	}

	onTabRemoved(fn: (tabId: number) => void): void {
		this.#tabRemovedHandlers.push(fn);
	}

	openSidePanel(tabId: number): void {
		this.openedPanels.push(tabId);
	}

	emitContentMessage(message: unknown, tabId: number): void {
		for (const fn of this.#contentHandlers) fn(message, tabId);
	}

	emitPanelConnect(port: PortLike): void {
		for (const fn of this.#connectHandlers) fn(port);
	}

	emitActionClicked(tabId: number): void {
		for (const fn of this.#actionHandlers) fn(tabId);
	}

	emitTabRemoved(tabId: number): void {
		for (const fn of this.#tabRemovedHandlers) fn(tabId);
	}
}
