export function expandJsonStrings({ value }: { value: unknown }): unknown {
	return expand(value);
}

function expand(value: unknown): unknown {
	if (typeof value === "string") {
		try {
			const parsed: unknown = JSON.parse(value);
			if (parsed !== null && typeof parsed === "object") return expand(parsed);
		} catch {
			/* not JSON */
		}
		return value;
	}
	if (Array.isArray(value)) return value.map((v) => expand(v));
	if (value !== null && typeof value === "object") {
		return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, expand(v)]));
	}
	return value;
}
