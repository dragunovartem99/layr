export class Storage {
	active(): boolean {
		return sessionStorage.getItem("layr") === "1";
	}

	clearActive(): void {
		sessionStorage.removeItem("layr");
	}

	filterQuery(): string | null {
		return sessionStorage.getItem("layr-filter");
	}

	setFilterQuery(q: string): void {
		sessionStorage.setItem("layr-filter", q);
	}

	clearFilterQuery(): void {
		sessionStorage.removeItem("layr-filter");
	}

	pos(): { x: number; y: number } | null {
		try {
			const raw = localStorage.getItem("layr-pos");
			return raw ? (JSON.parse(raw) as { x: number; y: number }) : null;
		} catch {
			return null;
		}
	}

	setPos(x: number, y: number): void {
		localStorage.setItem("layr-pos", JSON.stringify({ x, y }));
	}

	size(): { w: number; h: number } | null {
		try {
			const raw = localStorage.getItem("layr-size");
			return raw ? (JSON.parse(raw) as { w: number; h: number }) : null;
		} catch {
			return null;
		}
	}

	setSize(w: number, h: number): void {
		localStorage.setItem("layr-size", JSON.stringify({ w, h }));
	}
}
