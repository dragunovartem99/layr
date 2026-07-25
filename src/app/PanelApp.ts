import type { BufferedEvent, Cursor } from "../core/EventBuffer.ts";
import type { PanelPlatform, PortLike } from "../platform/types.ts";
import { MESSAGE_TYPE, isPanelInMessage } from "../protocol/messages.ts";
import type { PanelInMessage, PanelOutMessage } from "../protocol/messages.ts";

type PanelAppHandlers = {
	/** Replaces the log for the tab this panel is showing. */
	onReset: (events: BufferedEvent[]) => void;
	/** Extends the log with events that follow the ones already shown. */
	onAppend: (events: BufferedEvent[]) => void;
	/** The panel now shows a different tab (null when the window has none). */
	onTabSwitched: (tabId: number | null) => void;
};

type PanelAppOptions = PanelAppHandlers & { platform: PanelPlatform };

/** Panel side: owns the port lifecycle and active-tab tracking, and reduces
 * protocol traffic to the three UI-facing callbacks. The current tab is owned
 * entirely client-side; any message whose tabId doesn't match it is stale
 * (e.g. from a tab this panel isn't showing anymore) and is dropped.
 *
 * A cursor into the background's buffer is kept alongside the tab, so the
 * reconnect that follows every worker shutdown asks for the events missed
 * rather than the whole buffer — the log is extended, never rebuilt. */
export class PanelApp {
	#platform: PanelPlatform;
	#handlers: PanelAppHandlers;
	#currentTabId: number | null = null;
	#cursor: Cursor | null = null;
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

	// Asks for the current tab's events. Resuming sends the cursor and asks for
	// just what came after it; otherwise it asks for the buffer from scratch.
	#request({ resume }: { resume: boolean }): void {
		const tabId = this.#currentTabId;
		if (tabId === null) return;

		const cursor = resume ? this.#cursor : null;
		this.#send(
			cursor
				? { type: MESSAGE_TYPE.REQUEST, tabId, cursor }
				: { type: MESSAGE_TYPE.REQUEST, tabId }
		);
	}

	#connect(): void {
		const port = this.#platform.connectToBackground();
		this.#port = port;
		port.onMessage((message) => this.#onPortMessage(message));
		port.onDisconnect(() => {
			if (this.#port === port) this.#port = null;
			this.#connect();
			// The background worker is unloaded after ~30s idle, so a disconnect
			// is routine: resume from the cursor over the fresh port.
			this.#request({ resume: true });
		});
	}

	#onPortMessage(message: unknown): void {
		if (!isPanelInMessage(message)) return;
		switch (message.type) {
			case MESSAGE_TYPE.RESET:
				return this.#onReset(message);
			case MESSAGE_TYPE.SYNC:
				return this.#onExtend(message, message.events);
			case MESSAGE_TYPE.EVENT:
				return this.#onExtend(message, [message.event]);
			case MESSAGE_TYPE.CLOSE:
				return this.#platform.closePanel();
		}
	}

	#onReset(message: Extract<PanelInMessage, { type: typeof MESSAGE_TYPE.RESET }>): void {
		if (message.tabId !== this.#currentTabId) return;

		this.#cursor = { generation: message.generation, seq: seqAfter(message.events, 0) };
		this.#handlers.onReset(message.events);
	}

	// Applies events that are meant to follow what the panel already shows. If
	// they don't line up with the cursor — a generation the panel never saw, or
	// a seq gap — the panel is out of step and asks for a full replacement
	// rather than rendering a log with a hole in it.
	#onExtend(message: { tabId: number; generation: number }, events: BufferedEvent[]): void {
		if (message.tabId !== this.#currentTabId) return;

		const cursor = this.#cursor;
		const contiguous =
			cursor?.generation === message.generation &&
			(events.length === 0 || events[0]!.seq === cursor.seq + 1);
		if (!contiguous) {
			this.#request({ resume: false });
			return;
		}
		if (events.length === 0) return;

		this.#cursor = { generation: message.generation, seq: seqAfter(events, cursor.seq) };
		this.#handlers.onAppend(events);
	}

	// Switches to whatever tab is active in this panel's own window, if it changed.
	async #syncActiveTab(): Promise<void> {
		const tabId = await this.#platform.getActiveTabId();
		if (tabId === this.#currentTabId) return;

		this.#currentTabId = tabId;
		this.#cursor = null;
		this.#handlers.onTabSwitched(tabId);
		this.#request({ resume: false });
	}
}

function seqAfter(events: readonly BufferedEvent[], fallback: number): number {
	return events.at(-1)?.seq ?? fallback;
}
