export class Signal<T> {
	#value: T;
	#subscribers: Set<(v: T) => void> = new Set();

	constructor(initial: T) {
		this.#value = initial;
	}

	get value(): T {
		return this.#value;
	}

	set value(next: T) {
		this.#value = next;
		for (const fn of this.#subscribers) fn(next);
	}

	subscribe(fn: (v: T) => void): () => void {
		this.#subscribers.add(fn);
		return () => this.#subscribers.delete(fn);
	}
}
