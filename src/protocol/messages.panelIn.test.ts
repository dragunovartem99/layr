import { describe, expect, it } from "vitest";

import { MESSAGE_TYPE, isPanelInMessage } from "./messages.ts";

describe("isPanelInMessage", () => {
	it("accepts a reset carrying a buffer", () => {
		const message = {
			type: MESSAGE_TYPE.RESET,
			tabId: 12,
			generation: 0,
			events: [{ seq: 1, at: 0, payload: { event: "gtm.js" } }],
		};

		expect(isPanelInMessage(message)).toBe(true);
	});

	it("accepts a sync carrying missed events", () => {
		const message = {
			type: MESSAGE_TYPE.SYNC,
			tabId: 12,
			generation: 2,
			events: [{ seq: 8, at: 0, payload: { event: "scroll" } }],
		};

		expect(isPanelInMessage(message)).toBe(true);
	});

	it("accepts a live event for a tab", () => {
		const message = {
			type: MESSAGE_TYPE.EVENT,
			tabId: 3,
			generation: 0,
			event: { seq: 1, at: 0, payload: { event: "login" } },
		};

		expect(isPanelInMessage(message)).toBe(true);
	});

	it("accepts a close command without a tabId", () => {
		const message = { type: MESSAGE_TYPE.CLOSE };

		expect(isPanelInMessage(message)).toBe(true);
	});
});

describe("isPanelInMessage rejections", () => {
	it("rejects a reset whose tabId is missing", () => {
		const message = { type: MESSAGE_TYPE.RESET, generation: 0, events: [] };

		expect(isPanelInMessage(message)).toBe(false);
	});

	it("rejects a reset whose tabId is not a number", () => {
		const message = { type: MESSAGE_TYPE.RESET, tabId: "12", generation: 0, events: [] };

		expect(isPanelInMessage(message)).toBe(false);
	});

	it("rejects a reset without a generation", () => {
		const message = { type: MESSAGE_TYPE.RESET, tabId: 12, events: [] };

		expect(isPanelInMessage(message)).toBe(false);
	});
});
