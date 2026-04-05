import { motion, useMotionValue } from "framer-motion";
import { Plus } from "lucide-react";
import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useShallow } from "zustand/react/shallow";

import {
  clientToDowntownBlankWorld,
  clientToWorldFromCanvasElement,
} from "@/canvas/viewportMath";
import {
  isClientPointInsideDowntownSlotRoot,
  resolveSlotIndexForBlockDrop,
  resolveSlotIndexForHighlight,
  type DowntownSlotRootKind,
} from "@/canvas/igClientHit";
import { isClientPointInsideMuseePortalInner } from "@/canvas/museePortalClientHit";
import {
  IG_FOOTER_H,
  IG_HEADER_H,
  IG_STORY_GAP,
  IG_STORY_H,
  IG_WORLD_CONTAINER_WIDTH_PX,
} from "@/canvas/igWorldGeometry";
import { BlockPlacementResizeHandle } from "@/components/BlockPlacementResizeHandle";
import { ensureBlocksRegistered } from "@/components/registerBlocks";
import {
  DowntownPlanEditorModal,
  DowntownPlanSlotPreview,
} from "@/components/downtown/DowntownPlanSlotBlock";
import {
  DOWNTOWN_IG_CONTAINER_ID,
  DOWNTOWN_SLOT_PX,
  DOWNTOWN_YT_CONTAINER_ID,
  isClientPointOverCanvasSurface,
} from "@/core/downtown";
import { getDistrictComponent } from "@/core/blockRegistry";
import { toRenderBlock } from "@/core/transform";
import type { PlacementID } from "@/core/types";
import { lockGlobalTextSelection, unlockGlobalTextSelection } from "@/dom/globalTextSelectionLock";
import { useStore, type DowntownPlanFrameChannel } from "@/store/useStore";

ensureBlocksRegistered();

export { IG_WORLD_CONTAINER_WIDTH_PX };

const STORY_RING_IG = "rgb(193, 216, 240)";
const STORY_RING_YT = "rgba(255, 69, 58, 0.85)";
const DRAG_THRESHOLD_PX = 6;

