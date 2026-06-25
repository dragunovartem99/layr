export function panelHtml(): string {
	return `
		<header class="layr__toolbar">
			<input class="layr__filter" type="search" placeholder="Filter events…"
				autocomplete="off" spellcheck="false" />
			<span class="layr__count" aria-live="polite"></span>
			<button class="layr__btn layr__btn--clear" type="button">Clear</button>
		</header>
		<ol class="layr__log" aria-label="dataLayer events"></ol>`;
}

export function entryHtml({ order, time }: { order: number; time: string }): string {
	return `<details>
		<summary class="layr__summary">
			<span class="layr__order">${order}</span>
			<span class="layr__event"></span>
			<time class="layr__time">${time}</time>
		</summary>
		<div class="layr__body">
			<pre class="layr__pre"><code></code></pre>
			<button class="layr__btn layr__btn--copy" type="button">Copy</button>
		</div>
	</details>`;
}
