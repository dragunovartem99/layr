/**
 * satori takes a React-shaped tree without React. These helpers keep the
 * artwork files readable — `div({ ... }, children)` rather than a nest of
 * `{ type, props }` literals.
 */
export type Element = { type: string; props: Record<string, unknown> };

type Style = Record<string, unknown>;

export function div(style: Style, children?: Element[] | string): Element {
	// satori requires an explicit display on anything with more than one child,
	// and every layout here is a flex one.
	return { type: "div", props: { style: { display: "flex", ...style }, children } };
}

// A single run of text, kept separate from `div` so leaf nodes read as copy.
export function text(style: Style, content: string): Element {
	return { type: "div", props: { style: { display: "flex", ...style }, children: content } };
}

// A line of mixed-colour text, e.g. one row of the JSON preview.
export function line(style: Style, runs: Element[]): Element {
	return div({ ...style, flexDirection: "row" }, runs);
}
