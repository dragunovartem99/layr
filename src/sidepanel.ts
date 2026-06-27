import { Signal } from "./lib/Signal.ts";
import { Entry } from "./ui/Entry.ts";
import { Filter } from "./ui/Filter.ts";
import { Panel } from "./ui/Panel.ts";

type ChromePort = {
	postMessage(msg: unknown): void;
	onMessage: { addListener(fn: (msg: unknown) => void): void };
	onDisconnect: { addListener(fn: () => void): void };
};

declare const chrome: {
	runtime: {
		connect(info: { name: string }): ChromePort;
	};
};

const entries = new Signal<Entry[]>([]);
let currentTabId: number | null = null;

const onClear = () => {
	entries.value = [];
	panel.log.innerHTML = "";
	filter.reset();
};

const panel = new Panel({ onClear });
document.body.append(panel.el);

const filter = new Filter({ input: panel.filterInput, count: panel.countEl, entries });

const port = chrome.runtime.connect({ name: "layr:panel" });

port.onMessage.addListener((msg: unknown) => {
	const m = msg as {
		type: string;
		tabId?: number;
		payload?: object;
		events?: object[];
	};

	if (m.type === "layr:reset") {
		currentTabId = m.tabId ?? null;
		entries.value = [];
		panel.log.innerHTML = "";
		filter.reset();
		for (const payload of m.events ?? []) appendEntry(payload);
		return;
	}

	if (m.type === "layr:event" && m.tabId === currentTabId && m.payload) {
		appendEntry(m.payload);
	}
});

function appendEntry(raw: object): void {
	const entry = new Entry({ order: entries.value.length + 1, raw });
	entries.value = [...entries.value, entry];
	panel.log.append(entry.el);
	const { scrollTop, scrollHeight, clientHeight } = panel.log;
	if (scrollHeight - scrollTop - clientHeight < 50) {
		panel.log.scrollTop = scrollHeight;
	}
}
