const MESSAGE_TYPE = {
	EVENT: "layr:event",
};

window.addEventListener("message", (e) => {
	if (e.source !== window || e.data?.source !== "layr") return;
	chrome.runtime.sendMessage({ type: MESSAGE_TYPE.EVENT, payload: e.data.payload }).catch(() => {});
});
