import type { Storage } from "./Storage.ts";

type ResizeOptions = { handle: HTMLElement; target: HTMLElement; storage: Storage };
type ResizeSession = {
	handle: HTMLElement;
	target: HTMLElement;
	storage: Storage;
	e: PointerEvent;
};

const MIN_W = 200;
const MIN_H = 120;

function startResize({ handle, target, storage, e }: ResizeSession): void {
	const rect = target.getBoundingClientRect();
	const startPx = e.clientX,
		startPy = e.clientY;
	const startH = rect.height,
		startW = rect.width;
	let curH = startH,
		curW = startW;
	let rafId: number | null = null;

	const onMove = (ev: PointerEvent) => {
		curW = Math.max(MIN_W, startW + ev.clientX - startPx);
		curH = Math.max(MIN_H, startH + ev.clientY - startPy);
		if (rafId === null) {
			rafId = requestAnimationFrame(() => {
				target.style.width = `${curW}px`;
				target.style.height = `${curH}px`;
				rafId = null;
			});
		}
	};

	const onUp = (ev: PointerEvent) => {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		target.style.width = `${curW}px`;
		target.style.height = `${curH}px`;
		storage.setSize(curW, curH);
		document.removeEventListener("pointermove", onMove);
		document.removeEventListener("pointerup", onUp);
		document.removeEventListener("pointercancel", onUp);
		if (handle.hasPointerCapture(ev.pointerId)) handle.releasePointerCapture(ev.pointerId);
	};

	handle.setPointerCapture(e.pointerId);
	document.addEventListener("pointermove", onMove);
	document.addEventListener("pointerup", onUp);
	document.addEventListener("pointercancel", onUp);
}

export function resize({ handle, target, storage }: ResizeOptions): void {
	handle.addEventListener("pointerdown", (e) => {
		e.stopPropagation();
		startResize({ handle, target, storage, e });
	});
}
