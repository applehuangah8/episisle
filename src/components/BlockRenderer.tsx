import { motion, useMotionValue } from "framer-motion";
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { clientToDowntownBlankWorld, clientToWorldFromCanvasElement } from "@/canvas/viewportMath";
import { useCanvasWorldOptional } from "@/canvas/CanvasWorldContext";
import {
  resolveIgSlotIndexForBlockDrop,
  resolveIgSlotIndexForHighlight,
  resolveSlotIndexForBlockDrop,
  resolveSlotIndexForHighlight,
} from "@/canvas/igClientHit";
import { isClientPointInsideDowntownSlotRoot } from "@/canvas/igClientHit";
import { isClientPointInsideMuseePortalInner } from "@/canvas/museePortalClientHit";
import {
  detectDistrictForRectCenterWorld,
  districtTypeForPlacementRect,
  districtTypeFromRectWithDragHysteresis,
} from "@/canvas/worldDistrictHitTest";
import {
  DOWNTOWN_BLANK_CONTAINER_ID,
  DOWNTOWN_IG_CONTAINER_ID,
  DOWNTOWN_YT_CONTAINER_ID,
} from "@/core/downtown";
import { IDENTITY_PLACEMENT_ID } from "@/core/identityBlock";
import { BlockPlacementResizeHandle } from "@/components/BlockPlacementResizeHandle";
import { ensureBlocksRegistered } from "@/components/registerBlocks";
import { TownFlipCard } from "@/components/blocks/TownFlipCard";
import { WildFlipCard } from "@/components/blocks/WildFlipCard";
import { getDistrictComponent } from "@/core/blockRegistry";
import { shouldShowPlacementInFocusMode } from "@/core/focusMode";
import { placementToRect, toRenderBlock } from "@/core/transform";
import type { Block, BlockComponent, DistrictType, Placement, PlacementID } from "@/core/types";
import { lockGlobalTextSelection, unlockGlobalTextSelection } from "@/dom/globalTextSelectionLock";
import { useStore } from "@/store/useStore";

ensureBlocksRegistered();

type PlacementSlice = { placement: Placement; block: Block };

const DRAG_THRESHOLD_PX = 6;
const settleSpring = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.75 };
const instantTransition = { type: "tween" as const, duration: 0 };

const dragLiftShadow =
  "0 28px 56px -12px rgba(0,0,0,0.14), 0 14px 28px -10px rgba(0,0,0,0.08)";

const borderLight = "1px solid rgba(255, 255, 255, 0.3)";

function districtShellAnimate(d: DistrictType): Record<string, string | number> {
  switch (d) {
    case "wild":
      return {
        borderRadius: 28,
        opacity: 0.93,
        boxShadow: "0 10px 28px -6px rgba(0,0,0,0.07), inset 0 1px 0 rgba(255,255,255,0.5)",
        backgroundColor: "rgba(189,204,201,0.28)",
        border: borderLight,
      };
    case "instagram":
    case "youtube":
      return {
        borderRadius: 16,
        opacity: 1,
        boxShadow:
          "0 8px 22px -5px rgba(0,0,0,0.07), inset 0 2px 6px rgba(255,255,255,0.55), inset 0 -3px 8px rgba(90,96,102,0.07)",
        backgroundColor: "rgba(255,255,255,0.38)",
        border: borderLight,
      };
    case "studio":
      return {
        borderRadius: 22,
        opacity: 1,
        boxShadow: "0 14px 38px -10px rgba(98,126,148,0.2), inset 0 1px 0 rgba(255,255,255,0.55)",
        backgroundColor: "rgba(232,238,244,0.48)",
        border: borderLight,
      };
    case "neutral":
      return {
        borderRadius: 22,
        opacity: 1,
        boxShadow: "0 10px 28px rgba(88,72,56,0.12), inset 0 1px 0 rgba(255,255,255,0.65)",
        backgroundColor: "rgba(247,242,228,0.55)",
        border: borderLight,
      };
    default:
      return {
        borderRadius: 20,
        opacity: 1,
        boxShadow: "var(--shadow-block)",
        backgroundColor: "rgba(255,255,255,0.4)",
        border: borderLight,
      };
  }
}

function isTownDistrict(d: DistrictType): boolean {
  return d === "instagram" || d === "youtube";
}

