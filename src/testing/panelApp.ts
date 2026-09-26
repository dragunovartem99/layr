/* oxlint-disable unicorn/require-post-message-target-origin -- PortLike, not window */

import { PanelApp } from "../app/PanelApp.ts";
import type { BufferedEvent } from "../core/EventBuffer.ts";
import { MockPanelPlatform } from "../platform/mock/MockPanelPlatform.ts";
import type { MockPort } from "../platform/mock/MockPort.ts";
import { MESSAGE_TYPE } from "../protocol/messages.ts";
import { buffered } from "../testing/events.ts";

export type Setup = {
	platform: MockPanelPlatform;
	app: PanelApp;
	resets: BufferedEvent[][];
	appends: BufferedEvent[][];
	tabs: (number | null)[];
	backgroundEnds: MockPort[];
	sentTo: (end: MockPort) => unknown[];
};

export async function startApp(activeTabId: number | null): Promise<Setup> {
	const platform = new MockPanelPlatform();
	platform.activeTabId = activeTabId;

	const backgroundEnds: MockPort[] = [];
	const sent = new Map<MockPort, unknown[]>();
	platform.onConnect = (end) => {
		backgroundEnds.push(end);
		const messages: unknown[] = [];
		end.onMessage((m) => messages.push(m));
		sent.set(end, messages);
	};

	const resets: BufferedEvent[][] = [];
	const appends: BufferedEvent[][] = [];
	const tabs: (number | null)[] = [];
	const app = new PanelApp({
		platform,
		onReset: (e) => resets.push(e),
		onAppend: (e) => appends.push(e),
		onTabSwitched: (t) => tabs.push(t),
	});
	await app.start();

	return {
		platform,
		app,
		resets,
		appends,
		tabs,
		backgroundEnds,
		sentTo: (end) => sent.get(end) ?? [],
	};
}

// Puts the panel in the state it's in after a normal startup replay.
export function replay(end: MockPort, tabId: number, payloads: object[]): BufferedEvent[] {
	const events = buffered(payloads);
	end.postMessage({ type: MESSAGE_TYPE.RESET, tabId, generation: 0, events });
	return events;
}
