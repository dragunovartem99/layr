import type { PortLike } from "../types.ts";

export function wrapPort(port: chrome.runtime.Port): PortLike {
	return {
		postMessage: (message) => port.postMessage(message),
		onMessage: (fn) => port.onMessage.addListener(fn),
		onDisconnect: (fn) => port.onDisconnect.addListener(fn),
	};
}
