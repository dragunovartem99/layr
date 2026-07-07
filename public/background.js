const MESSAGE_TYPE = {
	RESET: "layr:reset",
	EVENT: "layr:event",
	CLOSE: "layr:close",
	CLEAR: "layr:clear",
	NAVIGATE: "layr:navigate",
};
const PANEL_PORT_NAME = "layr:panel";

/** @type {Map<number, object[]>} */
const buffers = new Map();
const MAX_BUFFER = 500;
/** @type {Set<chrome.runtime.Port>} */
const panels = new Set();

/** The service worker is unloaded after ~30s idle, so `buffers` is persisted to
 * session storage and rehydrated here to survive restarts. Chrome does not
 * support top-level await in service workers, so this stays an async IIFE. */
// oxlint-disable-next-line unicorn/prefer-top-level-await
const ready = (async () => {
	const data = await chrome.storage.session.get("buffers");
	for (const [tabId, events] of Object.entries(data.buffers ?? {})) {
		buffers.set(Number(tabId), events);
	}
})();

function persistBuffers() {
	void chrome.storage.session.set({ buffers: Object.fromEntries(buffers) });
}

function sendToPanel(port, msg) {
	try {
		port.postMessage(msg);
	} catch {
		panels.delete(port);
	}
}

function pushReset(port, tabId) {
	const events = buffers.get(tabId) ?? [];
	sendToPanel(port, { type: MESSAGE_TYPE.RESET, tabId, events });
}

function clearBuffer(tabId) {
	buffers.set(tabId, []);
	persistBuffers();
	for (const port of panels) pushReset(port, tabId);
}

chrome.runtime.onMessage.addListener((msg, sender) => {
	const tabId = sender.tab?.id;
	if (tabId === undefined) return;

	// Sent by the MAIN-world content script at document_start, which only runs on a
	// full (re)load, so a stale buffer never survives F5.
	if (msg.type === MESSAGE_TYPE.NAVIGATE) {
		void ready.then(() => clearBuffer(tabId));
		return;
	}
	if (msg.type !== MESSAGE_TYPE.EVENT) return;

	void (async () => {
		await ready;
		const buf = buffers.get(tabId) ?? [];
		buf.push(msg.payload);
		if (buf.length > MAX_BUFFER) buf.shift();
		buffers.set(tabId, buf);
		persistBuffers();

		for (const port of panels) {
			sendToPanel(port, { type: MESSAGE_TYPE.EVENT, tabId, payload: msg.payload });
		}
	})();
});

chrome.runtime.onConnect.addListener((port) => {
	if (port.name !== PANEL_PORT_NAME) return;
	panels.add(port);
	port.onDisconnect.addListener(() => panels.delete(port));
	port.onMessage.addListener((msg) => {
		if (msg?.type === MESSAGE_TYPE.CLEAR && typeof msg.tabId === "number") {
			void ready.then(() => clearBuffer(msg.tabId));
		}
	});

	void (async () => {
		await ready;
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tab?.id !== undefined) pushReset(port, tab.id);
	})();
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
	void (async () => {
		await ready;
		for (const port of panels) pushReset(port, tabId);
	})();
});

chrome.action.onClicked.addListener((tab) => {
	if (tab.id === undefined) return;
	if (panels.size > 0) {
		for (const port of panels) sendToPanel(port, { type: MESSAGE_TYPE.CLOSE });
		return;
	}
	chrome.sidePanel.open({ tabId: tab.id });
});

chrome.tabs.onRemoved.addListener((tabId) => {
	void (async () => {
		await ready;
		buffers.delete(tabId);
		persistBuffers();
	})();
});