function StoryRingsRow({ channel }: { channel: "instagram" | "youtube" }) {
  const urls = useStore((s) => s.plannerStoryRingUrls[channel]);
  const setPlannerStoryRingUrl = useStore((s) => s.setPlannerStoryRingUrl);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const isYt = channel === "youtube";
  const ringColor = isYt ? STORY_RING_YT : STORY_RING_IG;

  const onFile =
    (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f || !f.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPlannerStoryRingUrl(channel, index, reader.result);
        }
      };
      reader.readAsDataURL(f);
    };

  const size = Math.min(44, IG_STORY_H - 4);

  return (
    <div className="flex shrink-0 items-center gap-2" style={{ height: IG_STORY_H }} role="group" aria-label="限動圈圈">
      {urls.map((url, i) => (
        <div key={i} className="relative shrink-0">
          <input
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden
            onChange={onFile(i)}
          />
          <button
            type="button"
            title={url ? "點擊更換圖案" : "新增圖案"}
            className={`relative shrink-0 overflow-hidden rounded-full border-2 transition ${
              isYt
                ? "bg-neutral-900/90 hover:bg-neutral-800"
                : "bg-white/85 hover:bg-white"
            }`}
            style={{
              borderColor: ringColor,
              width: size,
              height: size,
            }}
            onClick={() => inputsRef.current[i]?.click()}
          >
            {url ? (
              <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />
            ) : (
              <span
                className={`absolute inset-0 flex items-center justify-center ${
                  isYt ? "text-red-400/90" : "text-epis-ink/40"
                }`}
              >
                <Plus className="h-4 w-4" strokeWidth={2.25} />
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

const TownDockedBlock = memo(function TownDockedBlockInner({
  placementId,
  slotKind,
}: {
  placementId: PlacementID;
  slotKind: DowntownSlotRootKind;
}) {
  const containerId =
    slotKind === "ig" ? DOWNTOWN_IG_CONTAINER_ID : DOWNTOWN_YT_CONTAINER_ID;
  const assignPlacementToDowntownSlot = useStore((s) => s.assignPlacementToDowntownSlot);
  const assignPlacementToDowntownBlank = useStore((s) => s.assignPlacementToDowntownBlank);
  const releasePlacementFromDowntown = useStore((s) => s.releasePlacementFromDowntown);
  const sendToMuseeFromPortal = useStore((s) => s.sendToMuseeFromPortal);
  const setDowntownHighlightedSlot = useStore((s) => s.setDowntownHighlightedSlot);
  const setSelectedPlacementId = useStore((s) => s.setSelectedPlacementId);
  const selected = useStore((s) => s.selectedPlacementId === placementId);
  const editingHere = useStore((s) => s.editingPlacementId === placementId);
  const downtownContentScale = useStore((s) => s.downtownContentScale);

  const pair = useStore(
    useShallow((s) => {
      const placement = s.placements[placementId];
      if (!placement || placement.parentContainerId !== containerId) return null;
      const block = s.blocks[placement.blockId];
      if (!block || block.id in s.musee) return null;
      return { placement, block };
    })
  );

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const motionRef = useRef<HTMLDivElement>(null);
  const placementRef = useRef(pair?.placement ?? null);
  const lastSlotHighlightRef = useRef<number | null>(null);
  const unbindDragRef = useRef<(() => void) | null>(null);
  const dragGhostSizeRef = useRef({ w: DOWNTOWN_SLOT_PX, h: DOWNTOWN_SLOT_PX });
  const [dragging, setDragging] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const setPlanningDragVisual = useStore((s) => s.setPlanningDragVisual);
  const planningDragVisual = useStore((s) => s.planningDragVisual);
  const showingPlanningGhost =
    planningDragVisual?.placementId === placementId &&
    (planningDragVisual.kind === "slot-ig" || planningDragVisual.kind === "slot-yt");

  useLayoutEffect(() => {
    if (pair?.placement) placementRef.current = pair.placement;
  }, [pair?.placement]);

  useLayoutEffect(() => {
    if (!dragging) {
      x.set(0);
      y.set(0);
    }
  }, [pair?.placement.gridIndex, dragging, x, y]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (!pair) return;
      if (editingHere) return;
      if (e.button !== 0) return;
      const t = e.target as HTMLElement;
      if (t.closest("[data-epis-dblclick-edit]")) {
        e.stopPropagation();
        setSelectedPlacementId(pair.placement.id);
        return;
      }
      if (e.detail >= 2) {
        e.stopPropagation();
        return;
      }
      if (t.closest("[data-epis-no-drag], [data-epis-block-resize], button, a, input, textarea, select"))
        return;
      e.stopPropagation();
      unbindDragRef.current?.();
      unbindDragRef.current = null;
      setSelectedPlacementId(pair.placement.id);

      let dragMoved = false;
      const startClient = { x: e.clientX, y: e.clientY };
      let lastClient = { x: e.clientX, y: e.clientY };
      const placement = pair.placement;
      const gridOpt = slotKind === "yt" ? ("yt" as const) : ("ig" as const);

      const onMove = (ev: PointerEvent) => {
        const ax = ev.clientX - startClient.x;
        const ay = ev.clientY - startClient.y;
        if (!dragMoved) {
          if (ax * ax + ay * ay < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
          dragMoved = true;
          lockGlobalTextSelection();
          setDragging(true);
          lastSlotHighlightRef.current = null;
          const br0 = motionRef.current?.getBoundingClientRect();
          if (br0) {
            dragGhostSizeRef.current = { w: br0.width, h: br0.height };
          }
        }
        const sc =
          downtownContentScale > 1e-6 ? downtownContentScale : 1;
        const dx = (ev.clientX - lastClient.x) / sc;
        const dy = (ev.clientY - lastClient.y) / sc;
        lastClient = { x: ev.clientX, y: ev.clientY };
        x.set(x.get() + dx);
        y.set(y.get() + dy);

        const st = useStore.getState();
        const lx = lastClient.x;
        const ly = lastClient.y;
        const overMain = isClientPointOverCanvasSurface(lx, ly);
        const blankVp = document.querySelector("[data-epis-downtown-blank-viewport]");
        let overBlank = false;
        if (blankVp instanceof HTMLElement) {
          const vr = blankVp.getBoundingClientRect();
          overBlank = lx >= vr.left && lx <= vr.right && ly >= vr.top && ly <= vr.bottom;
        }
        if ((overMain || overBlank) && st.blocks[placement.blockId]) {
          setPlanningDragVisual({
            placementId: placement.id,
            clientX: lx,
            clientY: ly,
            width: dragGhostSizeRef.current.w,
            height: dragGhostSizeRef.current.h,
            kind: slotKind === "yt" ? "slot-yt" : "slot-ig",
          });
        } else {
          setPlanningDragVisual(null);
        }

        const idx = resolveSlotIndexForHighlight(
          motionRef.current,
          ev.clientX,
          ev.clientY,
          st.downtownIgSlotCount,
          slotKind
        );
        if (idx !== lastSlotHighlightRef.current) {
          lastSlotHighlightRef.current = idx;
          setDowntownHighlightedSlot(idx);
        }
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        unbindDragRef.current = null;
      };

      const onUp = () => {
        cleanup();
        setPlanningDragVisual(null);
        try {
          if (!dragMoved) return;
          setDragging(false);
          lastSlotHighlightRef.current = null;

          const st = useStore.getState();
          const p = st.placements[placement.id];
          if (!p) return;
          const gidx = p.gridIndex ?? 0;

          if (isClientPointInsideMuseePortalInner(lastClient.x, lastClient.y)) {
            sendToMuseeFromPortal(p.blockId);
            setDowntownHighlightedSlot(null);
            x.set(0);
            y.set(0);
            return;
          }

          if (st.aestheticsHubMode === "blank") {
            const blankVp = document.querySelector("[data-epis-downtown-blank-viewport]");
            const el = motionRef.current;
            const br = el?.getBoundingClientRect();
            if (blankVp instanceof HTMLElement && br) {
              const scx = br.left + br.width / 2;
              const scy = br.top + br.height / 2;
              const vr = blankVp.getBoundingClientRect();
              if (scx >= vr.left && scx <= vr.right && scy >= vr.top && scy <= vr.bottom) {
                const bw = p.ui?.width ?? DOWNTOWN_SLOT_PX;
                const bh = p.ui?.height ?? DOWNTOWN_SLOT_PX;
                const wpt = clientToDowntownBlankWorld(
                  scx,
                  scy,
                  blankVp,
                  st.canvasPosition,
                  st.downtownBlankScale
                );
                assignPlacementToDowntownBlank(p.id, wpt.x - bw / 2, wpt.y - bh / 2);
                setDowntownHighlightedSlot(null);
                x.set(0);
                y.set(0);
                return;
              }
            }
          }

          const inRoot = isClientPointInsideDowntownSlotRoot(lastClient.x, lastClient.y, slotKind);
          if (!inRoot) {
            const surface = document.querySelector("[data-epis-canvas-surface]");
            if (surface instanceof HTMLElement) {
              const wpt = clientToWorldFromCanvasElement(
                lastClient.x,
                lastClient.y,
                surface,
                st.viewport
              );
              releasePlacementFromDowntown(p.id, wpt.x, wpt.y);
            }
            setDowntownHighlightedSlot(null);
            x.set(0);
            y.set(0);
            return;
          }

          const slot = resolveSlotIndexForBlockDrop(
            motionRef.current,
            lastClient.x,
            lastClient.y,
            st.downtownIgSlotCount,
            slotKind
          );
          if (slot != null && slot !== gidx) {
            assignPlacementToDowntownSlot(p.id, slot, {
              occupantReleaseWorldCenter: (() => {
                const surface = document.querySelector("[data-epis-canvas-surface]");
                if (!(surface instanceof HTMLElement)) return { x: 0, y: 0 };
                return clientToWorldFromCanvasElement(
                  lastClient.x,
                  lastClient.y,
                  surface,
                  st.viewport
                );
              })(),
              grid: gridOpt,
            });
          }
          setDowntownHighlightedSlot(null);
          x.set(0);
          y.set(0);
        } finally {
          unlockGlobalTextSelection();
        }
      };

      unbindDragRef.current = cleanup;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [
      pair,
      editingHere,
      slotKind,
      setSelectedPlacementId,
      x,
      y,
      sendToMuseeFromPortal,
      assignPlacementToDowntownBlank,
      releasePlacementFromDowntown,
      assignPlacementToDowntownSlot,
      setDowntownHighlightedSlot,
      setPlanningDragVisual,
      downtownContentScale,
    ]
  );

  if (!pair) return null;

  const { placement, block } = pair;
  const model = toRenderBlock(block, placement, "neutral");
  const Cmp = getDistrictComponent(placement.district);
  if (!Cmp) return null;

  const dragLiftShadow = "0 20px 40px rgba(0, 0, 0, 0.1)";

  const slotKindShort = slotKind === "yt" ? "yt" : "ig";
  const slotLabel = slotKind === "yt" ? "YouTube 規劃格" : "Instagram 規劃格";

  return (
    <>
      <motion.div
        ref={motionRef}
        data-epis-block
        className="absolute inset-0 z-[1] cursor-grab overflow-visible rounded-sm active:cursor-grabbing"
        style={{
          x,
          y,
          scale: dragging ? 1.02 : 1,
          willChange: "transform",
          opacity: dragging && showingPlanningGhost ? 0.14 : dragging ? 0.98 : 1,
          boxShadow: dragging ? dragLiftShadow : undefined,
          zIndex: dragging ? 40 : undefined,
          cursor: dragging ? "grabbing" : undefined,
          transition: dragging ? "opacity 0.12s ease-out" : "opacity 0.2s ease-out",
        }}
        onPointerDown={handlePointerDown}
        onPointerCancel={() => {
          unbindDragRef.current?.();
          unbindDragRef.current = null;
          unlockGlobalTextSelection();
          setPlanningDragVisual(null);
          setDragging(false);
          setDowntownHighlightedSlot(null);
          x.set(0);
          y.set(0);
        }}
      >
        <div
          className="h-full min-h-0 w-full overflow-hidden rounded-sm text-[10px] leading-snug"
          onPointerDown={(e) => {
            const t = e.target as HTMLElement;
            if (t.closest("button, a, input, textarea, select, [data-epis-no-drag], [data-epis-block-resize]")) {
              e.stopPropagation();
            }
          }}
        >
          <DowntownPlanSlotPreview
            model={model}
            slotKind={slotKindShort}
            onRequestEdit={() => setEditOpen(true)}
          />
        </div>
        <BlockPlacementResizeHandle
          placementId={placement.id}
          visible={selected && !editingHere}
          contentScale={downtownContentScale}
          docked
        />
      </motion.div>
      <DowntownPlanEditorModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        model={model}
        district={placement.district}
        Cmp={Cmp}
        slotLabel={slotLabel}
      />
    </>
  );
});

function GridSlot({
  index,
  occupantId,
  highlighted,
  slotKind,
  addSlotBlock,
  hubMode,
}: {
  index: number;
  occupantId: PlacementID | null;
  highlighted: boolean;
  slotKind: DowntownSlotRootKind;
  addSlotBlock: (slotIndex: number) => void;
  hubMode: DowntownHubGridMode;
}) {
  const yt = hubMode === "youtube";
  return (
    <div
      data-epis-downtown-slot
      data-slot-index={index}
      className={`pointer-events-auto relative min-h-0 min-w-0 overflow-visible transition-colors duration-150 ${
        yt
          ? highlighted
            ? "aspect-video rounded-md border border-red-500/35 bg-red-950/25"
            : "aspect-video rounded-md border border-neutral-600/50 bg-black/40"
          : highlighted
            ? "aspect-square rounded-sm border border-[var(--color-stroke)]/35 bg-[rgba(255,255,255,0.22)]"
            : "aspect-square rounded-sm border border-[var(--color-stroke)]/35 bg-white/20"
      } w-full`}
    >
      {occupantId ? (
        <TownDockedBlock placementId={occupantId} slotKind={slotKind} />
      ) : (
        <button
          type="button"
          className={`absolute inset-0 flex items-center justify-center transition ${
            yt ? "text-neutral-500 hover:text-red-400/90" : "text-epis-ink/35 hover:text-epis-ink/55"
          }`}
          aria-label={`於格 ${index + 1} 新增 Downtown 積木`}
          onClick={() => addSlotBlock(index)}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

export type DowntownHubGridMode = "instagram" | "youtube";

/**
 * IG 或 YouTube 規劃格（槽位與容器分開；面板可於右欄工作區內拖移標題列、右下角改寬）。
 */
export const DowntownTownSlotGrid = memo(function DowntownTownSlotGridInner({
  hubMode,
}: {
  hubMode: DowntownHubGridMode;
}) {
  const planChannel: DowntownPlanFrameChannel = hubMode === "instagram" ? "instagram" : "youtube";
  const frame = useStore((s) => s.downtownPlanFrames[planChannel]);
  const panDowntownPlanFrameBy = useStore((s) => s.panDowntownPlanFrameBy);
  const resizeDowntownPlanFrameByWidth = useStore((s) => s.resizeDowntownPlanFrameByWidth);
  const downtownContentScale = useStore((s) => s.downtownContentScale);

  const frameDragActive = useRef(false);
  const resizeActive = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const onHeaderPointerDown = useCallback((e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest("button, a, input, textarea, select")) return;
    e.stopPropagation();
    frameDragActive.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onHeaderPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!frameDragActive.current) return;
      const scale = downtownContentScale > 1e-6 ? downtownContentScale : 1;
      const dx = (e.clientX - lastPointer.current.x) / scale;
      const dy = (e.clientY - lastPointer.current.y) / scale;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      panDowntownPlanFrameBy(planChannel, dx, dy);
    },
    [downtownContentScale, panDowntownPlanFrameBy, planChannel]
  );

  const endHeaderDrag = useCallback((e: ReactPointerEvent) => {
    frameDragActive.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onResizePointerDown = useCallback((e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    resizeActive.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onResizePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!resizeActive.current) return;
      const scale = downtownContentScale > 1e-6 ? downtownContentScale : 1;
      const dw = (e.clientX - lastPointer.current.x) / scale;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      if (Math.abs(dw) > 0.2) resizeDowntownPlanFrameByWidth(planChannel, dw);
    },
    [downtownContentScale, planChannel, resizeDowntownPlanFrameByWidth]
  );

  const endResize = useCallback((e: ReactPointerEvent) => {
    resizeActive.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const slotCount = useStore((s) => s.downtownIgSlotCount);
  const expandDowntownIgGrid = useStore((s) => s.expandDowntownIgGrid);
  const highlighted = useStore((s) => s.downtownHighlightedSlotIndex);
  const placements = useStore((s) => s.placements);
  const addBlockToDowntownIgSlot = useStore((s) => s.addBlockToDowntownIgSlot);
  const addBlockToDowntownYtSlot = useStore((s) => s.addBlockToDowntownYtSlot);

  const containerId =
    hubMode === "instagram" ? DOWNTOWN_IG_CONTAINER_ID : DOWNTOWN_YT_CONTAINER_ID;
  const slotKind: DowntownSlotRootKind = hubMode === "instagram" ? "ig" : "yt";

  const occupantBySlot = useMemo(() => {
    const map = new Map<number, PlacementID>();
    for (const p of Object.values(placements)) {
      if (p.parentContainerId === containerId && p.gridIndex != null) {
        map.set(p.gridIndex, p.id);
      }
    }
    return map;
  }, [placements, containerId]);

  const addSlotBlock =
    hubMode === "instagram" ? addBlockToDowntownIgSlot : addBlockToDowntownYtSlot;

  const isYt = hubMode === "youtube";

  return (
    <div
      className="pointer-events-auto absolute z-[2]"
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
      }}
    >
      <div
        data-epis-downtown-ig-root={hubMode === "instagram" ? true : undefined}
        data-epis-downtown-yt-root={hubMode === "youtube" ? true : undefined}
        className={`relative flex w-full flex-col overflow-visible rounded-xl backdrop-blur-md ${
          isYt
            ? "border border-neutral-700/80 bg-[#121212]/95 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)]"
            : "border border-[var(--color-panel-border)]/50 bg-white/25 shadow-[0_10px_28px_-8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.35)]"
        }`}
        style={{
          borderWidth: "0.5px",
        }}
      >
      <header
        className={`flex shrink-0 cursor-grab select-none items-center gap-2 border-b px-3 backdrop-blur-sm active:cursor-grabbing ${
          isYt
            ? "border-red-600/45 bg-black text-white"
            : "border-[var(--color-panel-border)]/40 bg-white/20 text-epis-ink"
        }`}
        style={{ height: IG_HEADER_H, borderBottomWidth: "0.5px" }}
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={endHeaderDrag}
        onPointerCancel={endHeaderDrag}
      >
        <span className={isYt ? "text-red-500" : "text-epis-ink/40"} aria-hidden>
          {isYt ? "▶" : "◆"}
        </span>
        <span
          className={`select-none text-[11px] font-semibold uppercase leading-none tracking-[0.05em] ${
            isYt ? "text-white/92" : "text-epis-ink/68"
          }`}
        >
          {hubMode === "instagram" ? "Downtown · 規劃格" : "YouTube · 規劃格"}
        </span>
      </header>

      <div className="flex min-h-0 w-full flex-1 flex-col px-3" style={{ paddingTop: IG_STORY_GAP }}>
        <StoryRingsRow channel={hubMode} />

        <div style={{ height: IG_STORY_GAP }} aria-hidden />

        <div className="min-w-0 w-full overflow-visible pb-0.5">
          <div className="grid w-full min-w-0 grid-cols-3 gap-1.5">
            {Array.from({ length: slotCount }).map((_, index) => (
              <GridSlot
                key={index}
                index={index}
                occupantId={occupantBySlot.get(index) ?? null}
                highlighted={highlighted === index}
                slotKind={slotKind}
                addSlotBlock={addSlotBlock}
                hubMode={hubMode}
              />
            ))}
          </div>
        </div>

        <div className="mt-2 flex shrink-0 justify-end pr-5" style={{ height: IG_FOOTER_H }}>
          <button
            type="button"
            className={`flex h-7 w-7 items-center justify-center self-center rounded-full border backdrop-blur-sm transition ${
              isYt
                ? "border-neutral-600 bg-neutral-900/80 text-neutral-400 hover:bg-neutral-800 hover:text-red-400"
                : "border-[var(--color-panel-border)]/50 bg-transparent text-epis-ink/55 hover:bg-white/50 hover:text-epis-ink/80"
            }`}
            style={{ borderWidth: "0.5px" }}
            title="向下新增一列（3 格）"
            aria-label="向下新增一列三格"
            onClick={() => expandDowntownIgGrid()}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      <button
        type="button"
        data-epis-no-drag
        className={`absolute bottom-1 right-1 z-10 h-4 w-4 rounded-sm border border-dashed opacity-60 transition hover:opacity-100 ${
          isYt ? "border-neutral-500 bg-neutral-900/80" : "border-[var(--color-stroke)]/40 bg-white/50"
        }`}
        style={{ cursor: "nwse-resize", borderWidth: "0.5px" }}
        title="調整寬度"
        aria-label="拖曳右下角調整規劃格寬度"
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={endResize}
        onPointerCancel={endResize}
      />
      </div>
    </div>
  );
});

export const DowntownIgGrid = memo(function DowntownIgGridInner() {
  return <DowntownTownSlotGrid hubMode="instagram" />;
});

export const DowntownYtGrid = memo(function DowntownYtGridInner() {
  return <DowntownTownSlotGrid hubMode="youtube" />;
});
