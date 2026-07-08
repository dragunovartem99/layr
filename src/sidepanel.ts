import { LogEvent } from "./core/LogEvent.ts";
import { Signal } from "./core/Signal.ts";
import { MESSAGE_TYPE, PANEL_PORT_NAME, isPanelInMessage } from "./protocol/messages.ts";
import type { PanelInMessage, PanelOutMessage } from "./protocol/messages.ts";
import { Entry } from "./ui/Entry.ts";
import { Filter } from "./ui/Filter.ts";
import { Panel } from "./ui/Panel.ts";

type ResetMessage = Extract<PanelInMessage, { type: typeof MESSAGE_TYPE.RESET }>;
type EventMessage = Extract<PanelInMessage, { type: typeof MESSAGE_TYPE.EVENT }>;

const entries = new Signal<Entry[]>([]);
// The tab this panel is currently displaying. Owned entirely client-side: this
// panel's window is queried directly via chrome.tabs, so tab activity in other
// windows can never affect it, and any message whose tabId doesn't match is ignored.
let currentTabId: number | null = null;
let currentPort: chrome.runtime.Port | null = null;

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

function send(message: PanelOutMessage): void {
	// oxlint-disable-next-line unicorn/require-post-message-target-origin -- chrome.runtime.Port, not window
	currentPort?.postMessage(message);
}

function clearLog(): void {
	entries.value = [];
	panel.log.innerHTML = "";
}

function clearAll(): void {
	clearLog();
	filter.reset();
	if (currentTabId !== null) send({ type: MESSAGE_TYPE.CLEAR, tabId: currentTabId });
}

function appendEntry(raw: object): void {
	const entry = new Entry(new LogEvent({ order: entries.value.length + 1, raw }));
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
	for (const payload of message.events) appendEntry(payload);
}

function handleEvent(message: EventMessage): void {
	if (message.tabId === currentTabId && message.payload) appendEntry(message.payload);
}

function onPortMessage(message: unknown): void {
	if (!isPanelInMessage(message)) return;
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
		if (currentTabId !== null) send({ type: MESSAGE_TYPE.REQUEST, tabId: currentTabId });
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
	send({ type: MESSAGE_TYPE.REQUEST, tabId });
}
