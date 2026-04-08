import { motion, useMotionValue } from "framer-motion";
import { Box, Plus, X } from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { useShallow } from "zustand/react/shallow";

import { BlockPlacementResizeHandle } from "@/components/BlockPlacementResizeHandle";
import { AccentColorPickerPanel } from "@/components/ui/AccentColorPickerPanel";
import { ensureBlocksRegistered } from "@/components/registerBlocks";
import { TownFlipCard } from "@/components/blocks/TownFlipCard";
import { WildFlipCard } from "@/components/blocks/WildFlipCard";
import {
  DOWNTOWN_BLANK_CONTAINER_ID,
  findDowntownSlotIndexAndGridAtClient,
  findDowntownSlotIndexAtClient,
  isClientPointOverCanvasSurface,
} from "@/core/downtown";
import { DOWNTOWN_BLANK_WORLD_H, DOWNTOWN_BLANK_WORLD_W } from "@/core/downtownBlankBounds";
import { isClientPointInsideMuseePortalInner } from "@/canvas/museePortalClientHit";
import { getDistrictComponent } from "@/core/blockRegistry";
import { toRenderBlock } from "@/core/transform";
import { normalizeLeafAccent, readableInkOnAccent, relativeLuminanceFromHex } from "@/core/accentColor";
import {
  BLANK_RING_LABEL_SHAPES,
  IDENTITY_LEAF_BG_PALETTE,
  type BlankRingLabelShape,
  type BlankStoryRing,
  type BlockComponent,
  type DistrictType,
  type PlacementID,
} from "@/core/types";
import { clientToWorldFromCanvasElement, clientToDowntownBlankWorld } from "@/canvas/viewportMath";
import { lockGlobalTextSelection, unlockGlobalTextSelection } from "@/dom/globalTextSelectionLock";
import { useStore } from "@/store/useStore";

ensureBlocksRegistered();

/** 約十字以內（與 store BLANK_LABEL_TEXT_MAX 對齊） */
const BLANK_LABEL_TEXT_MAX = 14;
const RING_GRIP_H = 11;
const RING_HP = 10;
const RING_TONE_H = 7;
const RING_TONE_GAP = 6;
/** 底列：外形按鈕＋選色（單行） */
const RING_TONE_ROW_H = 24;
/** 拖曳：每幀朝目標靠攏比例 */
const RING_DRAG_SMOOTH = 0.88;

type BlankLabelLayout = {
  outerW: number;
  outerH: number;
  /** 外框左緣 →文字區左緣 */
  insetX: number;
  bodyW: number;
  bodyH: number;
  grip: number;
  hp: number;
  toneH: number;
  toneGap: number;
  toneRowH: number;
  bodyRadius: string | number;
  clipPath?: string;
  fontPx: number;
};

function blankLabelLayout(shape: BlankRingLabelShape): BlankLabelLayout {
  const grip = RING_GRIP_H;
  const hp = RING_HP;
  const toneH = RING_TONE_H;
  const toneGap = RING_TONE_GAP;
  const toneRowH = RING_TONE_ROW_H;
  let bodyW: number;
  let bodyH: number;
  let bodyRadius: string | number;
  let clipPath: string | undefined;

  switch (shape) {
    case "pill":
      bodyW = 200;
      bodyH = 48;
      bodyRadius = 9999;
      break;
    case "round":
      bodyW = 184;
      bodyH = 54;
      bodyRadius = 22;
      break;
    case "tag":
      bodyW = 208;
      bodyH = 48;
      bodyRadius = 0;
      clipPath = "polygon(0 0,calc(100% - 18px) 0,100% 50%,calc(100% - 18px) 100%,0 100%)";
      break;
    case "banner":
      bodyW = 212;
      bodyH = 46;
      bodyRadius = "10px 10px 16px 16px";
      break;
    case "ticket":
      bodyW = 196;
      bodyH = 50;
      bodyRadius = 0;
      clipPath =
        "polygon(14px 0,calc(100% - 14px) 0,100% 14px,100% calc(100% - 14px),calc(100% - 14px) 100%,14px 100%,0 calc(100% - 14px),0 14px)";
      break;
    default:
      bodyW = 200;
      bodyH = 48;
      bodyRadius = 9999;
  }

  const outerW = bodyW + 2 * hp;
  const outerH = hp + grip + bodyH + toneGap + toneRowH + hp;
  const insetX = hp;

  return {
    outerW,
    outerH,
    insetX,
    bodyW,
    bodyH,
    grip,
    hp,
    toneH,
    toneGap,
    toneRowH,
    bodyRadius,
    clipPath,
    fontPx: 18,
  };
}

function clampLabelBodyPos(L: BlankLabelLayout, x: number, y: number) {
  const minX = L.insetX;
  const maxX = DOWNTOWN_BLANK_WORLD_W - L.outerW + L.insetX;
  const minY = L.grip + L.hp;
  const maxY = DOWNTOWN_BLANK_WORLD_H - L.outerH + L.grip + L.hp;
  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y)),
  };
}

