import { describe, expect, it } from "vitest";

import { MockPort } from "./MockPort.ts";

describe("MockPort", () => {
	it("delivers messages to the other end of the pair", () => {
		const [panel, background] = MockPort.pair();
		const received: unknown[] = [];
		background.onMessage((m) => received.push(m));

		// oxlint-disable-next-line unicorn/require-post-message-target-origin -- PortLike, not window
		panel.postMessage({ type: "layr:request", tabId: 14 });

		expect(received).toEqual([{ type: "layr:request", tabId: 14 }]);
	});

	it("does not echo messages back to the sender", () => {
		const [panel] = MockPort.pair();
		const received: unknown[] = [];
		panel.onMessage((m) => received.push(m));

		// oxlint-disable-next-line unicorn/require-post-message-target-origin -- PortLike, not window
		panel.postMessage({ type: "layr:clear", tabId: 2 });

		expect(received).toEqual([]);
	});

	it("fires disconnect handlers on the opposite end only", () => {
		const [panel, background] = MockPort.pair();
		let panelSaw = 0;
		let backgroundSaw = 0;
		panel.onDisconnect(() => panelSaw++);
		background.onDisconnect(() => backgroundSaw++);

		panel.disconnect();

		expect(panelSaw).toBe(0);
		expect(backgroundSaw).toBe(1);
	});

	it("throws when posting on a disconnected port", () => {
		const [panel, background] = MockPort.pair();
		background.disconnect();

		// oxlint-disable-next-line unicorn/require-post-message-target-origin -- PortLike, not window
		expect(() => panel.postMessage({ type: "layr:close" })).toThrow("disconnected port");
	});
});
