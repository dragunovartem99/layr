/** Identifies window.postMessage traffic from the MAIN-world script. */
export const PAGE_SOURCE = "layr";

export const PANEL_PORT_NAME = "layr:panel";

export const MESSAGE_TYPE = {
	RESET: "layr:reset",
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

/** Background → panel, over the panel port. */
export type PanelInMessage =
	| { type: typeof MESSAGE_TYPE.RESET; tabId: number; events: object[] }
	| { type: typeof MESSAGE_TYPE.EVENT; tabId: number; payload: object | null }
	| { type: typeof MESSAGE_TYPE.CLOSE };

/** Panel → background, over the panel port. */
export type PanelOutMessage =
	| { type: typeof MESSAGE_TYPE.REQUEST; tabId: number }
	| { type: typeof MESSAGE_TYPE.CLEAR; tabId: number };

function typeOf(message: unknown): string | null {
	if (typeof message !== "object" || message === null || !("type" in message)) return null;
	return typeof message.type === "string" ? message.type : null;
}

function tabIdOf(message: object): unknown {
	return "tabId" in message ? message.tabId : undefined;
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
	if (type !== MESSAGE_TYPE.RESET && type !== MESSAGE_TYPE.EVENT) return false;
	return typeof tabIdOf(message as object) === "number";
}

export function isPanelOutMessage(message: unknown): message is PanelOutMessage {
	const type = typeOf(message);
	if (type !== MESSAGE_TYPE.REQUEST && type !== MESSAGE_TYPE.CLEAR) return false;
	return typeof tabIdOf(message as object) === "number";
}
