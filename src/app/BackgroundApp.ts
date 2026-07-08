import { EventBuffer } from "../core/EventBuffer.ts";
import type { BufferSnapshot } from "../core/EventBuffer.ts";
import type { BackgroundPlatform, PortLike } from "../platform/types.ts";
import { MESSAGE_TYPE, isContentMessage, isPanelOutMessage } from "../protocol/messages.ts";
import type { ContentMessage, PanelInMessage } from "../protocol/messages.ts";

const STORAGE_KEY = "buffers";

/** Background worker: buffers events per tab and serves connected panels.
 * Panels never learn which window/tab they belong to here — each panel tracks
 * its own active tab and asks for exactly the buffer it wants, so a tab
 * opening or activating anywhere can never reset a panel that isn't looking
 * at it. */
export class BackgroundApp {
	#platform: BackgroundPlatform;
	#buffer = new EventBuffer();
	#panels = new Set<PortLike>();
	/** The service worker is unloaded after ~30s idle, so the buffer is
	 * persisted to session storage and rehydrated on start; every buffer
	 * access waits for this. */
	#ready: Promise<void> = Promise.resolve();

	constructor(platform: BackgroundPlatform) {
		this.#platform = platform;
	}

	/** Registers all listeners. Must be called synchronously on worker startup
	 * so Chrome can wake the worker for any of them. */
	start(): void {
		this.#ready = this.#restore();

		this.#platform.onContentMessage((message, tabId) => {
			if (isContentMessage(message)) this.#onContentMessage(message, tabId);
		});
		this.#platform.onPanelConnect((port) => this.#onPanelConnect(port));
		this.#platform.onActionClicked((tabId) => this.#onActionClicked(tabId));
		this.#platform.onTabRemoved((tabId) => void this.#removeTab(tabId));
	}

	async #removeTab(tabId: number): Promise<void> {
		await this.#ready;
		this.#buffer.delete(tabId);
		this.#persist();
	}

	async #restore(): Promise<void> {
		const stored = await this.#platform.store.get(STORAGE_KEY);
		this.#buffer.restore((stored ?? {}) as BufferSnapshot);
	}

	#persist(): void {
		void this.#platform.store.set(STORAGE_KEY, this.#buffer.toJSON());
	}

	#send(port: PortLike, message: PanelInMessage): void {
		try {
			// oxlint-disable-next-line unicorn/require-post-message-target-origin -- PortLike, not window
			port.postMessage(message);
		} catch {
			this.#panels.delete(port);
		}
	}

	#pushReset(port: PortLike, tabId: number): void {
		this.#send(port, { type: MESSAGE_TYPE.RESET, tabId, events: this.#buffer.get(tabId) });
	}

	// Broadcasts the (now empty) buffer to every panel. Each panel only applies
	// a RESET for the tab it's currently showing, so this is a no-op for panels
	// on other tabs/windows.
	#clearBuffer(tabId: number): void {
		this.#buffer.clear(tabId);
		this.#persist();
		for (const port of this.#panels) this.#pushReset(port, tabId);
	}

	#onContentMessage(message: ContentMessage, tabId: number): void {
		// NAVIGATE is sent by the MAIN-world content script at document_start,
		// which only runs on a full (re)load, so a stale buffer never survives F5.
		if (message.type === MESSAGE_TYPE.NAVIGATE) {
			void this.#ready.then(() => this.#clearBuffer(tabId));
			return;
		}

		// A payload the page failed to serialize arrives as null; normalized to
		// {} so the buffered copy and the live broadcast stay identical.
		void this.#bufferAndBroadcast(tabId, message.payload ?? {});
	}

	async #bufferAndBroadcast(tabId: number, payload: object): Promise<void> {
		await this.#ready;
		this.#buffer.append({ tabId, payload });
		this.#persist();
		for (const port of this.#panels) {
			this.#send(port, { type: MESSAGE_TYPE.EVENT, tabId, payload });
		}
	}

	#onPanelConnect(port: PortLike): void {
		this.#panels.add(port);
		port.onDisconnect(() => this.#panels.delete(port));
		port.onMessage((message) => {
			if (!isPanelOutMessage(message)) return;
			if (message.type === MESSAGE_TYPE.REQUEST) {
				void this.#ready.then(() => this.#pushReset(port, message.tabId));
			}
			if (message.type === MESSAGE_TYPE.CLEAR) {
				void this.#ready.then(() => this.#clearBuffer(message.tabId));
			}
		});
	}

	#onActionClicked(tabId: number): void {
		if (this.#panels.size > 0) {
			for (const port of this.#panels) this.#send(port, { type: MESSAGE_TYPE.CLOSE });
			return;
		}
		this.#platform.openSidePanel(tabId);
	}
}
