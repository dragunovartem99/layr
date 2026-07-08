import type { PortLike } from "../types.ts";

/** In-memory port pair. What one end posts, the other end's handlers receive,
 * synchronously. Follows chrome.runtime.Port semantics: disconnecting fires
 * the handlers on the opposite end, and posting after disconnect throws. */
export class MockPort implements PortLike {
	#peer: MockPort | null = null;
	#messageHandlers: ((message: unknown) => void)[] = [];
	#disconnectHandlers: (() => void)[] = [];
	#connected = true;

	static pair(): [MockPort, MockPort] {
		const a = new MockPort();
		const b = new MockPort();
		a.#peer = b;
		b.#peer = a;
		return [a, b];
	}

	postMessage(message: unknown): void {
		if (!this.#connected) throw new Error("Attempting to use a disconnected port object");
		if (this.#peer === null) return;
		for (const fn of this.#peer.#messageHandlers) fn(message);
	}

	onMessage(fn: (message: unknown) => void): void {
		this.#messageHandlers.push(fn);
	}

	onDisconnect(fn: () => void): void {
		this.#disconnectHandlers.push(fn);
	}

	disconnect(): void {
		if (!this.#connected) return;
		this.#connected = false;
		const peer = this.#peer;
		if (peer === null) return;
		peer.#connected = false;
		for (const fn of peer.#disconnectHandlers) fn();
	}
}
