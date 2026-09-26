import { div, line, text } from "./elements.ts";
import type { Element } from "./elements.ts";
import { MONO, UI } from "./fonts.ts";
import { BG, BLUE, SURFACE, TEXT, TEXT_BRIGHT, TEXT_DIM, tint } from "./palette.ts";
import type { Event, JsonLine } from "./sample.ts";

export type PanelScale = {
	/** Row and toolbar text size; everything else is derived from it. */
	font: number;
	padding: number;
	radius: number;
};

export function toolbar({ font, padding }: PanelScale, count: number): Element {
	const control = {
		fontSize: font * 0.88,
		color: TEXT,
		backgroundColor: BG,
		border: `1px solid ${tint(0.16)}`,
		borderRadius: 5,
		padding: `${padding * 0.3}px ${padding * 0.7}px`,
	};

	return div(
		{
			flexDirection: "row",
			alignItems: "center",
			gap: padding * 0.6,
			padding: `${padding * 0.7}px ${padding}px`,
			backgroundColor: SURFACE,
			borderBottom: `1px solid ${tint(0.14)}`,
			fontFamily: UI,
		},
		[
			text({ ...control, flexGrow: 1, color: TEXT_DIM }, "Filter events…"),
			text({ fontSize: font * 0.88, color: TEXT }, String(count)),
			text(control, "Clear"),
		]
	);
}

export function row(
	{ font, padding }: PanelScale,
	{ n, name, time }: Event,
	selected = false
): Element {
	return line(
		{
			alignItems: "center",
			gap: padding * 0.7,
			padding: `${padding * 0.45}px ${padding}px`,
			borderBottom: `1px solid ${tint(0.1)}`,
			backgroundColor: selected ? SURFACE : "transparent",
			fontSize: font,
			fontFamily: UI,
		},
		[
			text(
				{ color: TEXT_DIM, fontSize: font * 0.85, width: font, justifyContent: "flex-end" },
				String(n)
			),
			text({ color: selected ? TEXT_BRIGHT : BLUE, flexGrow: 1 }, name),
			text({ color: TEXT_DIM, fontSize: font * 0.85 }, time),
		]
	);
}

// The payload of the selected event, rendered as the panel pretty-prints it.
export function json({ font, padding }: PanelScale, lines: readonly JsonLine[]): Element {
	const size = font * 0.87;

	return div(
		{
			flexDirection: "column",
			flexGrow: 1,
			padding: `${padding * 0.7}px ${padding}px`,
			fontFamily: MONO,
			fontSize: size,
			lineHeight: 1.55,
		},
		lines.map(({ depth, key, value, color, comma }) =>
			line({ paddingLeft: depth * size * 1.2 }, [
				...(key === undefined
					? []
					: [
							text({ color: BLUE }, `"${key}"`),
							text(
								{ color: TEXT, marginRight: value === undefined ? 0 : size * 0.6 },
								":"
							),
						]),
				...(value === undefined ? [] : [text({ color: color ?? TEXT }, value)]),
				...(comma ? [text({ color: TEXT }, ",")] : []),
			])
		)
	);
}
