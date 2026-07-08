/** A connected message channel between the panel and the background worker.
 * Mirrors chrome.runtime.Port semantics: posting on a disconnected port
 * throws, and disconnecting fires the handlers on the other end. */
export interface PortLike {
	postMessage(message: unknown): void;
	onMessage(fn: (message: unknown) => void): void;
	onDisconnect(fn: () => void): void;
}

/** Async key-value storage (chrome.storage.session in production). */
export interface KeyValueStore {
	get(key: string): Promise<unknown>;
	set(key: string, value: unknown): Promise<void>;
}

/** Sync string storage (localStorage in production). */
export interface SyncKeyValueStore {
	get(key: string): string | null;
	set(key: string, value: string): void;
	remove(key: string): void;
}

/** Everything the background worker needs from the browser. */
export interface BackgroundPlatform {
	readonly store: KeyValueStore;
	onContentMessage(fn: (message: unknown, tabId: number) => void): void;
	onPanelConnect(fn: (port: PortLike) => void): void;
	onActionClicked(fn: (tabId: number) => void): void;
	onTabRemoved(fn: (tabId: number) => void): void;
	openSidePanel(tabId: number): void;
}

/** Everything the side panel needs from the browser. Implementations are
 * scoped to the panel's own window, so tab activity elsewhere is invisible. */
export interface PanelPlatform {
	readonly filterStore: SyncKeyValueStore;
	connectToBackground(): PortLike;
	getActiveTabId(): Promise<number | null>;
	onActiveTabChanged(fn: () => void): void;
	closePanel(): void;
}
