export class Parse {
	#value: unknown;

	constructor(value: unknown) {
		this.#value = value;
	}

	jsonStrings(): unknown {
		return this.#expand(this.#value);
	}

	#expand(value: unknown): unknown {
		if (typeof value === "string") {
			try {
				const parsed: unknown = JSON.parse(value);
				if (parsed !== null && typeof parsed === "object") return this.#expand(parsed);
			} catch {
				/* not JSON */
			}
			return value;
		}
		if (Array.isArray(value)) return value.map((v) => this.#expand(v));
		if (value !== null && typeof value === "object") {
			return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, this.#expand(v)]));
		}
		return value;
	}
}
