import type { PanelPlatform, PortLike } from "../platform/types.ts";
import { MESSAGE_TYPE, isPanelInMessage } from "../protocol/messages.ts";
import type { PanelInMessage, PanelOutMessage } from "../protocol/messages.ts";

type PanelAppHandlers = {
	/** Buffer replay for the tab this panel is showing; replaces the log. */
	onReset: (events: object[]) => void;
	/** One live event for the tab this panel is showing. */
	onEvent: (payload: object) => void;
	/** The panel now shows a different tab (null when the window has none). */
	onTabSwitched: (tabId: number | null) => void;
};

type PanelAppOptions = PanelAppHandlers & { platform: PanelPlatform };

/** Panel side: owns the port lifecycle and active-tab tracking, and reduces
 * protocol traffic to the three UI-facing callbacks. The current tab is owned
 * entirely client-side; any message whose tabId doesn't match it is stale
 * (e.g. from a tab this panel isn't showing anymore) and is dropped. */
export class PanelApp {
	#platform: PanelPlatform;
	#handlers: PanelAppHandlers;
	#currentTabId: number | null = null;
	#port: PortLike | null = null;

	constructor({ platform, ...handlers }: PanelAppOptions) {
		this.#platform = platform;
		this.#handlers = handlers;
	}

	async start(): Promise<void> {
		this.#platform.onActiveTabChanged(() => void this.#syncActiveTab());
		this.#connect();
		await this.#syncActiveTab();
	}

	/** Asks the background to drop the current tab's buffer. */
	clearCurrentTab(): void {
		if (this.#currentTabId !== null) {
			this.#send({ type: MESSAGE_TYPE.CLEAR, tabId: this.#currentTabId });
		}
	}

	#send(message: PanelOutMessage): void {
		// oxlint-disable-next-line unicorn/require-post-message-target-origin -- PortLike, not window
		this.#port?.postMessage(message);
	}

	#connect(): void {
		const port = this.#platform.connectToBackground();
		this.#port = port;
		port.onMessage((message) => this.#onPortMessage(message));
		port.onDisconnect(() => {
			if (this.#port === port) this.#port = null;
			this.#connect();
			// The background worker may have restarted, so re-request the
			// current tab's buffer over the fresh port.
			if (this.#currentTabId !== null) {
				this.#send({ type: MESSAGE_TYPE.REQUEST, tabId: this.#currentTabId });
			}
		});
	}

	#onPortMessage(message: unknown): void {
		if (!isPanelInMessage(message)) return;
		switch (message.type) {
			case MESSAGE_TYPE.RESET:
				return this.#onReset(message);
			case MESSAGE_TYPE.EVENT:
				return this.#onEvent(message);
			case MESSAGE_TYPE.CLOSE:
				return this.#platform.closePanel();
		}
	}

	#onReset(message: Extract<PanelInMessage, { type: typeof MESSAGE_TYPE.RESET }>): void {
		if (message.tabId === this.#currentTabId) this.#handlers.onReset(message.events);
	}

	#onEvent(message: Extract<PanelInMessage, { type: typeof MESSAGE_TYPE.EVENT }>): void {
		if (message.tabId === this.#currentTabId && message.payload) {
			this.#handlers.onEvent(message.payload);
		}
	}

	// Switches to whatever tab is active in this panel's own window, if it changed.
	async #syncActiveTab(): Promise<void> {
		const tabId = await this.#platform.getActiveTabId();
		if (tabId === this.#currentTabId) return;

		this.#currentTabId = tabId;
		this.#handlers.onTabSwitched(tabId);
		if (tabId !== null) this.#send({ type: MESSAGE_TYPE.REQUEST, tabId });
	}
}
