import type { PanelPlatform, PortLike } from "../types.ts";
import { MockPort } from "./MockPort.ts";
import { MockSyncKeyValueStore } from "./MockSyncKeyValueStore.ts";

/** Test double for the side panel's browser surface. Each connect creates a
 * MockPort pair; the background end is handed to onConnect so a test can wire
 * it to a real BackgroundApp (or keep it to script the other side). */
export class MockPanelPlatform implements PanelPlatform {
	readonly filterStore = new MockSyncKeyValueStore();

	activeTabId: number | null = null;
	closed = false;
	onConnect: ((backgroundEnd: MockPort) => void) | null = null;

	#tabChangeHandlers: (() => void)[] = [];

	connectToBackground(): PortLike {
		const [panelEnd, backgroundEnd] = MockPort.pair();
		this.onConnect?.(backgroundEnd);
		return panelEnd;
	}

	getActiveTabId(): Promise<number | null> {
		return Promise.resolve(this.activeTabId);
	}

	onActiveTabChanged(fn: () => void): void {
		this.#tabChangeHandlers.push(fn);
	}

	closePanel(): void {
		this.closed = true;
	}

	switchToTab(tabId: number | null): void {
		this.activeTabId = tabId;
		for (const fn of this.#tabChangeHandlers) fn();
	}
}
