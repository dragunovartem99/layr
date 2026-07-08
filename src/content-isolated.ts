import { MESSAGE_TYPE, isPageMessage } from "./protocol/messages.ts";
import type { ContentMessage } from "./protocol/messages.ts";

function send(message: ContentMessage): void {
	chrome.runtime.sendMessage(message).catch(() => {});
}

// Runs at document_start on every full (re)load, letting the background worker
// drop the previous document's buffered events before new ones arrive.
send({ type: MESSAGE_TYPE.NAVIGATE });

window.addEventListener("message", (e) => {
	if (e.source !== window || !isPageMessage(e.data)) return;
	send({ type: MESSAGE_TYPE.EVENT, payload: e.data.payload });
});
