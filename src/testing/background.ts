/* oxlint-disable unicorn/require-post-message-target-origin -- PortLike, not window */

import { expect } from "vitest";

import { BackgroundApp } from "../app/BackgroundApp.ts";
import type { Cursor } from "../core/EventBuffer.ts";
import type { MockBackgroundPlatform } from "../platform/mock/MockBackgroundPlatform.ts";
import { MockPort } from "../platform/mock/MockPort.ts";
import { MESSAGE_TYPE } from "../protocol/messages.ts";

export function startApp(platform: MockBackgroundPlatform): BackgroundApp {
	const app = new BackgroundApp(platform);
	app.start();
	return app;
}

export function connectPanel(platform: MockBackgroundPlatform): {
	panel: MockPort;
	received: unknown[];
} {
	const [panel, backgroundEnd] = MockPort.pair();
	const received: unknown[] = [];
	panel.onMessage((m) => received.push(m));
	platform.emitPanelConnect(backgroundEnd);
	return { panel, received };
}

export function pushEvent(
	platform: MockBackgroundPlatform,
	tabId: number,
	payload: object | null
): void {
	platform.emitContentMessage({ type: MESSAGE_TYPE.EVENT, payload }, tabId);
}

export function request(panel: MockPort, tabId: number, cursor?: Cursor): void {
	panel.postMessage(
		cursor
			? { type: MESSAGE_TYPE.REQUEST, tabId, cursor }
			: { type: MESSAGE_TYPE.REQUEST, tabId }
	);
}

// A buffered event as it goes over the wire; capture time isn't asserted.
export const ev = (seq: number, payload: object): object => ({
	seq,
	at: expect.any(Number),
	payload,
});
