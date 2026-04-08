import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type MutableRefObject,
  type Ref,
} from "react";

import { BlockLayer } from "@/canvas/BlockLayer";
import { CanvasWorldContext } from "@/canvas/CanvasWorldContext";
import { DistrictLayer } from "@/canvas/DistrictLayer";
import { MuseeScreenPortal } from "@/canvas/MuseePortal";
import { PathwaysLayer } from "@/canvas/PathwaysLayer";
import { WorldCanvasBackground } from "@/canvas/WorldCanvasBackground";
import { WorldContainer } from "@/canvas/WorldContainer";
import { useViewport } from "@/canvas/useViewport";
import { BlockRenderer } from "@/components/BlockRenderer";
import { IdentityBlock } from "@/components/IdentityBlock";
import { useStore } from "@/store/useStore";

function assignRef<T>(r: Ref<T> | undefined, node: T | null) {
  if (r == null) return;
  if (typeof r === "function") r(node);
  else (r as MutableRefObject<T | null>).current = node;
}

function isEditableEventTarget(target: EventTarget | null): boolean {
  const el = target instanceof HTMLElement ? target : null;
  return !!el?.closest("input, textarea, select, [contenteditable=true]");
}

/**
 * 無限畫布：平移＋縮放。世界內容集中在唯一 {@link WorldContainer}（District／Pathways／IG／Block 層）。
 */
export const Canvas = forwardRef<HTMLDivElement>(function Canvas(_, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const spacePanHeldRef = useRef(false);

  const setSurfaceRef = useCallback(
    (node: HTMLDivElement | null) => {
      (rootRef as MutableRefObject<HTMLDivElement | null>).current = node;
      assignRef(ref, node);
    },
    [ref]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      if (isEditableEventTarget(e.target)) return;
      spacePanHeldRef.current = true;
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spacePanHeldRef.current = false;
    };
    const onBlur = () => {
      spacePanHeldRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const {
    viewport,
    transformStyle,
    toWorldFromClient,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  } = useViewport(rootRef, { spacePanHeldRef });

  useLayoutEffect(() => {
    const { setCanvasClientToWorld } = useStore.getState();
    setCanvasClientToWorld(toWorldFromClient);
    return () => setCanvasClientToWorld(null);
  }, [toWorldFromClient]);

  const worldStyle: CSSProperties = {
    ...transformStyle,
    ["--epis-view-scale" as string]: String(Math.max(0.25, viewport.scale)),
  };

  const canvasWorldValue = useMemo(
    () => ({ toWorldFromClient, spacePanHeldRef }),
    [toWorldFromClient]
  );

  return (
    <div className="epis-canvas-root relative h-full w-full overflow-visible bg-[var(--color-canvas-bg)]">
      <div className="pointer-events-none absolute inset-0 epis-canvas-pearl" aria-hidden />
      <div className="pointer-events-none absolute inset-0 epis-canvas-veil" aria-hidden />
      <div
        ref={setSurfaceRef}
        data-epis-canvas-surface
        className="epis-canvas-surface relative h-full w-full touch-none overflow-visible"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: "grab" }}
      >
        <CanvasWorldContext.Provider value={canvasWorldValue}>
          <WorldContainer style={worldStyle}>
            <WorldCanvasBackground />
            <DistrictLayer />
            <PathwaysLayer />
            <BlockLayer>
              <BlockRenderer />
              <IdentityBlock />
            </BlockLayer>
          </WorldContainer>
          <MuseeScreenPortal />
        </CanvasWorldContext.Provider>
      </div>
    </div>
  );
});
