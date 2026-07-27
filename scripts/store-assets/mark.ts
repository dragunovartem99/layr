import { readFileSync } from "node:fs";
import { join } from "node:path";

// The mark is vector so it stays crisp in the tile's small slot; the shipped
// PNG icon smears when scaled down. Swap store/mark.svg to change it — nothing
// here reads its contents beyond handing the bytes to satori.
const MARK_PATH = join(import.meta.dirname, "..", "..", "store", "mark.svg");

const dataUri = `data:image/svg+xml;base64,${readFileSync(MARK_PATH).toString("base64")}`;

export function mark(size: number) {
	return {
		type: "img",
		props: { src: dataUri, width: size, height: size },
	};
}
