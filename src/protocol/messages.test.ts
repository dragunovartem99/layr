import { describe, expect, it } from "vitest";

import {
	MESSAGE_TYPE,
	isContentMessage,
	isPageMessage,
	isPanelInMessage,
	isPanelOutMessage,
} from "./messages.ts";

describe("isPageMessage", () => {
	it("accepts a message posted by the MAIN-world script", () => {
		const message = { source: "layr", payload: { event: "add_to_cart" } };

		expect(isPageMessage(message)).toBe(true);
	});

	it("rejects postMessage traffic from other extensions or the page", () => {
		const message = { source: "react-devtools", payload: {} };

		expect(isPageMessage(message)).toBe(false);
	});

	it.each([null, undefined, "layr", 42])("rejects non-object data: %s", (data) => {
		expect(isPageMessage(data)).toBe(false);
	});
});

describe("isContentMessage", () => {
	it("accepts an event message", () => {
		const message = { type: MESSAGE_TYPE.EVENT, payload: { event: "purchase" } };

		expect(isContentMessage(message)).toBe(true);
	});

	it("accepts a navigate message", () => {
		const message = { type: MESSAGE_TYPE.NAVIGATE };

		expect(isContentMessage(message)).toBe(true);
	});

	it("rejects panel-only message types", () => {
		const message = { type: MESSAGE_TYPE.REQUEST, tabId: 7 };

		expect(isContentMessage(message)).toBe(false);
	});
});

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

describe("isPanelOutMessage", () => {
	it("accepts a buffer request for a tab", () => {
		const message = { type: MESSAGE_TYPE.REQUEST, tabId: 41 };

		expect(isPanelOutMessage(message)).toBe(true);
	});

	it("accepts a request resuming from a cursor", () => {
		const message = {
			type: MESSAGE_TYPE.REQUEST,
			tabId: 41,
			cursor: { generation: 1, seq: 9 },
		};

		expect(isPanelOutMessage(message)).toBe(true);
	});

	it("rejects a request whose cursor is malformed", () => {
		const message = { type: MESSAGE_TYPE.REQUEST, tabId: 41, cursor: { seq: "9" } };

		expect(isPanelOutMessage(message)).toBe(false);
	});

	it("accepts a clear command for a tab", () => {
		const message = { type: MESSAGE_TYPE.CLEAR, tabId: 8 };

		expect(isPanelOutMessage(message)).toBe(true);
	});

	it("rejects a request without a tabId", () => {
		const message = { type: MESSAGE_TYPE.REQUEST };

		expect(isPanelOutMessage(message)).toBe(false);
	});

	it("rejects background-to-panel message types", () => {
		const message = { type: MESSAGE_TYPE.RESET, tabId: 41, events: [] };

		expect(isPanelOutMessage(message)).toBe(false);
	});
});
