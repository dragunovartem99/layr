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
let currentTabId: number | null = null;

const panel = new Panel({ onClear: clearAll });
document.body.append(panel.el);

const filter = new Filter({ input: panel.filterInput, count: panel.countEl, entries });

connect();

function clearLog(): void {
	entries.value = [];
	panel.log.innerHTML = "";
}

function clearAll(): void {
	clearLog();
	filter.reset();
}

function appendEntry(raw: object): void {
	const entry = new Entry({ order: entries.value.length + 1, raw });
	entries.value = [...entries.value, entry];
	panel.log.append(entry.el);

	const { scrollTop, scrollHeight, clientHeight } = panel.log;
	const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
	if (isScrolledToBottom) panel.log.scrollTop = scrollHeight;
}

function handleReset(message: ResetMessage): void {
	currentTabId = message.tabId ?? null;
	clearLog();
	if (currentTabId !== null) filter.loadForTab(currentTabId);
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
	port.onMessage.addListener(onPortMessage);
	port.onDisconnect.addListener(connect);
}
