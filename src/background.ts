import { EventBuffer } from "./core/EventBuffer.ts";
import type { BufferSnapshot } from "./core/EventBuffer.ts";
import {
	MESSAGE_TYPE,
	PANEL_PORT_NAME,
	isContentMessage,
	isPanelOutMessage,
} from "./protocol/messages.ts";
import type { PanelInMessage } from "./protocol/messages.ts";

const buffer = new EventBuffer();
/** Panels never learn which window/tab they belong to here — each panel tracks
 * its own active tab and asks for exactly the buffer it wants, so a tab opening
 * or activating anywhere can never reset a panel that isn't looking at it. */
const panels = new Set<chrome.runtime.Port>();

/** The service worker is unloaded after ~30s idle, so the buffer is persisted
 * to session storage and rehydrated here to survive restarts. Chrome does not
 * support top-level await in service workers, so this stays an async IIFE. */
// oxlint-disable-next-line unicorn/prefer-top-level-await
const ready = (async () => {
	const data = await chrome.storage.session.get("buffers");
	buffer.restore((data.buffers ?? {}) as BufferSnapshot);
})();

function persistBuffers(): void {
	void chrome.storage.session.set({ buffers: buffer.toJSON() });
}

function sendToPanel(port: chrome.runtime.Port, msg: PanelInMessage): void {
	try {
		port.postMessage(msg);
	} catch {
		panels.delete(port);
	}
}

function pushReset(port: chrome.runtime.Port, tabId: number): void {
	sendToPanel(port, { type: MESSAGE_TYPE.RESET, tabId, events: buffer.get(tabId) });
}

// Broadcasts the (now empty) buffer to every panel. Each panel only applies a
// RESET for the tab it's currently showing, so this is a no-op for panels on
// other tabs/windows.
function clearBuffer(tabId: number): void {
	buffer.clear(tabId);
	persistBuffers();
	for (const port of panels) pushReset(port, tabId);
}

chrome.runtime.onMessage.addListener((msg: unknown, sender) => {
	const tabId = sender.tab?.id;
	if (tabId === undefined || !isContentMessage(msg)) return;

	// Sent by the MAIN-world content script at document_start, which only runs on a
	// full (re)load, so a stale buffer never survives F5.
	if (msg.type === MESSAGE_TYPE.NAVIGATE) {
		void ready.then(() => clearBuffer(tabId));
		return;
	}

	// A payload the page failed to serialize arrives as null; normalized to {}
	// so the buffered copy and the live broadcast stay identical.
	const payload = msg.payload ?? {};
	void (async () => {
		await ready;
		buffer.append({ tabId, payload });
		persistBuffers();

		for (const port of panels) {
			sendToPanel(port, { type: MESSAGE_TYPE.EVENT, tabId, payload });
		}
	})();
});

chrome.runtime.onConnect.addListener((port) => {
	if (port.name !== PANEL_PORT_NAME) return;
	panels.add(port);
	port.onDisconnect.addListener(() => panels.delete(port));
	port.onMessage.addListener((msg: unknown) => {
		if (!isPanelOutMessage(msg)) return;
		if (msg.type === MESSAGE_TYPE.REQUEST) {
			void ready.then(() => pushReset(port, msg.tabId));
		}
		if (msg.type === MESSAGE_TYPE.CLEAR) {
			void ready.then(() => clearBuffer(msg.tabId));
		}
	});
});

chrome.action.onClicked.addListener((tab) => {
	if (tab.id === undefined) return;
	if (panels.size > 0) {
		for (const port of panels) sendToPanel(port, { type: MESSAGE_TYPE.CLOSE });
		return;
	}
	void chrome.sidePanel.open({ tabId: tab.id });
});

chrome.tabs.onRemoved.addListener((tabId) => {
	void (async () => {
		await ready;
		buffer.delete(tabId);
		persistBuffers();
	})();
});
