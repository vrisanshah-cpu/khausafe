"use client";

import { useCallback, useRef, useState, type RefObject } from "react";

/**
 * Google Maps-style draggable bottom sheet: peek (compact), half, and full
 * snap points, with free drag between them. Height updates during drag are
 * applied directly to the DOM via a ref rather than React state, so a 60fps
 * touch-move never has to round-trip through a re-render of the map/list —
 * state is only committed once, on release, when the sheet snaps.
 */

export const SHEET_PEEK_PX = 96;
const HALF_FRACTION = 0.5;
const FULL_FRACTION = 0.85;

export type SheetSnap = "peek" | "half" | "full";

export function useBottomSheet(
  viewportRef: RefObject<HTMLElement | null>,
  sheetRef: RefObject<HTMLDivElement | null>
) {
  const [heightPx, setHeightPx] = useState(SHEET_PEEK_PX);
  const [snap, setSnap] = useState<SheetSnap>("peek");
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointerId: number; startY: number; startHeight: number } | null>(null);

  const snapHeights = useCallback(() => {
    const avail =
      viewportRef.current?.clientHeight ?? (typeof window !== "undefined" ? window.innerHeight : 800);
    return { peek: SHEET_PEEK_PX, half: avail * HALF_FRACTION, full: avail * FULL_FRACTION };
  }, [viewportRef]);

  const goTo = useCallback(
    (next: SheetSnap) => {
      const h = snapHeights()[next];
      setSnap(next);
      setHeightPx(h);
      if (sheetRef.current) sheetRef.current.style.height = `${h}px`;
    },
    [snapHeights, sheetRef]
  );

  const cycle = useCallback(() => {
    goTo(snap === "peek" ? "half" : snap === "half" ? "full" : "peek");
  }, [snap, goTo]);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      drag.current = { pointerId: e.pointerId, startY: e.clientY, startHeight: heightPx };
      setDragging(true);
    },
    [heightPx]
  );

  const onHandlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current || drag.current.pointerId !== e.pointerId) return;
      const { peek, full } = snapHeights();
      const delta = drag.current.startY - e.clientY;
      const next = Math.min(full, Math.max(peek, drag.current.startHeight + delta));
      if (sheetRef.current) sheetRef.current.style.height = `${next}px`;
    },
    [snapHeights, sheetRef]
  );

  const onHandlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current || drag.current.pointerId !== e.pointerId) return;
      const { peek, half, full } = snapHeights();
      const current = sheetRef.current?.getBoundingClientRect().height ?? heightPx;
      drag.current = null;
      setDragging(false);

      const options: [SheetSnap, number][] = [
        ["peek", peek],
        ["half", half],
        ["full", full],
      ];
      let best: SheetSnap = "peek";
      let bestDist = Infinity;
      for (const [key, val] of options) {
        const d = Math.abs(val - current);
        if (d < bestDist) {
          bestDist = d;
          best = key;
        }
      }
      goTo(best);
    },
    [snapHeights, heightPx, goTo, sheetRef]
  );

  return {
    heightPx,
    snap,
    dragging,
    goTo,
    cycle,
    onHandlePointerDown,
    onHandlePointerMove,
    onHandlePointerUp,
  };
}
