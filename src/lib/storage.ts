const KEY = "layr-filter";

export function getFilterQuery(): string | null {
	return localStorage.getItem(KEY);
}

export function setFilterQuery({ query }: { query: string }): void {
	localStorage.setItem(KEY, query);
}

export function clearFilterQuery(): void {
	localStorage.removeItem(KEY);
}
