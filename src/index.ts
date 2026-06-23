import { DataLayer } from "./DataLayer.ts";
import { drag } from "./drag.ts";
import { Entry } from "./Entry.ts";
import { Filter } from "./Filter.ts";
import iconUrl from "../public/icons/16.png?inline";
import { Panel } from "./Panel.ts";
import { resize } from "./resize.ts";
import { Signal } from "./Signal.ts";
import { Storage } from "./Storage.ts";

const storage = new Storage();
if (!storage.active() || document.querySelector(".layr")) throw new Error();

const entries = new Signal<Entry[]>([]);

const onClose = () => {
	panel.el.remove();
	storage.clearActive();
	storage.clearFilterQuery();
};

const onClear = () => {
	entries.value = [];
	panel.log.innerHTML = "";
	filter.reset();
};

const panel = new Panel({ iconUrl, storage, onClear, onClose });
const filter = new Filter({ input: panel.filterInput, count: panel.countEl, storage, entries });

drag({ handle: panel.toolbar, target: panel.el, storage });
resize({ handle: panel.resizeHandle, target: panel.el, storage });

const dataLayer = new DataLayer();
dataLayer.subscribe((raw) => {
	const entry = new Entry({ order: entries.value.length + 1, raw });
	entries.value = [...entries.value, entry];
	panel.log.append(entry.el);
	const { scrollTop, scrollHeight, clientHeight } = panel.log;
	if (scrollHeight - scrollTop - clientHeight < 50) {
		panel.log.scrollTop = scrollHeight;
	}
});

const ext = (
	globalThis as unknown as {
		chrome?: {
			runtime?: { onMessage?: { addListener: (fn: (msg: unknown) => void) => void } };
		};
	}
).chrome;
ext?.runtime?.onMessage?.addListener((msg) => {
	if ((msg as { type?: string }).type === "layr:close") onClose();
});
