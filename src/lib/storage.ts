const KEY_PREFIX = "layr-filter:";

export function getFilterQuery(tabId: number): string | null {
	return localStorage.getItem(KEY_PREFIX + tabId);
}

export function setFilterQuery({ tabId, query }: { tabId: number; query: string }): void {
	localStorage.setItem(KEY_PREFIX + tabId, query);
}

export function clearFilterQuery(tabId: number): void {
	localStorage.removeItem(KEY_PREFIX + tabId);
}
