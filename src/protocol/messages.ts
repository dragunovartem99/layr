import type { BufferedEvent, Cursor } from "../core/EventBuffer.ts";

/** Identifies window.postMessage traffic from the MAIN-world script. */
export const PAGE_SOURCE = "layr";

export const PANEL_PORT_NAME = "layr:panel";

export const MESSAGE_TYPE = {
	RESET: "layr:reset",
	SYNC: "layr:sync",
	EVENT: "layr:event",
	CLOSE: "layr:close",
	CLEAR: "layr:clear",
	NAVIGATE: "layr:navigate",
	REQUEST: "layr:request",
} as const;

/** Page (MAIN world) → isolated content script, via window.postMessage. */
export type PageMessage = {
	source: typeof PAGE_SOURCE;
	payload: object | null;
};

/** Content script → background, via chrome.runtime.sendMessage. */
export type ContentMessage =
	| { type: typeof MESSAGE_TYPE.EVENT; payload: object | null }
	| { type: typeof MESSAGE_TYPE.NAVIGATE };

/** Background → panel, over the panel port. RESET replaces the panel's copy of
 * a tab; SYNC and EVENT extend it, and only apply to a panel whose cursor sits
 * exactly in front of them. */
export type PanelInMessage =
	| {
			type: typeof MESSAGE_TYPE.RESET;
			tabId: number;
			generation: number;
			events: BufferedEvent[];
	  }
	| { type: typeof MESSAGE_TYPE.SYNC; tabId: number; generation: number; events: BufferedEvent[] }
	| { type: typeof MESSAGE_TYPE.EVENT; tabId: number; generation: number; event: BufferedEvent }
	| { type: typeof MESSAGE_TYPE.CLOSE };

/** Panel → background, over the panel port. A REQUEST carrying a cursor asks
 * for just the events after it; without one it asks for the whole buffer. */
export type PanelOutMessage =
	| { type: typeof MESSAGE_TYPE.REQUEST; tabId: number; cursor?: Cursor }
	| { type: typeof MESSAGE_TYPE.CLEAR; tabId: number };

function typeOf(message: unknown): string | null {
	if (typeof message !== "object" || message === null || !("type" in message)) return null;
	return typeof message.type === "string" ? message.type : null;
}

function tabIdOf(message: object): unknown {
	return "tabId" in message ? message.tabId : undefined;
}

function hasMalformedCursor(message: object): boolean {
	if (!("cursor" in message) || message.cursor === undefined) return false;
	return !isCursor(message.cursor);
}

function isCursor(value: unknown): value is Cursor {
	if (typeof value !== "object" || value === null) return false;
	if (!("generation" in value) || !("seq" in value)) return false;
	return typeof value.generation === "number" && typeof value.seq === "number";
}

export function isPageMessage(message: unknown): message is PageMessage {
	if (typeof message !== "object" || message === null) return false;
	return "source" in message && message.source === PAGE_SOURCE;
}

export function isContentMessage(message: unknown): message is ContentMessage {
	const type = typeOf(message);
	return type === MESSAGE_TYPE.EVENT || type === MESSAGE_TYPE.NAVIGATE;
}

export function isPanelInMessage(message: unknown): message is PanelInMessage {
	const type = typeOf(message);
	if (type === MESSAGE_TYPE.CLOSE) return true;
	if (type !== MESSAGE_TYPE.RESET && type !== MESSAGE_TYPE.SYNC && type !== MESSAGE_TYPE.EVENT) {
		return false;
	}
	const candidate = message as object;
	if (typeof tabIdOf(candidate) !== "number") return false;
	return "generation" in candidate && typeof candidate.generation === "number";
}

export function isPanelOutMessage(message: unknown): message is PanelOutMessage {
	const type = typeOf(message);
	if (type !== MESSAGE_TYPE.REQUEST && type !== MESSAGE_TYPE.CLEAR) return false;
	const candidate = message as object;
	if (typeof tabIdOf(candidate) !== "number") return false;
	// A cursor is optional, but a malformed one must not be read as "from scratch".
	return !hasMalformedCursor(candidate);
}
