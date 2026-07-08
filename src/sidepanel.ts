import { PanelApp } from "./app/PanelApp.ts";
import { LogEvent } from "./core/LogEvent.ts";
import { Signal } from "./core/Signal.ts";
import { ChromePanelPlatform } from "./platform/chrome/ChromePanelPlatform.ts";
import { PANEL_PORT_NAME } from "./protocol/messages.ts";
import { Entry } from "./ui/Entry.ts";
import { Filter } from "./ui/Filter.ts";
import { Panel } from "./ui/Panel.ts";

const entries = new Signal<Entry[]>([]);

const panel = new Panel({ onClear: clearAll });
document.body.append(panel.el);

const platform = await ChromePanelPlatform.create({ panelPortName: PANEL_PORT_NAME });

const filter = new Filter({
	input: panel.filterInput,
	count: panel.countEl,
	entries,
	store: platform.filterStore,
});

const app = new PanelApp({
	platform,
	onReset: (events) => {
		clearLog();
		for (const raw of events) appendEntry(raw);
	},
	onEvent: appendEntry,
	onTabSwitched: (tabId) => {
		clearLog();
		if (tabId !== null) filter.loadForTab(tabId);
	},
});
await app.start();

function clearLog(): void {
	entries.value = [];
	panel.log.innerHTML = "";
}

function clearAll(): void {
	clearLog();
	filter.reset();
	app.clearCurrentTab();
}

function appendEntry(raw: object): void {
	const entry = new Entry(new LogEvent({ order: entries.value.length + 1, raw }));
	entries.value = [...entries.value, entry];
	panel.log.append(entry.el);

	const { scrollTop, scrollHeight, clientHeight } = panel.log;
	const isScrolledToBottom = scrollHeight - scrollTop - clientHeight < 50;
	if (isScrolledToBottom) panel.log.scrollTop = scrollHeight;
}
