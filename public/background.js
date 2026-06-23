chrome.action.onClicked.addListener((tab) => {
	if (!tab.url || !tab.url.startsWith("http")) return;

	chrome.scripting
		.executeScript({
			target: { tabId: tab.id },
			world: "MAIN",
			func: () => !!document.querySelector(".layr"),
		})
		.then(([{ result: isOpen }]) => {
			if (isOpen) {
				return chrome.scripting.executeScript({
					target: { tabId: tab.id },
					world: "MAIN",
					func: () => document.querySelector(".layr__btn--close")?.click(),
				});
			}
			return chrome.scripting
				.executeScript({
					target: { tabId: tab.id },
					world: "MAIN",
					func: () => sessionStorage.setItem("layr", "1"),
				})
				.then(() => {
					return chrome.scripting.executeScript({
						target: { tabId: tab.id },
						files: ["content.js"],
						world: "MAIN",
					});
				});
		});
});
