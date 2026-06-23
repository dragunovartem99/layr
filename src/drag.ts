import type { Storage } from "./Storage.ts";

type DragOptions = { handle: HTMLElement; target: HTMLElement; storage: Storage };
type DragSession = { handle: HTMLElement; target: HTMLElement; storage: Storage; e: PointerEvent };

function startDrag({ handle, target, storage, e }: DragSession): void {
	const rect = target.getBoundingClientRect();
	const startPx = e.clientX,
		startPy = e.clientY;
	const startTx = rect.left,
		startTy = rect.top;
	let curX = startTx,
		curY = startTy;
	let rafId: number | null = null;

	const onMove = (ev: PointerEvent) => {
		curX = Math.max(
			0,
			Math.min(startTx + ev.clientX - startPx, window.innerWidth - target.offsetWidth)
		);
		curY = Math.max(
			0,
			Math.min(startTy + ev.clientY - startPy, window.innerHeight - target.offsetHeight)
		);
		if (rafId === null) {
			rafId = requestAnimationFrame(() => {
				target.style.left = `${curX}px`;
				target.style.top = `${curY}px`;
				rafId = null;
			});
		}
	};

	const onUp = (ev: PointerEvent) => {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
		target.style.left = `${curX}px`;
		target.style.top = `${curY}px`;
		storage.setPos(curX, curY);
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

export function drag({ handle, target, storage }: DragOptions): void {
	handle.addEventListener("pointerdown", (e) => {
		if (e.button !== 0) return;
		if ((e.target as HTMLElement).closest("button, input, a")) return;
		e.stopPropagation();
		startDrag({ handle, target, storage, e });
	});
}
