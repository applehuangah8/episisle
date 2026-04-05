import type { CSSProperties, RefObject } from "react";
import { useCallback, useMemo, useRef } from "react";

import { clampViewportScale, useStore } from "@/store/useStore";

const WHEEL_SCALE_FACTOR = 1.08;

export type UseViewportOptions = {
  /** 空白鍵按住時，左鍵在積木上也可啟動畫布平移 */
  spacePanHeldRef?: RefObject<boolean>;
};

/**
 * 與 Zustand viewport 同步，並提供慣用的平移／縮放輔助方法。
 * 左鍵拖空白處、**中鍵**、或 **空白鍵+左鍵** 平移（後兩者可在積木上開始）。
 */
export function useViewport(
  canvasRef: RefObject<HTMLElement | null>,
  opts?: UseViewportOptions
) {
  const viewport = useStore((s) => s.viewport);
  const panBy = useStore((s) => s.panBy);
  const zoomAtScreen = useStore((s) => s.zoomAtScreen);

  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const toCanvasLocal = useCallback(
    (clientX: number, clientY: number) => {
      const el = canvasRef.current;
      if (!el) return { x: clientX, y: clientY };
      const r = el.getBoundingClientRect();
      return { x: clientX - r.left, y: clientY - r.top };
    },
    [canvasRef]
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const { x, y } = toCanvasLocal(e.clientX, e.clientY);
      const direction = e.deltaY > 0 ? 1 / WHEEL_SCALE_FACTOR : WHEEL_SCALE_FACTOR;
      const next = clampViewportScale(viewport.scale * direction);
      zoomAtScreen(x, y, next);
    },
    [toCanvasLocal, viewport.scale, zoomAtScreen]
  );

  const spaceRef = opts?.spacePanHeldRef;

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.button !== 1) return;
      const spaceHeld = spaceRef?.current ?? false;
      const target = e.target as HTMLElement;
      if (e.button === 0 && !spaceHeld && target.closest("[data-epis-block]")) return;
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [spaceRef]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      panBy(dx, dy);
    },
    [panBy]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const transformStyle: CSSProperties = useMemo(
    () => ({
      transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`,
      transformOrigin: "0 0",
      willChange: "transform",
    }),
    [viewport.x, viewport.y, viewport.scale]
  );

  const toWorldFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const el = canvasRef.current;
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      const cx = clientX - r.left;
      const cy = clientY - r.top;
      const { x: vx, y: vy, scale } = viewport;
      const s = scale > 1e-6 ? scale : 1;
      return {
        x: (cx - vx) / s,
        y: (cy - vy) / s,
      };
    },
    [canvasRef, viewport]
  );

  return {
    viewport,
    transformStyle,
    toWorldFromClient,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    toCanvasLocal,
  };
}
