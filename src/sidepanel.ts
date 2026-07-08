import { MESSAGE_TYPE, PANEL_PORT_NAME } from "./lib/messages.ts";
import { Signal } from "./lib/Signal.ts";
import { Entry } from "./ui/Entry.ts";
import { Filter } from "./ui/Filter.ts";
import { Panel } from "./ui/Panel.ts";

type ChromePort = {
	postMessage(message: unknown): void;
	onMessage: { addListener(listener: (message: unknown) => void): void };
	onDisconnect: { addListener(listener: () => void): void };
};

declare const chrome: {
	runtime: {
		connect(info: { name: string }): ChromePort;
	};
	windows: {
		getCurrent(): Promise<{ id?: number }>;
	};
	tabs: {
		query(query: { active: boolean; windowId: number }): Promise<{ id?: number }[]>;
		onActivated: {
			addListener(listener: (info: { tabId: number; windowId: number }) => void): void;
		};
	};
};

type ResetMessage = { type: typeof MESSAGE_TYPE.RESET; tabId?: number; events?: object[] };
type EventMessage = { type: typeof MESSAGE_TYPE.EVENT; tabId?: number; payload?: object };
type CloseMessage = { type: typeof MESSAGE_TYPE.CLOSE };
type PortMessage = ResetMessage | EventMessage | CloseMessage;

function isPortMessage(message: unknown): message is PortMessage {
	if (typeof message !== "object" || message === null || !("type" in message)) return false;
	return (
		message.type === MESSAGE_TYPE.RESET ||
		message.type === MESSAGE_TYPE.EVENT ||
		message.type === MESSAGE_TYPE.CLOSE
	);
}

const entries = new Signal<Entry[]>([]);
// The tab this panel is currently displaying. Owned entirely client-side: this
// panel's window is queried directly via chrome.tabs, so tab activity in other
// windows can never affect it, and any message whose tabId doesn't match is ignored.
let currentTabId: number | null = null;
let currentPort: ChromePort | null = null;

const panel = new Panel({ onClear: clearAll });
document.body.append(panel.el);

const filter = new Filter({ input: panel.filterInput, count: panel.countEl, entries });

const { id: windowId } = await chrome.windows.getCurrent();
if (windowId !== undefined) {
	chrome.tabs.onActivated.addListener((info) => {
		if (info.windowId === windowId) void syncActiveTab();
	});
}
connect();
await syncActiveTab();

function clearLog(): void {
	entries.value = [];
	panel.log.innerHTML = "";
}

function clearAll(): void {
	clearLog();
	filter.reset();
	// oxlint-disable-next-line unicorn/require-post-message-target-origin -- chrome.runtime.Port, not window
	if (currentTabId !== null)
		currentPort?.postMessage({ type: MESSAGE_TYPE.CLEAR, tabId: currentTabId });
}

function appendEntry(raw: object): void {
	const entry = new Entry({ order: entries.value.length + 1, raw });
	entries.value = [...entries.value, entry];
	panel.log.append(entry.el);

	const { scrollTop, scrollHeight, clientHeight } = panel.log;
	const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
	if (isScrolledToBottom) panel.log.scrollTop = scrollHeight;
}

// Applies a buffer sent for the tab this panel already switched to. A RESET for
// any other tabId is a stale reply (e.g. from a tab this panel isn't showing
// anymore) and is dropped.
function handleReset(message: ResetMessage): void {
	if (message.tabId !== currentTabId) return;
	clearLog();
	for (const payload of message.events ?? []) appendEntry(payload);
}

function handleEvent(message: EventMessage): void {
	if (message.tabId === currentTabId && message.payload) appendEntry(message.payload);
}

function onPortMessage(message: unknown): void {
	if (!isPortMessage(message)) return;
	switch (message.type) {
		case MESSAGE_TYPE.RESET:
			return handleReset(message);
		case MESSAGE_TYPE.EVENT:
			return handleEvent(message);
		case MESSAGE_TYPE.CLOSE:
			return window.close();
	}
}

function connect(): void {
	const port = chrome.runtime.connect({ name: PANEL_PORT_NAME });
	currentPort = port;
	port.onMessage.addListener(onPortMessage);
	port.onDisconnect.addListener(() => {
		if (currentPort === port) currentPort = null;
		connect();
		// The background worker may have restarted, so re-request the current
		// tab's buffer over the fresh port.
		// oxlint-disable-next-line unicorn/require-post-message-target-origin -- chrome.runtime.Port, not window
		if (currentTabId !== null)
			currentPort?.postMessage({ type: MESSAGE_TYPE.REQUEST, tabId: currentTabId });
	});
}

// Switches to whatever tab is active in this panel's own window, if it changed.
async function syncActiveTab(): Promise<void> {
	if (windowId === undefined) return;
	const [tab] = await chrome.tabs.query({ active: true, windowId });
	const tabId = tab?.id ?? null;
	if (tabId === currentTabId) return;

	currentTabId = tabId;
	clearLog();
	if (tabId === null) return;
	filter.loadForTab(tabId);
	// oxlint-disable-next-line unicorn/require-post-message-target-origin -- chrome.runtime.Port, not window
	currentPort?.postMessage({ type: MESSAGE_TYPE.REQUEST, tabId });
}
