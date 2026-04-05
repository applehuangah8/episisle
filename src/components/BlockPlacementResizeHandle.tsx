import { useCallback, useRef } from "react";

import {
  DEFAULT_BLOCK_PLACEMENT_HEIGHT,
  DEFAULT_BLOCK_PLACEMENT_WIDTH,
} from "@/canvas/viewportMath";
import type { PlacementID } from "@/core/types";
import { useStore } from "@/store/useStore";

type Edge = "n" | "s" | "e" | "w" | "se";

/**
 * 四邊＋右下角：拉長／拉寬積木；小島方塊不使用此元件。
 * `contentScale`：螢幕位移 ÷ 此值 → placement 邏輯座標增量。
 */
export function BlockPlacementResizeHandle({
  placementId,
  visible,
  contentScale,
  docked = false,
}: {
  placementId: PlacementID;
  visible: boolean;
  contentScale: number;
  /** Downtown 格內僅允許向外拉長（不調整 position） */
  docked?: boolean;
}) {
  const setPlacementRect = useStore((s) => s.setPlacementRect);
  const unbindRef = useRef<(() => void) | null>(null);

  const onEdgePointerDown = useCallback(
    (edge: Edge, e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      unbindRef.current?.();
      const st = useStore.getState();
      const p = st.placements[placementId];
      if (!p) return;
      const startW = p.ui?.width ?? DEFAULT_BLOCK_PLACEMENT_WIDTH;
      const startH = p.ui?.height ?? DEFAULT_BLOCK_PLACEMENT_HEIGHT;
      const startX = p.position.x;
      const startY = p.position.y;
      const startClient = { x: e.clientX, y: e.clientY };
      const sc = contentScale > 1e-6 ? contentScale : 1;

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startClient.x) / sc;
        const dy = (ev.clientY - startClient.y) / sc;
        switch (edge) {
          case "se":
            setPlacementRect(placementId, {
              width: startW + dx,
              height: startH + dy,
            });
            break;
          case "e":
            setPlacementRect(placementId, { width: startW + dx });
            break;
          case "s":
            setPlacementRect(placementId, { height: startH + dy });
            break;
          case "w":
            setPlacementRect(placementId, {
              x: startX + dx,
              width: startW - dx,
            });
            break;
          case "n":
            setPlacementRect(placementId, {
              y: startY + dy,
              height: startH - dy,
            });
            break;
          default:
            break;
        }
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        unbindRef.current = null;
      };

      const onUp = () => {
        cleanup();
      };

      unbindRef.current = cleanup;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [placementId, contentScale, setPlacementRect]
  );

  if (!visible) return null;

  const bar = "pointer-events-auto absolute z-[30] bg-[var(--color-town-bg)]/70 backdrop-blur-sm transition hover:bg-white/85";
  const hit = "border border-[var(--color-stroke)]/20";

  return (
    <>
      {!docked ? (
        <div
          data-epis-block-resize="n"
          className={`${bar} ${hit} left-2 right-2 top-0 h-1.5 cursor-n-resize rounded-full`}
          title="拖曳拉高"
          aria-label="上邊調整高度"
          onPointerDown={(e) => onEdgePointerDown("n", e)}
        />
      ) : null}
      <div
        data-epis-block-resize="s"
        className={`${bar} ${hit} bottom-0 left-2 right-2 h-1.5 cursor-s-resize rounded-full`}
        title="拖曳拉低"
        aria-label="下邊調整高度"
        onPointerDown={(e) => onEdgePointerDown("s", e)}
      />
      {!docked ? (
        <div
          data-epis-block-resize="w"
          className={`${bar} ${hit} bottom-2 left-0 top-2 w-1.5 cursor-w-resize rounded-full`}
          title="拖曳拉寬"
          aria-label="左邊調整寬度"
          onPointerDown={(e) => onEdgePointerDown("w", e)}
        />
      ) : null}
      <div
        data-epis-block-resize="e"
        className={`${bar} ${hit} bottom-2 right-0 top-2 w-1.5 cursor-e-resize rounded-full`}
        title="拖曳拉寬"
        aria-label="右邊調整寬度"
        onPointerDown={(e) => onEdgePointerDown("e", e)}
      />
      <div
        data-epis-block-resize="se"
        className={`${bar} ${hit} bottom-0 right-0 flex h-5 w-5 cursor-se-resize items-end justify-end rounded-tl-md p-0.5 shadow-sm`}
        title="拖曳同調寬高"
        aria-label="右下角調整大小"
        onPointerDown={(e) => onEdgePointerDown("se", e)}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className="text-epis-ink/35">
          <path
            d="M9 1v8H1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M9 5H5v4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );
}
