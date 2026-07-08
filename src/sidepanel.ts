import { PanelApp } from "./app/PanelApp.ts";
import { FilterState } from "./core/FilterState.ts";
import { Log } from "./core/Log.ts";
import { ChromePanelPlatform } from "./platform/chrome/ChromePanelPlatform.ts";
import { PANEL_PORT_NAME } from "./protocol/messages.ts";
import { PanelView } from "./ui/PanelView.ts";

const platform = await ChromePanelPlatform.create({ panelPortName: PANEL_PORT_NAME });

const log = new Log();
const filter = new FilterState(platform.filterStore);

const app = new PanelApp({
	platform,
	onReset: (events) => log.reset(events),
	onEvent: (raw) => log.append(raw),
	onTabSwitched: (tabId) => {
		log.clear();
		if (tabId !== null) filter.loadForTab(tabId);
	},
});

const panel = new PanelView({
	log,
	filter,
	onClear: () => {
		log.clear();
		filter.reset();
		app.clearCurrentTab();
	},
});
panel.mount(document.body);

await app.start();