function BlockContent({
  district,
  model,
  Cmp,
}: {
  district: DistrictType;
  model: ReturnType<typeof toRenderBlock>;
  Cmp: BlockComponent;
}) {
  if (district === "wild") {
    return <WildFlipCard model={model} />;
  }
  if (isTownDistrict(district)) {
    return <TownFlipCard model={model} Cmp={Cmp} />;
  }
  return <Cmp model={model} />;
}

export const BlockRendererPlacement = memo(function BlockRendererPlacementInner({
  placementId,
}: {
  placementId: PlacementID;
}) {
  const setSelectedPlacementId = useStore((s) => s.setSelectedPlacementId);
  const setDistrict = useStore((s) => s.setDistrict);
  const updateBlockPosition = useStore((s) => s.updateBlockPosition);
  const sendToMuseeFromPortal = useStore((s) => s.sendToMuseeFromPortal);
  const assignPlacementToDowntownSlot = useStore((s) => s.assignPlacementToDowntownSlot);
  const assignPlacementToDowntownBlank = useStore((s) => s.assignPlacementToDowntownBlank);
  const setDowntownHighlightedSlot = useStore((s) => s.setDowntownHighlightedSlot);
  const worldDistrictZones = useStore((s) => s.worldDistrictZones);
  const viewportScale = useStore((s) => s.viewport.scale);
  const spacePanHeldRef = useCanvasWorldOptional()?.spacePanHeldRef;
  const selected = useStore((s) => s.selectedPlacementId === placementId);
  const editingHere = useStore((s) => s.editingPlacementId === placementId);
  const canvasArrivalFlash = useStore((s) => s.canvasArrivalFlashPlacementId === placementId);

  const [dragging, setDragging] = useState(false);
  const placementRef = useRef<Placement | null>(null);
  const motionRef = useRef<HTMLDivElement>(null);
  const lastSlotHighlightRef = useRef<number | null>(null);
  const lastLiveDistrictRef = useRef<DistrictType | null>(null);
  const unbindDragRef = useRef<(() => void) | null>(null);
  const dragGrabRef = useRef<{ x: number; y: number } | null>(null);
  const dragCanvasElRef = useRef<HTMLElement | null>(null);
  const scaleRef = useRef(viewportScale);
  scaleRef.current = viewportScale;
  const zonesRef = useRef(worldDistrictZones);
  zonesRef.current = worldDistrictZones;

  const pair = useStore(
    useShallow((s): PlacementSlice | null => {
      const placement = s.placements[placementId];
      if (!placement || placement.ui?.hidden) return null;
      if (placementId === IDENTITY_PLACEMENT_ID) return null;
      if (placement.parentContainerId === DOWNTOWN_IG_CONTAINER_ID) return null;
      if (placement.parentContainerId === DOWNTOWN_YT_CONTAINER_ID) return null;
      if (placement.parentContainerId === DOWNTOWN_BLANK_CONTAINER_ID) return null;
      if (placement.blockId in s.musee) return null;
      const block = s.blocks[placement.blockId];
      if (!block) return null;
      if (s.focusModeActive) {
        const inFocus = shouldShowPlacementInFocusMode(placement, block, {
          realm: s.focusRealm,
          lifecycle: s.focusLifecycle,
        });
        if (!inFocus && s.draggingCanvasPlacementId !== placementId) return null;
      }
      return { placement, block };
    })
  );

  const placement = pair?.placement ?? null;
  const block = pair?.block ?? null;

  const x = useMotionValue(placement?.position.x ?? 0);
  const y = useMotionValue(placement?.position.y ?? 0);

  useLayoutEffect(() => {
    if (!placement) return;
    placementRef.current = placement;
    if (!dragging) {
      const px = placement.position.x;
      const py = placement.position.y;
      if (Number.isFinite(px) && Number.isFinite(py)) {
        x.set(px);
        y.set(py);
      } else {
        x.set(0);
        y.set(0);
      }
    }
  }, [placement, placement?.position.x, placement?.position.y, dragging, x, y]);

  /** 外層不用 motion.div 綁 x/y，避免與內層 spring animate 互搶 transform 造成放開時瞬間跳回左上 */
  useLayoutEffect(() => {
    const el = motionRef.current;
    if (!el) return;
    const apply = () => {
      el.style.transform = `translate3d(${x.get()}px, ${y.get()}px, 0)`;
    };
    const ux = x.on("change", apply);
    const uy = y.on("change", apply);
    apply();
    return () => {
      ux();
      uy();
    };
  }, [x, y]);

  const districtForShell = pair?.placement?.district ?? "wild";
  const shellTarget = useMemo(
    () => districtShellAnimate(districtForShell),
    [districtForShell]
  );
  const shellBorderRadius =
    typeof shellTarget.borderRadius === "number" ? shellTarget.borderRadius : 22;

  const syncDistrictFromRect = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      const next = districtTypeForPlacementRect(rect, zonesRef.current);
      const pid = placementRef.current?.id;
      if (!pid) return;
      if (next !== placementRef.current?.district) {
        setDistrict(pid, next);
        placementRef.current = { ...placementRef.current!, district: next };
      }
    },
    [setDistrict]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (spacePanHeldRef?.current) return;
      if (editingHere) return;
      if (e.button !== 0) return;
      const t = e.target as HTMLElement;
      /** 雙擊的第二下：不掛拖曳（可雙擊區仍靠 detail 判斷，避免整卡無法拖移） */
      if (e.detail >= 2) {
        e.stopPropagation();
        return;
      }
      if (t.closest("[data-epis-no-drag], [data-epis-block-resize], button, a, input, textarea, select")) return;
      e.stopPropagation();
      unbindDragRef.current?.();
      unbindDragRef.current = null;
      setSelectedPlacementId(placementId);

      let dragMoved = false;
      const startClient = { x: e.clientX, y: e.clientY };
      let lastClient = { x: e.clientX, y: e.clientY };
      lastLiveDistrictRef.current = placementRef.current?.district ?? null;
      dragGrabRef.current = null;
      dragCanvasElRef.current = null;

      const onMove = (ev: PointerEvent) => {
        const ax = ev.clientX - startClient.x;
        const ay = ev.clientY - startClient.y;
        if (!dragMoved) {
          lastClient = { x: ev.clientX, y: ev.clientY };
          if (ax * ax + ay * ay < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
          dragMoved = true;
          lockGlobalTextSelection();
          setDragging(true);
          useStore.getState().setDraggingCanvasPlacementId(placementId);
          lastSlotHighlightRef.current = null;
          const cEl = document.querySelector("[data-epis-canvas-surface]");
          if (cEl instanceof HTMLElement) {
            dragCanvasElRef.current = cEl;
            const vp = useStore.getState().viewport;
            const w = clientToWorldFromCanvasElement(ev.clientX, ev.clientY, cEl, vp);
            dragGrabRef.current = { x: w.x - x.get(), y: w.y - y.get() };
          }
        }
        const prevLX = lastClient.x;
        const prevLY = lastClient.y;
        lastClient = { x: ev.clientX, y: ev.clientY };
        const cEl = dragCanvasElRef.current;
        const grab = dragGrabRef.current;
        if (cEl && grab) {
          const vp = useStore.getState().viewport;
          const w = clientToWorldFromCanvasElement(ev.clientX, ev.clientY, cEl, vp);
          x.set(w.x - grab.x);
          y.set(w.y - grab.y);
        } else {
          const s = scaleRef.current > 1e-6 ? scaleRef.current : 1;
          const dx = ev.clientX - prevLX;
          const dy = ev.clientY - prevLY;
          x.set(x.get() + dx / s);
          y.set(y.get() + dy / s);
        }

        const p = placementRef.current;
        if (!p) return;
        const w = p.ui?.width ?? 280;
        const h = p.ui?.height ?? 220;
        const r = { x: x.get(), y: y.get(), width: w, height: h };
        const sticky = lastLiveDistrictRef.current ?? p.district;
        const next = districtTypeFromRectWithDragHysteresis(r, zonesRef.current, sticky, 40);
        if (next !== lastLiveDistrictRef.current) {
          lastLiveDistrictRef.current = next;
          setDistrict(p.id, next);
          placementRef.current = { ...p, district: next };
        }

        const st = useStore.getState();
        if (st.aestheticsHubMode === "instagram") {
          const idx = resolveIgSlotIndexForHighlight(
            motionRef.current,
            lastClient.x,
            lastClient.y,
            st.downtownIgSlotCount
          );
          if (idx !== lastSlotHighlightRef.current) {
            lastSlotHighlightRef.current = idx;
            setDowntownHighlightedSlot(idx);
          }
        } else if (st.aestheticsHubMode === "youtube") {
          const idx = resolveSlotIndexForHighlight(
            motionRef.current,
            lastClient.x,
            lastClient.y,
            st.downtownIgSlotCount,
            "yt"
          );
          if (idx !== lastSlotHighlightRef.current) {
            lastSlotHighlightRef.current = idx;
            setDowntownHighlightedSlot(idx);
          }
        } else {
          setDowntownHighlightedSlot(null);
        }
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        unbindDragRef.current = null;
      };

      const dropClientFromRelease = (releaseEv: Event): { x: number; y: number } => {
        const pe = releaseEv as PointerEvent;
        if (
          typeof pe.clientX === "number" &&
          typeof pe.clientY === "number" &&
          Number.isFinite(pe.clientX) &&
          Number.isFinite(pe.clientY)
        ) {
          return { x: pe.clientX, y: pe.clientY };
        }
        return { x: lastClient.x, y: lastClient.y };
      };

      const onUp = (releaseEv: Event) => {
        const dropClient = dropClientFromRelease(releaseEv);
        cleanup();
        const moved = dragMoved;
        try {
          if (!moved) return;

          const st = useStore.getState();
          const p = st.placements[placementId];
          if (!p) return;
          const w = p.ui?.width ?? 280;
          const h = p.ui?.height ?? 220;

          const cSnap =
            dragCanvasElRef.current ??
            (document.querySelector("[data-epis-canvas-surface]") as HTMLElement | null);
          const grab = dragGrabRef.current;

          if (isClientPointInsideMuseePortalInner(dropClient.x, dropClient.y)) {
            sendToMuseeFromPortal(p.blockId);
            setDowntownHighlightedSlot(null);
            return;
          }

          if (
            st.aestheticsHubMode === "instagram" &&
            isClientPointInsideDowntownSlotRoot(dropClient.x, dropClient.y, "ig")
          ) {
            const slotIndex = resolveIgSlotIndexForBlockDrop(
              motionRef.current,
              dropClient.x,
              dropClient.y,
              st.downtownIgSlotCount
            );
            if (slotIndex != null) {
              assignPlacementToDowntownSlot(placementId, slotIndex, { grid: "ig" });
              setDowntownHighlightedSlot(null);
              return;
            }
          }

          if (
            st.aestheticsHubMode === "youtube" &&
            isClientPointInsideDowntownSlotRoot(dropClient.x, dropClient.y, "yt")
          ) {
            const slotIndex = resolveSlotIndexForBlockDrop(
              motionRef.current,
              dropClient.x,
              dropClient.y,
              st.downtownIgSlotCount,
              "yt"
            );
            if (slotIndex != null) {
              assignPlacementToDowntownSlot(placementId, slotIndex, { grid: "yt" });
              setDowntownHighlightedSlot(null);
              return;
            }
          }

          if (st.aestheticsHubMode === "blank") {
            const { canvasPosition, downtownBlankScale } = st;
            const px = dropClient.x;
            const py = dropClient.y;
            const hit = document.elementFromPoint(px, py);
            const blankVpFromHit = hit?.closest("[data-epis-downtown-blank-viewport]");
            if (blankVpFromHit instanceof HTMLElement) {
              const wpt = clientToDowntownBlankWorld(
                px,
                py,
                blankVpFromHit,
                canvasPosition,
                downtownBlankScale
              );
              assignPlacementToDowntownBlank(placementId, wpt.x - w / 2, wpt.y - h / 2);
              setDowntownHighlightedSlot(null);
              return;
            }
            const blankVp = document.querySelector("[data-epis-downtown-blank-viewport]");
            if (blankVp instanceof HTMLElement) {
              const vr = blankVp.getBoundingClientRect();
              const cursorIn =
                px >= vr.left && px <= vr.right && py >= vr.top && py <= vr.bottom;
              const br = motionRef.current?.getBoundingClientRect();
              const scx = br ? br.left + br.width / 2 : px;
              const scy = br ? br.top + br.height / 2 : py;
              const centerIn =
                br != null &&
                scx >= vr.left &&
                scx <= vr.right &&
                scy >= vr.top &&
                scy <= vr.bottom;
              if (cursorIn || centerIn) {
                const ax = cursorIn ? px : scx;
                const ay = cursorIn ? py : scy;
                const wpt = clientToDowntownBlankWorld(
                  ax,
                  ay,
                  blankVp,
                  canvasPosition,
                  downtownBlankScale
                );
                assignPlacementToDowntownBlank(placementId, wpt.x - w / 2, wpt.y - h / 2);
                setDowntownHighlightedSlot(null);
                return;
              }
            }
          }

          if (cSnap instanceof HTMLElement && grab) {
            const vp = st.viewport;
            const wpt = clientToWorldFromCanvasElement(dropClient.x, dropClient.y, cSnap, vp);
            x.set(wpt.x - grab.x);
            y.set(wpt.y - grab.y);
          }

          setDowntownHighlightedSlot(null);
          updateBlockPosition(placementId, x.get(), y.get());
          const placed = useStore.getState().placements[placementId];
          if (placed) {
            x.set(placed.position.x);
            y.set(placed.position.y);
          }
          const r = placementToRect({
            ...p,
            position: { x: placed?.position.x ?? x.get(), y: placed?.position.y ?? y.get() },
          });
          syncDistrictFromRect(r);
        } finally {
          if (moved) setDragging(false);
          unlockGlobalTextSelection();
          useStore.getState().setDraggingCanvasPlacementId(null);
        }
      };

      unbindDragRef.current = cleanup;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp as EventListener);
      window.addEventListener("pointercancel", onUp as EventListener);
    },
    [
      editingHere,
      placementId,
      setSelectedPlacementId,
      x,
      y,
      sendToMuseeFromPortal,
      assignPlacementToDowntownSlot,
      assignPlacementToDowntownBlank,
      updateBlockPosition,
      setDowntownHighlightedSlot,
      setDistrict,
      syncDistrictFromRect,
      spacePanHeldRef,
    ]
  );

  if (!pair || !placement || !block) return null;

  const hint = detectDistrictForRectCenterWorld(
    {
      x: placement.position.x,
      y: placement.position.y,
      width: placement.ui?.width ?? 280,
      height: placement.ui?.height ?? 220,
    },
    worldDistrictZones
  );
  const model = toRenderBlock(block, placement, hint);
  const district = placement.district;
  const Cmp = getDistrictComponent(district);

  if (!Cmp) {
    return (
      <div
        className="epis-brick absolute rounded-2xl border-dashed border-rose-300/70 bg-rose-50/50 p-2 text-xs text-rose-800"
        style={{
          width: model.rect.width,
          height: model.rect.height,
          transform: `translate3d(${model.rect.x}px, ${model.rect.y}px, 0)`,
        }}
      >
        未註冊的 district：{district}
      </div>
    );
  }

  return (
    <div
      ref={motionRef}
      data-epis-block
      className={`absolute z-[1] cursor-grab select-none overflow-visible active:cursor-grabbing ${selected ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-canvas-bg)]" : ""}`}
      style={{
        width: model.rect.width,
        height: model.rect.height,
        position: "absolute",
        left: 0,
        top: 0,
        willChange: "transform",
        boxShadow: dragging ? dragLiftShadow : undefined,
        zIndex: dragging ? 50 : undefined,
        cursor: dragging ? "grabbing" : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerCancel={() => {
        unbindDragRef.current?.();
        unbindDragRef.current = null;
        unlockGlobalTextSelection();
        setDragging(false);
        useStore.getState().setDraggingCanvasPlacementId(null);
        setDowntownHighlightedSlot(null);
        const p = placementRef.current;
        if (p) {
          x.set(p.position.x);
          y.set(p.position.y);
        }
      }}
    >
      {canvasArrivalFlash ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-[4px] z-10 border-2 border-[var(--color-accent)]"
          style={{
            borderRadius: shellBorderRadius + 6,
            boxShadow:
              "0 0 0 8px var(--color-accent-soft), 0 20px 44px -14px rgba(0,0,0,0.2)",
          }}
          initial={{ opacity: 0.95, scale: 0.94 }}
          animate={{ opacity: 0, scale: 1.07 }}
          transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}
      <motion.div
        className={`relative h-full min-h-0 w-full overflow-hidden ${district === "wild" ? "opacity-[0.98]" : ""}`}
        initial={false}
        animate={shellTarget}
        transition={dragging ? instantTransition : settleSpring}
        onPointerDown={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest("button, a, input, textarea, select, [data-epis-no-drag], [data-epis-block-resize]")) {
            e.stopPropagation();
          }
        }}
      >
        <BlockContent district={district} model={model} Cmp={Cmp} />
      </motion.div>
      <BlockPlacementResizeHandle
        placementId={placementId}
        visible={selected && !editingHere}
        contentScale={viewportScale}
      />
    </div>
  );
});

export function BlockRenderer() {
  const placementIds = useStore(useShallow((s) => Object.keys(s.placements)));
  const stableKeys = useMemo(
    () => [...placementIds].filter((id) => id !== IDENTITY_PLACEMENT_ID).sort(),
    [placementIds]
  );

  return (
    <>
      {stableKeys.map((id) => (
        <BlockRendererPlacement key={id} placementId={id} />
      ))}
    </>
  );
}