function ShapeThumb({ shape, active }: { shape: BlankRingLabelShape; active: boolean }) {
  const bg = active ? "rgba(58,63,71,0.35)" : "rgba(58,63,71,0.18)";
  const base = { background: bg, width: 22, height: 12 } as const;
  switch (shape) {
    case "pill":
      return <div style={{ ...base, borderRadius: 9999 }} />;
    case "round":
      return <div style={{ ...base, borderRadius: 5 }} />;
    case "tag":
      return (
        <div
          style={{
            ...base,
            clipPath: "polygon(0 0,72% 0,100% 50%,72% 100%,0 100%)",
          }}
        />
      );
    case "banner":
      return <div style={{ ...base, borderRadius: "3px 3px 5px 5px" }} />;
    case "ticket":
      return (
        <div
          style={{
            ...base,
            clipPath:
              "polygon(20% 0,80% 0,100% 35%,100% 65%,80% 100%,20% 100%,0 65%,0 35%)",
          }}
        />
      );
    default:
      return <div style={{ ...base, borderRadius: 9999 }} />;
  }
}

/** 新增標籤紙：僅以形狀縮圖選外形（無文字選項） */
const BlankWorkspaceAddRingShapePicker = memo(function BlankWorkspaceAddRingShapePickerInner({
  value,
  onChange,
}: {
  value: BlankRingLabelShape;
  onChange: (s: BlankRingLabelShape) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (ev: PointerEvent) => {
      if (wrapRef.current?.contains(ev.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="標籤紙外形"
        aria-expanded={open}
        aria-haspopup="listbox"
        title="標籤紙外形"
        className="flex h-8 w-10 items-center justify-center rounded-full transition hover:bg-[var(--color-canvas-bg)]"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <div style={{ transform: "scale(1.15)", transformOrigin: "center" }}>
          <ShapeThumb shape={value} active />
        </div>
      </button>
      {open ? (
        <ul
          className="absolute right-0 top-full z-[25] mt-1 flex min-w-[3.25rem] flex-col gap-0.5 rounded-xl border border-[var(--color-stroke)]/35 bg-white p-1 shadow-lg"
          role="listbox"
          aria-label="選擇標籤外形"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {BLANK_RING_LABEL_SHAPES.map((sh) => (
            <li key={sh} role="none">
              <button
                type="button"
                role="option"
                aria-label={`標籤外形 ${sh}`}
                aria-selected={sh === value}
                className={`flex w-full items-center justify-center rounded-lg px-2 py-1.5 transition ${
                  value === sh
                    ? "bg-[var(--color-accent-soft)]/50 ring-1 ring-[var(--color-accent)]/35"
                    : "hover:bg-[var(--color-canvas-bg)]"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(sh);
                  setOpen(false);
                }}
              >
                <div style={{ transform: "scale(1.35)", transformOrigin: "center" }}>
                  <ShapeThumb shape={sh} active={value === sh} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});

const BlankWorkspaceStoryRing = memo(function BlankWorkspaceStoryRingInner({
  ring,
  viewportRef,
}: {
  ring: BlankStoryRing;
  viewportRef: RefObject<HTMLDivElement | null>;
}) {
  const updateBlankStoryRing = useStore((s) => s.updateBlankStoryRing);
  const removeBlankStoryRing = useStore((s) => s.removeBlankStoryRing);
  const [editing, setEditing] = useState(false);
  const [toneOpen, setToneOpen] = useState(false);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [draft, setDraft] = useState(ring.text);
  const chromeWrapRef = useRef<HTMLDivElement>(null);
  /** 游標世界座標與圈圈主體左上角的世界座標差（避免 client/scale 與 transform 不一致導致漂移） */
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const dragTargetRef = useRef<{ x: number; y: number } | null>(null);
  const dragSmoothRef = useRef<{ x: number; y: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);

  const py = ring.positionY ?? 52;
  const shape = (ring.labelShape ?? "pill") as BlankRingLabelShape;
  const L = useMemo(() => blankLabelLayout(shape), [shape]);

  useEffect(() => {
    if (!editing) setDraft(ring.text);
  }, [editing, ring.text]);

  useEffect(() => {
    if (editing) {
      setToneOpen(false);
      setShapeOpen(false);
    }
  }, [editing]);

  useEffect(() => {
    if (!toneOpen && !shapeOpen) return;
    let cancelled = false;
    const onDoc = (e: MouseEvent) => {
      if (chromeWrapRef.current?.contains(e.target as Node)) return;
      setToneOpen(false);
      setShapeOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setToneOpen(false);
        setShapeOpen(false);
      }
    };
    const t = window.setTimeout(() => {
      if (cancelled) return;
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [toneOpen, shapeOpen]);

  /** positionX／positionY：標籤文字區左上角世界座標 */
  const clampRingPos = useCallback(
    (x: number, y: number) => clampLabelBodyPos(L, x, y),
    [L]
  );

  const applyLabelShape = useCallback(
    (nextShape: BlankRingLabelShape) => {
      const oldL = blankLabelLayout(shape);
      const newL = blankLabelLayout(nextShape);
      const posY = ring.positionY ?? 52;
      const cx = ring.positionX + oldL.bodyW / 2;
      const cy = posY + oldL.bodyH / 2;
      const nx = Math.round(cx - newL.bodyW / 2);
      const ny = Math.round(cy - newL.bodyH / 2);
      const c = clampLabelBodyPos(newL, nx, ny);
      updateBlankStoryRing(ring.id, { labelShape: nextShape, positionX: c.x, positionY: c.y });
    },
    [ring.id, ring.positionX, ring.positionY, shape, updateBlankStoryRing]
  );

  const onGripPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      const vp = viewportRef.current;
      if (!vp) return;
      const gripEl = e.currentTarget as HTMLElement;
      const pid = e.pointerId;
      const { canvasPosition, downtownBlankScale } = useStore.getState();
      const sc = downtownBlankScale > 1e-6 ? downtownBlankScale : 1;
      const w0 = clientToDowntownBlankWorld(e.clientX, e.clientY, vp, canvasPosition, sc);
      dragRef.current = {
        offsetX: w0.x - ring.positionX,
        offsetY: w0.y - py,
      };

      let ended = false;
      const cancelDragRaf = () => {
        if (dragRafRef.current != null) {
          cancelAnimationFrame(dragRafRef.current);
          dragRafRef.current = null;
        }
      };

      const pumpDrag = () => {
        dragRafRef.current = null;
        if (ended) return;
        const st = dragRef.current;
        const target = dragTargetRef.current;
        const sm = dragSmoothRef.current;
        if (!st || !target || !sm) return;
        const nx = sm.x + (target.x - sm.x) * RING_DRAG_SMOOTH;
        const ny = sm.y + (target.y - sm.y) * RING_DRAG_SMOOTH;
        sm.x = nx;
        sm.y = ny;
        updateBlankStoryRing(ring.id, { positionX: nx, positionY: ny });
        const err = Math.hypot(target.x - nx, target.y - ny);
        if (err > 0.35) {
          dragRafRef.current = requestAnimationFrame(pumpDrag);
        }
      };

      const schedulePump = () => {
        if (dragRafRef.current != null) return;
        dragRafRef.current = requestAnimationFrame(pumpDrag);
      };

      const cleanup = () => {
        if (ended) return;
        ended = true;
        unlockGlobalTextSelection();
        cancelDragRaf();
        const t = dragTargetRef.current;
        if (t) {
          updateBlankStoryRing(ring.id, { positionX: t.x, positionY: t.y });
        }
        dragRef.current = null;
        dragTargetRef.current = null;
        dragSmoothRef.current = null;
        gripEl.removeEventListener("pointermove", onMove);
        gripEl.removeEventListener("pointerup", end);
        gripEl.removeEventListener("pointercancel", end);
        gripEl.removeEventListener("lostpointercapture", onLost);
        try {
          if (gripEl.hasPointerCapture(pid)) gripEl.releasePointerCapture(pid);
        } catch {
          /* ignore */
        }
      };

      dragSmoothRef.current = { x: ring.positionX, y: py };
      dragTargetRef.current = { x: ring.positionX, y: py };

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pid) return;
        const st = dragRef.current;
        if (!st) return;
        const { canvasPosition: pos, downtownBlankScale: scMove } = useStore.getState();
        const sM = scMove > 1e-6 ? scMove : 1;
        const w1 = clientToDowntownBlankWorld(ev.clientX, ev.clientY, vp, pos, sM);
        const cx = w1.x - st.offsetX;
        const cy = w1.y - st.offsetY;
        const { x, y } = clampRingPos(cx, cy);
        dragTargetRef.current = { x, y };
        schedulePump();
      };

      const end = (ev: PointerEvent) => {
        if (ev.pointerId !== pid) return;
        cleanup();
      };

      const onLost = (ev: PointerEvent) => {
        if (ev.pointerId !== pid) return;
        cleanup();
      };

      lockGlobalTextSelection();
      gripEl.addEventListener("pointermove", onMove);
      gripEl.addEventListener("pointerup", end);
      gripEl.addEventListener("pointercancel", end);
      gripEl.addEventListener("lostpointercapture", onLost);
      gripEl.setPointerCapture(pid);
    },
    [clampRingPos, py, ring.id, ring.positionX, updateBlankStoryRing, viewportRef]
  );

  const accent = normalizeLeafAccent(ring.accentBg);
  const ink = useMemo(() => readableInkOnAccent(accent), [accent]);
  const darkAccent = useMemo(() => relativeLuminanceFromHex(accent) < 0.45, [accent]);

  const circleSurface = {
    background: `radial-gradient(ellipse 95% 88% at 32% 22%, rgba(255,255,255,0.5) 0%, transparent 52%),
      radial-gradient(ellipse 70% 55% at 78% 88%, rgba(255,255,255,0.18) 0%, transparent 48%),
      ${accent}`,
    boxShadow: `inset 0 2px 3px rgba(255,255,255,0.55), inset 0 -3px 10px rgba(58,63,71,0.07),
      0 6px 20px -6px rgba(58,63,71,0.14), 0 0 0 1px rgba(58,63,71,0.14)`,
    border: "1px solid rgba(58,63,71,0.16)",
  } as const;

  const textStyle = {
    color: ink.color,
    fontFamily: "var(--epis-font-district), Georgia, serif",
    ...(ink.textShadow ? { textShadow: ink.textShadow } : {}),
  } as const;

  const bodySurface: CSSProperties = {
    ...circleSurface,
    borderRadius: L.bodyRadius,
    ...(L.clipPath ? { clipPath: L.clipPath } : {}),
  };

  return (
    <div
      data-epis-blank-ring-root
      className="absolute z-[8]"
      style={{
        left: ring.positionX - L.insetX,
        top: py - L.grip - L.hp,
        width: L.outerW,
        height: L.outerH,
      }}
    >
      <div
        className="pointer-events-none absolute left-0 right-0 flex justify-center"
        style={{ top: 0, height: L.grip }}
        aria-hidden
      >
        <div
          className="rounded-full bg-[rgba(58,63,71,0.1)]"
          style={{
            marginTop: 4,
            width: Math.min(40, Math.max(28, L.bodyW * 0.2)),
            height: 4,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
          }}
        />
      </div>
      <button
        type="button"
        data-epis-blank-ring-drag-grip
        className="absolute left-1/2 cursor-grab touch-none select-none active:cursor-grabbing"
        style={{
          top: 0,
          width: Math.min(L.bodyW * 0.85, 200),
          height: L.grip + L.hp,
          transform: "translateX(-50%)",
          background: "transparent",
          border: "none",
          padding: 0,
        }}
        title="拖移分類標籤"
        aria-label="拖移分類標籤"
        onPointerDown={onGripPointerDown}
      />

      <div
        className="absolute overflow-hidden"
        style={{
          ...bodySurface,
          left: L.insetX,
          top: L.grip + L.hp,
          width: L.bodyW,
          height: L.bodyH,
        }}
      >
        {editing ? (
          <textarea
            data-epis-blank-ring-no-drag
            value={draft}
            maxLength={BLANK_LABEL_TEXT_MAX}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              updateBlankStoryRing(ring.id, { text: draft });
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraft(ring.text);
                setEditing(false);
              }
            }}
            className="box-border h-full w-full resize-none border-0 px-3 py-2 text-center font-semibold leading-tight outline-none ring-0 focus:outline-none focus:ring-0"
            style={{
              ...textStyle,
              backgroundColor: "transparent",
              fontSize: L.fontPx,
              borderRadius: L.clipPath ? 0 : L.bodyRadius,
            }}
            spellCheck={false}
            autoFocus
          />
        ) : ring.text ? (
          <div
            className="flex h-full w-full select-none items-center justify-center px-3 py-1.5 text-center font-semibold leading-tight"
            style={{ ...textStyle, fontSize: L.fontPx }}
            data-epis-dblclick-edit
            title="頂端拖移 · 雙擊編輯"
            onMouseDownCapture={(ev) => {
              if (ev.detail >= 2) ev.preventDefault();
            }}
            onDoubleClick={(ev) => {
              ev.stopPropagation();
              setDraft(ring.text);
              setEditing(true);
            }}
          >
            <span className="line-clamp-2 min-w-0 select-none break-all">{ring.text}</span>
          </div>
        ) : (
          <button
            type="button"
            data-epis-blank-ring-no-drag
            className="flex h-full w-full flex-col items-center justify-center gap-0.5 transition"
            style={{ color: ink.color, opacity: 0.72, fontSize: Math.max(12, L.fontPx - 5) }}
            title="點擊輸入分類（如 life、work）"
            aria-label="新增分類文字"
            onClick={(ev) => {
              ev.stopPropagation();
              setEditing(true);
            }}
          >
            <Plus className="opacity-55" style={{ width: 26, height: 26 }} strokeWidth={1.85} />
            <span className="text-[11px] font-semibold tracking-wide opacity-75">分類</span>
          </button>
        )}
        <button
          type="button"
          data-epis-blank-ring-no-drag
          className="absolute right-1 top-1 z-[1] rounded-full p-1 text-white shadow-sm transition hover:scale-105"
          style={{
            background: darkAccent ? "rgba(255,255,255,0.22)" : "rgba(58,63,71,0.38)",
            boxShadow: darkAccent
              ? "0 0 0 1px rgba(255,255,255,0.35), 0 1px 3px rgba(0,0,0,0.2)"
              : "0 1px 3px rgba(0,0,0,0.12)",
          }}
          title="刪除此標籤"
          aria-label="刪除此標籤"
          onClick={(ev) => {
            ev.stopPropagation();
            removeBlankStoryRing(ring.id);
          }}
        >
          <X className="h-3 w-3" strokeWidth={2.5} />
        </button>
      </div>

      <div
        ref={chromeWrapRef}
        className="absolute left-0 right-0 flex items-center justify-center gap-2"
        style={{
          top: L.grip + L.hp + L.bodyH + L.toneGap,
          height: L.toneRowH,
        }}
      >
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            data-epis-blank-ring-no-drag
            aria-expanded={shapeOpen}
            aria-haspopup="listbox"
            aria-label="標籤外形"
            title="標籤外形"
            className="flex h-[22px] w-[34px] shrink-0 items-center justify-center rounded-md border border-[rgba(58,63,71,0.12)] bg-white/90 shadow-sm transition hover:bg-white"
            style={{ borderWidth: "0.5px" }}
            onClick={(ev) => {
              ev.stopPropagation();
              setShapeOpen((o) => !o);
              setToneOpen(false);
            }}
          >
            <ShapeThumb shape={shape} active />
          </button>
          {shapeOpen ? (
            <div
              role="dialog"
              aria-label="選擇標籤外形"
              className="absolute bottom-full left-1/2 z-20 mb-1.5 w-[11.5rem] -translate-x-1/2 rounded-[12px] border border-[rgba(58,63,71,0.1)] bg-white p-2 shadow-[0_12px_40px_-8px_rgba(58,63,71,0.28)]"
              style={{ borderWidth: "0.5px" }}
              onPointerDown={(ev) => ev.stopPropagation()}
            >
              <div className="grid grid-cols-2 gap-1.5">
                {BLANK_RING_LABEL_SHAPES.map((sh) => (
                  <button
                    key={sh}
                    type="button"
                    aria-label={`標籤外形 ${sh}`}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-1.5 py-2 transition ${
                      shape === sh
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]/35"
                        : "border-[rgba(58,63,71,0.08)] hover:bg-[rgba(58,63,71,0.04)]"
                    }`}
                    style={{ borderWidth: "0.5px" }}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      applyLabelShape(sh);
                      setShapeOpen(false);
                    }}
                  >
                    <div className="flex h-9 w-[3.5rem] items-center justify-center">
                      <div style={{ transform: "scale(1.85)", transformOrigin: "center" }}>
                        <ShapeThumb shape={sh} active={shape === sh} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative flex flex-col items-center">
          <button
            type="button"
            data-epis-blank-ring-no-drag
            aria-expanded={toneOpen}
            aria-haspopup="listbox"
            aria-label="底色"
            title="底色"
            className="shrink-0 rounded-full transition hover:opacity-95"
            style={{
              width: Math.min(L.outerW - 2 * L.hp - 42, Math.max(36, L.bodyW * 0.38)),
              height: L.toneH,
              minHeight: 4,
              background: accent,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 0 0 1px rgba(58,63,71,0.18)`,
            }}
            onClick={(ev) => {
              ev.stopPropagation();
              setToneOpen((o) => !o);
              setShapeOpen(false);
            }}
          />
          {toneOpen ? (
            <div
              role="dialog"
              aria-label="選擇底色"
              className="absolute bottom-full left-1/2 z-20 mb-1.5 w-[min(calc(100vw-1.5rem),15.5rem)] max-h-[min(72vh,26rem)] -translate-x-1/2 overflow-y-auto rounded-[12px] border border-[rgba(58,63,71,0.1)] bg-white px-2.5 py-2.5 shadow-[0_12px_40px_-8px_rgba(58,63,71,0.3)]"
              style={{ borderWidth: "0.5px" }}
              onPointerDown={(ev) => ev.stopPropagation()}
            >
              <AccentColorPickerPanel
                value={ring.accentBg ?? IDENTITY_LEAF_BG_PALETTE[0]}
                variant="paper"
                onSelect={(hex) => updateBlankStoryRing(ring.id, { accentBg: hex })}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});

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

const BLANK_DRAG_THRESHOLD_PX = 4;

const BlankDockedBlock = memo(function BlankDockedBlockInner({
  placementId,
}: {
  placementId: PlacementID;
}) {
  const assignPlacementToDowntownSlot = useStore((s) => s.assignPlacementToDowntownSlot);
  const assignPlacementToDowntownBlank = useStore((s) => s.assignPlacementToDowntownBlank);
  const releasePlacementFromDowntown = useStore((s) => s.releasePlacementFromDowntown);
  const sendToMuseeFromPortal = useStore((s) => s.sendToMuseeFromPortal);
  const setDowntownHighlightedSlot = useStore((s) => s.setDowntownHighlightedSlot);
  const setSelectedPlacementId = useStore((s) => s.setSelectedPlacementId);
  const selected = useStore((s) => s.selectedPlacementId === placementId);
  const editingHere = useStore((s) => s.editingPlacementId === placementId);
  const downtownBlankScale = useStore((s) => s.downtownBlankScale);
  const setPlanningDragVisual = useStore((s) => s.setPlanningDragVisual);
  const showingPlanningGhost =
    useStore((s) => s.planningDragVisual?.placementId === placementId && s.planningDragVisual?.kind === "blank");

  const pair = useStore(
    useShallow((s) => {
      const placement = s.placements[placementId];
      if (!placement || placement.parentContainerId !== DOWNTOWN_BLANK_CONTAINER_ID) return null;
      const block = s.blocks[placement.blockId];
      if (!block || block.id in s.musee) return null;
      return { placement, block };
    })
  );

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const motionRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const unbindDragRef = useRef<(() => void) | null>(null);
  const dragGhostSizeRef = useRef({ w: 280, h: 220 });
  const [isDragging, setIsDragging] = useState(false);

  useLayoutEffect(() => {
    if (!dragging.current) {
      x.jump(0);
      y.jump(0);
    }
  }, [pair?.placement.position.x, pair?.placement.position.y, x, y]);

  const handleDragHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!pair) return;
      if (editingHere) return;
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button, a, input, textarea, select")) return;
      e.stopPropagation();
      setSelectedPlacementId(pair.placement.id);

      const placement = pair.placement;
      const w = placement.ui?.width ?? 280;
      const h = placement.ui?.height ?? 220;

      let dragMoved = false;
      const startClient = { x: e.clientX, y: e.clientY };
      let lastClient = { x: e.clientX, y: e.clientY };

      const onMove = (ev: PointerEvent) => {
        const ax = ev.clientX - startClient.x;
        const ay = ev.clientY - startClient.y;
        if (!dragMoved) {
          if (ax * ax + ay * ay < BLANK_DRAG_THRESHOLD_PX * BLANK_DRAG_THRESHOLD_PX) return;
          dragMoved = true;
          lockGlobalTextSelection();
          dragging.current = true;
          setIsDragging(true);
          const br0 = motionRef.current?.getBoundingClientRect();
          if (br0) dragGhostSizeRef.current = { w: br0.width, h: br0.height };
        }
        lastClient = { x: ev.clientX, y: ev.clientY };

        /** 在空白畫布內：以 scale-aware delta 移動 motion value */
        const sc = downtownBlankScale > 1e-6 ? downtownBlankScale : 1;
        x.jump(ax / sc);
        y.jump(ay / sc);

        /** 游標是否在主畫布上：啟動浮層 */
        const overMain = isClientPointOverCanvasSurface(ev.clientX, ev.clientY);
        if (overMain) {
          setPlanningDragVisual({
            placementId: placement.id,
            clientX: ev.clientX,
            clientY: ev.clientY,
            width: dragGhostSizeRef.current.w,
            height: dragGhostSizeRef.current.h,
            kind: "blank",
          });
        } else {
          setPlanningDragVisual(null);
        }

        const idx = findDowntownSlotIndexAtClient(ev.clientX, ev.clientY);
        setDowntownHighlightedSlot(idx);
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
        unlockGlobalTextSelection();

        try {
          if (!dragMoved) return;

          const cx = lastClient.x;
          const cy = lastClient.y;

          /** 優先序：Musée → 主畫布 → 規劃格 slot → 空白畫布 → 回彈 */
          if (isClientPointInsideMuseePortalInner(cx, cy)) {
            sendToMuseeFromPortal(placement.blockId);
            setDowntownHighlightedSlot(null);
            return;
          }

          const canvasEl = document.querySelector("[data-epis-canvas-surface]");
          if (canvasEl instanceof HTMLElement && isClientPointOverCanvasSurface(cx, cy)) {
            const vp = useStore.getState().viewport;
            const wpt = clientToWorldFromCanvasElement(cx, cy, canvasEl, vp);
            releasePlacementFromDowntown(placement.id, wpt.x, wpt.y);
            setDowntownHighlightedSlot(null);
            return;
          }

          const slotHit = findDowntownSlotIndexAndGridAtClient(cx, cy);
          if (slotHit != null) {
            const canvasEl2 = document.querySelector("[data-epis-canvas-surface]");
            let releaseCenter: { x: number; y: number } | undefined;
            if (canvasEl2 instanceof HTMLElement) {
              const vp = useStore.getState().viewport;
              const wpt = clientToWorldFromCanvasElement(cx, cy, canvasEl2, vp);
              releaseCenter = { x: wpt.x, y: wpt.y };
            }
            assignPlacementToDowntownSlot(placement.id, slotHit.index, {
              occupantReleaseWorldCenter: releaseCenter,
              grid: slotHit.grid,
            });
            setDowntownHighlightedSlot(null);
            return;
          }

          const blankVp = document.querySelector("[data-epis-downtown-blank-viewport]");
          if (blankVp instanceof HTMLElement) {
            const vr = blankVp.getBoundingClientRect();
            if (cx >= vr.left && cx <= vr.right && cy >= vr.top && cy <= vr.bottom) {
              const { canvasPosition: pos, downtownBlankScale: sc } = useStore.getState();
              const br = motionRef.current?.getBoundingClientRect();
              const bx = br ? br.left + br.width / 2 : cx;
              const by = br ? br.top + br.height / 2 : cy;
              const pt = clientToDowntownBlankWorld(bx, by, blankVp, pos, sc);
              assignPlacementToDowntownBlank(placement.id, pt.x - w / 2, pt.y - h / 2);
              setDowntownHighlightedSlot(null);
              return;
            }
          }

          setDowntownHighlightedSlot(null);
        } finally {
          dragging.current = false;
          setIsDragging(false);
          x.jump(0);
          y.jump(0);
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
      downtownBlankScale,
      setSelectedPlacementId,
      setPlanningDragVisual,
      sendToMuseeFromPortal,
      releasePlacementFromDowntown,
      assignPlacementToDowntownSlot,
      assignPlacementToDowntownBlank,
      setDowntownHighlightedSlot,
      x,
      y,
    ]
  );

  if (!pair) return null;

  const { placement, block } = pair;
  const model = toRenderBlock(block, placement, "neutral");
  const Cmp = getDistrictComponent(placement.district);
  if (!Cmp) return null;

  const w = placement.ui?.width ?? 280;
  const h = placement.ui?.height ?? 220;

  const dragLiftShadow = "0 20px 40px rgba(0, 0, 0, 0.1)";

  return (
    <motion.div
      ref={motionRef}
      data-epis-block
      className="absolute z-[6] overflow-visible rounded-xl"
      style={{
        left: placement.position.x,
        top: placement.position.y,
        width: w,
        height: h,
        x,
        y,
        willChange: "transform",
        scale: isDragging ? 1.02 : 1,
        opacity: isDragging && showingPlanningGhost ? 0.14 : isDragging ? 0.96 : 1,
        boxShadow: isDragging ? dragLiftShadow : undefined,
        zIndex: isDragging ? 40 : undefined,
        cursor: isDragging ? "grabbing" : undefined,
        transition: isDragging ? "opacity 0.12s ease-out" : "opacity 0.2s ease-out",
      }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        setSelectedPlacementId(placement.id);
        handleDragHandlePointerDown(e);
      }}
      onPointerCancel={() => {
        unbindDragRef.current?.();
        unbindDragRef.current = null;
        unlockGlobalTextSelection();
        setPlanningDragVisual(null);
        dragging.current = false;
        setIsDragging(false);
        setDowntownHighlightedSlot(null);
        x.jump(0);
        y.jump(0);
      }}
    >
      <div
        className="absolute left-0 top-0 z-[18] flex h-10 max-w-[calc(100%-4.75rem)] cursor-grab items-center justify-center rounded-br-md rounded-tl-xl border-b border-r border-[var(--color-stroke)]/18 bg-[#ebe8e2]/95 active:cursor-grabbing"
        title="由此區域拖移積木"
        onPointerDown={handleDragHandlePointerDown}
      >
        <span className="pointer-events-none h-1 w-10 rounded-full bg-[rgba(58,63,71,0.16)]" />
      </div>
      <div
        className="box-border h-full min-h-0 w-full overflow-hidden rounded-xl border border-[var(--color-stroke)]/22 bg-[#faf8f4] pt-10 text-[10px] leading-snug shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
        onPointerDown={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest("button, a, input, textarea, select, [data-epis-block-resize]")) {
            e.stopPropagation();
          }
        }}
      >
        <BlockContent district={placement.district} model={model} Cmp={Cmp} />
      </div>
      <BlockPlacementResizeHandle
        placementId={placement.id}
        visible={selected && !editingHere}
        contentScale={downtownBlankScale}
      />
    </motion.div>
  );
});

/**
 * Downtown 空白模式：滿版感畫布、平移縮放、畫布上圈圈與積木。
 */
export const DowntownBlankWorkspace = memo(function DowntownBlankWorkspaceInner() {
  const url = useStore((s) => s.blankCanvasBgUrl);
  const opacity = useStore((s) => s.blankCanvasBgOpacity);
  const brightness = useStore((s) => s.blankCanvasBgBrightness);
  const canvasPosition = useStore((s) => s.canvasPosition);
  const downtownBlankScale = useStore((s) => s.downtownBlankScale);
  const zoomDowntownBlankAt = useStore((s) => s.zoomDowntownBlankAt);
  const addBlockToDowntownBlank = useStore((s) => s.addBlockToDowntownBlank);
  const blankStoryRings = useStore((s) => s.blankStoryRings);
  const addBlankStoryRing = useStore((s) => s.addBlankStoryRing);
  const [newRingShape, setNewRingShape] = useState<BlankRingLabelShape>("pill");

  const placements = useStore((s) => s.placements);
  const blankIds = useMemo(() => {
    const out: PlacementID[] = [];
    for (const p of Object.values(placements)) {
      if (p.parentContainerId === DOWNTOWN_BLANK_CONTAINER_ID && !p.ui?.hidden) {
        out.push(p.id);
      }
    }
    return out.sort();
  }, [placements]);

  const viewportRef = useRef<HTMLDivElement>(null);
  /** 新增標籤紙列（外形＋加號）：新標籤預設出現在此列下方之畫布世界座標 */
  const blankRingToolbarRef = useRef<HTMLDivElement>(null);
  const worldBoxRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const endFloorPan = useCallback((e: React.PointerEvent) => {
    panRef.current = null;
    setIsPanning(false);
    try {
      const el = e.currentTarget as HTMLElement;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  const onFloorPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as HTMLElement;
      if (t.closest("[data-epis-blank-ring-root], [data-epis-block]")) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setIsPanning(true);
      panRef.current = {
        px: e.clientX,
        py: e.clientY,
        ox: canvasPosition.x,
        oy: canvasPosition.y,
      };
    },
    [canvasPosition.x, canvasPosition.y]
  );

  const onFloorPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const st = panRef.current;
      if (!st) return;
      if ((e.buttons & 1) === 0) {
        panRef.current = null;
        setIsPanning(false);
        return;
      }
      const dx = e.clientX - st.px;
      const dy = e.clientY - st.py;
      useStore.setState({
        canvasPosition: { x: st.ox + dx, y: st.oy + dy },
      });
    },
    []
  );

  const onFloorLostPointerCapture = useCallback(() => {
    panRef.current = null;
    setIsPanning(false);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      if (!el.contains(document.elementFromPoint(ev.clientX, ev.clientY))) return;
      ev.preventDefault();
      const factor = ev.deltaY > 0 ? 0.92 : 1.08;
      const s = useStore.getState();
      zoomDowntownBlankAt(ev.clientX, ev.clientY, el, s.downtownBlankScale * factor);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomDowntownBlankAt]);

  const addAtCenter = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const r = vp.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const { canvasPosition: pos, downtownBlankScale: sc } = useStore.getState();
    const pt = clientToDowntownBlankWorld(cx, cy, vp, pos, sc);
    addBlockToDowntownBlank(pt.x - 140, pt.y - 110);
  }, [addBlockToDowntownBlank]);

  const addBlankStoryRingNearToolbar = useCallback(() => {
    const vp = viewportRef.current;
    const bar = blankRingToolbarRef.current;
    const L = blankLabelLayout(newRingShape);
    const st = useStore.getState();
    let px: number;
    let py: number;
    if (vp && bar) {
      const tr = bar.getBoundingClientRect();
      const cx = tr.left + tr.width / 2;
      const cy = tr.bottom + 44;
      const wpt = clientToDowntownBlankWorld(cx, cy, vp, st.canvasPosition, st.downtownBlankScale);
      const n = st.blankStoryRings.length;
      const staggerX = (n % 5) * 14 - 28;
      const staggerY = Math.floor(n / 5) * 16;
      px = Math.round(wpt.x - L.bodyW / 2 + staggerX);
      py = Math.round(wpt.y + staggerY);
    } else {
      const n = st.blankStoryRings.length;
      const col = n % 5;
      const row = Math.floor(n / 5);
      px = 36 + col * 228;
      py = 36 + row * 112;
    }
    const c = clampLabelBodyPos(L, px, py);
    addBlankStoryRing(newRingShape, { x: c.x, y: c.y });
  }, [addBlankStoryRing, newRingShape]);

  const transformStyle = useMemo(
    () => ({
      transform: `translate3d(${canvasPosition.x}px, ${canvasPosition.y}px, 0) scale(${downtownBlankScale})`,
      transformOrigin: "0 0" as const,
    }),
    [canvasPosition.x, canvasPosition.y, downtownBlankScale]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-stroke)]/25 bg-[var(--color-canvas-bg)]">
      <div
        ref={viewportRef}
        data-epis-downtown-blank-viewport
        className="relative min-h-0 flex-1 cursor-default overflow-hidden rounded-lg bg-[var(--color-canvas-bg)]"
      >
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[var(--color-canvas-bg)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-2 top-2 z-20 flex flex-row items-center gap-2"
          aria-label="空白畫布快捷操作"
        >
          <div
            ref={blankRingToolbarRef}
            className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-[var(--color-stroke)]/35 bg-white/95 py-0.5 pl-0.5 pr-0.5 shadow-sm"
          >
            <BlankWorkspaceAddRingShapePicker value={newRingShape} onChange={setNewRingShape} />
            <button
              type="button"
              title="新增標籤紙"
              aria-label="新增標籤紙"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-epis-ink/75 transition hover:bg-[var(--color-canvas-bg)]"
              onClick={addBlankStoryRingNearToolbar}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            title="新增積木"
            aria-label="新增積木"
            className="pointer-events-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#B0C6F1]/55 bg-white/95 text-[#B0C6F1] shadow-sm transition hover:border-[#B0C6F1] hover:bg-[#B0C6F1]/14 hover:text-[#8FA4DC]"
            onClick={addAtCenter}
          >
            <Box className="h-[17px] w-[17px]" strokeWidth={2.1} aria-hidden />
          </button>
        </div>

        <div
          data-epis-downtown-blank-surface
          className="absolute left-0 top-0 z-[1]"
          style={transformStyle}
        >
          <div
            ref={worldBoxRef}
            data-epis-downtown-blank-world
            className="relative"
            style={{
              width: DOWNTOWN_BLANK_WORLD_W,
              height: DOWNTOWN_BLANK_WORLD_H,
              backgroundColor: "var(--color-canvas-bg)",
            }}
          >
            {url ? (
              <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                  backgroundImage: `url(${url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  opacity,
                  ...(Math.abs(brightness - 1) > 0.003
                    ? { filter: `brightness(${brightness})` }
                    : {}),
                }}
                aria-hidden
              />
            ) : null}
            <div
              data-epis-downtown-blank-floor
              className="absolute inset-0 z-[2] touch-none"
              style={{
                cursor: isPanning ? "grabbing" : "grab",
                backgroundColor: "transparent",
              }}
              onPointerDown={onFloorPointerDown}
              onPointerMove={onFloorPointerMove}
              onPointerUp={endFloorPan}
              onPointerCancel={endFloorPan}
              onLostPointerCapture={onFloorLostPointerCapture}
            />
            {blankStoryRings.map((ring) => (
              <BlankWorkspaceStoryRing key={ring.id} ring={ring} viewportRef={viewportRef} />
            ))}
            {blankIds.map((id) => (
              <BlankDockedBlock key={id} placementId={id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
