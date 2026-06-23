export function panelHtml({ iconUrl }: { iconUrl: string }): string {
	return `
		<header class="layr__toolbar">
			<span class="layr__brand">
				<img class="layr__icon" src="${iconUrl}" alt="" width="16" height="16" />
				Layr
			</span>
			<input class="layr__filter" type="search" placeholder="Filter events…"
				autocomplete="off" spellcheck="false" />
			<span class="layr__count" aria-live="polite"></span>
			<button class="layr__btn layr__btn--clear" type="button">Clear</button>
			<button class="layr__btn layr__btn--close" type="button" aria-label="Close">✕</button>
		</header>
		<ol class="layr__log" aria-label="dataLayer events"></ol>
		<div class="layr__resize" aria-hidden="true"></div>`;
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
