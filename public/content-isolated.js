const MESSAGE_TYPE = {
	EVENT: "layr:event",
	NAVIGATE: "layr:navigate",
};

// Runs at document_start on every full (re)load, letting the background worker
// drop the previous document's buffered events before new ones arrive.
// oxlint-disable-next-line unicorn/prefer-top-level-await
chrome.runtime.sendMessage({ type: MESSAGE_TYPE.NAVIGATE }).catch(() => {});

window.addEventListener("message", (e) => {
	if (e.source !== window || e.data?.source !== "layr") return;
	chrome.runtime.sendMessage({ type: MESSAGE_TYPE.EVENT, payload: e.data.payload }).catch(() => {});
});
