window.addEventListener("message", (e) => {
	if (e.source !== window || e.data?.source !== "layr") return;
	chrome.runtime.sendMessage({ type: "layr:event", payload: e.data.payload }).catch(() => {});
});
