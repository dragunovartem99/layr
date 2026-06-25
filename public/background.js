/** @type {Map<number, object[]>} */
const buffers = new Map();
const MAX_BUFFER = 500;
/** @type {Set<chrome.runtime.Port>} */
const panels = new Set();

function sendToPanel(port, msg) {
	try {
		port.postMessage(msg);
	} catch {
		panels.delete(port);
	}
}

function pushReset(port, tabId) {
	const events = buffers.get(tabId) ?? [];
	sendToPanel(port, { type: "layr:reset", tabId, events });
}

chrome.runtime.onMessage.addListener((msg, sender) => {
	if (msg.type !== "layr:event") return;
	const tabId = sender.tab?.id;
	if (tabId === undefined) return;

	const buf = buffers.get(tabId) ?? [];
	buf.push(msg.payload);
	if (buf.length > MAX_BUFFER) buf.shift();
	buffers.set(tabId, buf);

	for (const port of panels) {
		sendToPanel(port, { type: "layr:event", tabId, payload: msg.payload });
	}
});

chrome.runtime.onConnect.addListener((port) => {
	if (port.name !== "layr:panel") return;
	panels.add(port);
	port.onDisconnect.addListener(() => panels.delete(port));

	void (async () => {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tab?.id !== undefined) pushReset(port, tab.id);
	})();
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
	for (const port of panels) pushReset(port, tabId);
});

chrome.action.onClicked.addListener((tab) => {
	if (!tab.url?.startsWith("http") || tab.id === undefined) return;
	chrome.sidePanel.open({ tabId: tab.id });
});

chrome.tabs.onRemoved.addListener((tabId) => buffers.delete(tabId));
