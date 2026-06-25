export function highlight({ text, query }: { text: string; query: string }): string {
	if (!query) return escape(text);
	const lower = text.toLowerCase();
	const lq = query.toLowerCase();
	let result = "";
	let i = 0;
	while (i < text.length) {
		const idx = lower.indexOf(lq, i);
		if (idx === -1) {
			result += escape(text.slice(i));
			break;
		}
		result += escape(text.slice(i, idx));
		result += `<mark>${escape(text.slice(idx, idx + query.length))}</mark>`;
		i = idx + query.length;
	}
	return result;
}

function escape(s: string): string {
	return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
