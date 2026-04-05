import { useMotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight, GripVertical, ImagePlus, Leaf, Plus, X } from "lucide-react";
import { memo, useCallback, useLayoutEffect, useRef, useState, type ChangeEvent } from "react";

import { useCanvasWorldOptional } from "@/canvas/CanvasWorldContext";
import { clientToWorldFromCanvasElement } from "@/canvas/viewportMath";
import { BlockPlacementResizeHandle } from "@/components/BlockPlacementResizeHandle";
import { IdentityLeafWidget } from "@/components/IdentityLeafWidget";
import { IDENTITY_PLACEMENT_ID } from "@/core/identityBlock";
import { lockGlobalTextSelection, unlockGlobalTextSelection } from "@/dom/globalTextSelectionLock";
import { useStore } from "@/store/useStore";

const DRAG_THRESHOLD_PX = 6;

type IdentityEditField = "title" | "bio" | null;

export const IdentityBlock = memo(function IdentityBlockInner() {
  const projectTitle = useStore((s) => s.projectTitle);
  const setProjectTitle = useStore((s) => s.setProjectTitle);
  const identityBio = useStore((s) => s.identityBio);
  const setIdentityBio = useStore((s) => s.setIdentityBio);
  const identityStickerUrl = useStore((s) => s.identityStickerUrl);
  const setIdentityStickerUrl = useStore((s) => s.setIdentityStickerUrl);
  const identityLeaves = useStore((s) => s.identityLeaves);
  const addIdentityLeaf = useStore((s) => s.addIdentityLeaf);
  const identityCardCollapsed = useStore((s) => s.identityCardCollapsed);
  const setIdentityCardCollapsed = useStore((s) => s.setIdentityCardCollapsed);
  const setSelectedIdentityLeafId = useStore((s) => s.setSelectedIdentityLeafId);
  const setSelectedPlacementId = useStore((s) => s.setSelectedPlacementId);
  const setEditingPlacementId = useStore((s) => s.setEditingPlacementId);
  const updateBlockPosition = useStore((s) => s.updateBlockPosition);
  const placement = useStore((s) => s.placements[IDENTITY_PLACEMENT_ID]);
  const viewportScale = useStore((s) => s.viewport.scale);
  const spacePanHeldRef = useCanvasWorldOptional()?.spacePanHeldRef;

  const editingHere = useStore((s) => s.editingPlacementId === IDENTITY_PLACEMENT_ID);
  const selected = useStore((s) => s.selectedPlacementId === IDENTITY_PLACEMENT_ID);

  const [editField, setEditField] = useState<IdentityEditField>(null);
  const [titleDraft, setTitleDraft] = useState(projectTitle);
  const [bioDraft, setBioDraft] = useState(identityBio);
  const [dragging, setDragging] = useState(false);

  const x = useMotionValue(placement?.position.x ?? 24);
  const y = useMotionValue(placement?.position.y ?? 24);
  const placementRef = useRef(placement ?? null);
  const unbindDragRef = useRef<(() => void) | null>(null);
  const dragGrabRef = useRef<{ x: number; y: number } | null>(null);
  const dragCanvasElRef = useRef<HTMLElement | null>(null);
  const scaleRef = useRef(viewportScale);
  scaleRef.current = viewportScale;
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const rootElRef = useRef<HTMLDivElement>(null);

  const wFull = placement?.ui?.width ?? 300;
  const h = placement?.ui?.height ?? 168;
  const collapsed = identityCardCollapsed;
  const w = collapsed ? 36 : wFull;

  useLayoutEffect(() => {
    if (placement) placementRef.current = placement;
  }, [placement]);

  useLayoutEffect(() => {
    if (!placement) return;
    if (!editingHere && !dragging) {
      x.set(placement.position.x);
      y.set(placement.position.y);
    }
  }, [placement, placement?.position.x, placement?.position.y, editingHere, dragging, x, y]);

  useLayoutEffect(() => {
    const el = rootElRef.current;
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

  useLayoutEffect(() => {
    if (!editingHere) {
      setEditField(null);
      setTitleDraft(projectTitle);
      setBioDraft(identityBio);
    }
  }, [projectTitle, identityBio, editingHere]);

  useLayoutEffect(() => {
    if (!editingHere || !editField) return;
    requestAnimationFrame(() => {
      if (editField === "title") {
        const el = titleInputRef.current;
        if (el) {
          el.focus();
          el.select();
        }
      } else {
        bioTextareaRef.current?.focus();
      }
    });
  }, [editField, editingHere]);

  const beginEditTitle = useCallback(() => {
    setTitleDraft(projectTitle);
    setEditField("title");
    setEditingPlacementId(IDENTITY_PLACEMENT_ID);
    setSelectedPlacementId(IDENTITY_PLACEMENT_ID);
  }, [projectTitle, setEditingPlacementId, setSelectedPlacementId]);

  const beginEditBio = useCallback(() => {
    setBioDraft(identityBio);
    setEditField("bio");
    setEditingPlacementId(IDENTITY_PLACEMENT_ID);
    setSelectedPlacementId(IDENTITY_PLACEMENT_ID);
  }, [identityBio, setEditingPlacementId, setSelectedPlacementId]);

  const commitTitle = useCallback(() => {
    const t = titleDraft.trim();
    setProjectTitle(t.length > 0 ? t.slice(0, 160) : "User Isle");
    setEditField(null);
    setEditingPlacementId(null);
  }, [titleDraft, setProjectTitle, setEditingPlacementId]);

  const commitBio = useCallback(() => {
    setIdentityBio(bioDraft);
    setEditField(null);
    setEditingPlacementId(null);
  }, [bioDraft, setIdentityBio, setEditingPlacementId]);

  const onStickerFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f || !f.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") setIdentityStickerUrl(reader.result);
      };
      reader.readAsDataURL(f);
      e.target.value = "";
    },
    [setIdentityStickerUrl]
  );

  const handleDragHandlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (spacePanHeldRef?.current) return;
      if (editingHere) return;
      if (e.button !== 0) return;
      e.stopPropagation();
      unbindDragRef.current?.();
      unbindDragRef.current = null;
      setSelectedPlacementId(IDENTITY_PLACEMENT_ID);

      let dragMoved = false;
      const startClient = { x: e.clientX, y: e.clientY };
      let lastClient = { x: e.clientX, y: e.clientY };
      dragGrabRef.current = null;
      dragCanvasElRef.current = null;

      const onMove = (ev: PointerEvent) => {
        const ax = ev.clientX - startClient.x;
        const ay = ev.clientY - startClient.y;
        if (!dragMoved) {
          if (ax * ax + ay * ay < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
          dragMoved = true;
          lockGlobalTextSelection();
          setDragging(true);
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
          x.set(x.get() + (ev.clientX - prevLX) / s);
          y.set(y.get() + (ev.clientY - prevLY) / s);
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
        const moved = dragMoved;
        try {
          if (!moved) return;
          const cSnap =
            dragCanvasElRef.current ??
            (document.querySelector("[data-epis-canvas-surface]") as HTMLElement | null);
          const grab = dragGrabRef.current;
          if (cSnap instanceof HTMLElement && grab) {
            const vp = useStore.getState().viewport;
            const wpt = clientToWorldFromCanvasElement(lastClient.x, lastClient.y, cSnap, vp);
            x.set(wpt.x - grab.x);
            y.set(wpt.y - grab.y);
          }
          updateBlockPosition(IDENTITY_PLACEMENT_ID, x.get(), y.get());
          const placed = useStore.getState().placements[IDENTITY_PLACEMENT_ID];
          if (placed) {
            x.set(placed.position.x);
            y.set(placed.position.y);
          }
        } finally {
          if (moved) setDragging(false);
          unlockGlobalTextSelection();
        }
      };

      unbindDragRef.current = cleanup;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [editingHere, setSelectedPlacementId, spacePanHeldRef, x, y, updateBlockPosition]
  );

  if (!placement || placement.id !== IDENTITY_PLACEMENT_ID) return null;

  const editingTitle = editingHere && editField === "title";
  const editingBio = editingHere && editField === "bio";

  return (
    <div
      ref={rootElRef}
      data-epis-block
      data-epis-identity-block
      className={`absolute select-none overflow-visible ${
        selected ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-transparent" : ""
      }`}
      style={{
        width: w,
        height: h,
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: dragging ? 320 : 280,
        willChange: "transform",
      }}
      onPointerCancel={() => {
        unbindDragRef.current?.();
        unbindDragRef.current = null;
        unlockGlobalTextSelection();
        setDragging(false);
        const p = placementRef.current;
        if (p) {
          x.set(p.position.x);
          y.set(p.position.y);
        }
      }}
    >
      <div
        className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border-[0.5px] border-[#c9b896]/55 shadow-[0_10px_28px_rgba(88,72,56,0.12),inset_0_1px_0_rgba(255,255,255,0.65)]"
        style={{
          background:
            "linear-gradient(165deg, #f7f2e4 0%, #ebe4d4 38%, #e2dcc8 72%, #d8d2bc 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `radial-gradient(circle at 18% 22%, #7cb8a8 0%, transparent 42%),
              radial-gradient(circle at 88% 8%, #f0c9a8 0%, transparent 38%),
              radial-gradient(circle at 72% 92%, #a8c4e8 0%, transparent 45%)`,
          }}
        />
        <div className="relative flex min-h-0 flex-1 flex-row">
          <input
            ref={stickerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden
            onChange={onStickerFile}
          />
          <div
            className={`flex w-9 shrink-0 flex-col self-stretch border-r border-[#c9b896]/40 bg-[#f3ead8]/90 ${
              dragging ? "bg-[#ebe2cc]" : ""
            }`}
          >
            <button
              type="button"
              data-epis-identity-drag-handle
              aria-label="拖移 User Isle 卡片"
              title="拖移"
              className="flex min-h-0 flex-1 cursor-grab flex-col items-center justify-center gap-0.5 active:cursor-grabbing"
              onPointerDown={handleDragHandlePointerDown}
            >
              <GripVertical className="h-4 w-4 text-[#8a7a62]/55" strokeWidth={2} />
              <Leaf className="h-3 w-3 text-[#6a9a88]/55" strokeWidth={2} />
            </button>
            {collapsed ? (
              <button
                type="button"
                data-epis-identity-collapse-toggle
                className="shrink-0 rounded-b-[18px] py-1 text-[#8a7a62]/80 transition hover:bg-black/5 hover:text-[#5c5348]"
                title="展開身分卡"
                aria-label="展開身分卡"
                onClick={() => setIdentityCardCollapsed(false)}
                onPointerDown={(ev) => ev.stopPropagation()}
              >
                <ChevronRight className="mx-auto h-4 w-4" strokeWidth={2} />
              </button>
            ) : (
              <button
                type="button"
                data-epis-identity-collapse-toggle
                className="shrink-0 rounded-b-[18px] py-1 text-[#8a7a62]/80 transition hover:bg-black/5 hover:text-[#5c5348]"
                title="收合（僅保留此欄）"
                aria-label="收合身分卡主體"
                onClick={() => {
                  setIdentityCardCollapsed(true);
                  setEditField(null);
                  setEditingPlacementId(null);
                }}
                onPointerDown={(ev) => ev.stopPropagation()}
              >
                <ChevronLeft className="mx-auto h-4 w-4" strokeWidth={2} />
              </button>
            )}
          </div>

          {collapsed ? null : (
          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-2.5"
            onPointerDown={(e) => {
              if (
                (e.target as HTMLElement).closest(
                  "[data-epis-identity-drag-handle], [data-epis-identity-sticker-btn], [data-epis-block-resize], [data-epis-identity-add-leaf], [data-epis-identity-leaf-garden]"
                )
              )
                return;
              if (editingHere) return;
              setSelectedPlacementId(IDENTITY_PLACEMENT_ID);
              setSelectedIdentityLeafId(null);
            }}
          >
            <div className="mb-2 flex shrink-0 items-start gap-2">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[#c9b896]/55 bg-[#f3ead8]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                {identityStickerUrl ? (
                  <>
                    <img
                      src={identityStickerUrl}
                      alt="小島貼圖"
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                    <button
                      type="button"
                      data-epis-identity-sticker-btn
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/35 p-0.5 text-white backdrop-blur-sm transition hover:bg-black/50"
                      title="移除貼圖"
                      aria-label="移除貼圖"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setIdentityStickerUrl(null);
                      }}
                    >
                      <X className="h-3 w-3" strokeWidth={2.5} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    data-epis-identity-sticker-btn
                    className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-[#8a7c68]/70 transition hover:bg-[#ebe4d4]/90 hover:text-[#5c5348]"
                    title="上傳貼圖／頭像"
                    aria-label="上傳貼圖"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      stickerInputRef.current?.click();
                    }}
                  >
                    <ImagePlus className="h-6 w-6" strokeWidth={1.6} />
                    <span className="px-1 text-center text-[8px] font-medium leading-tight">貼圖</span>
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="select-none text-[9px] font-semibold uppercase tracking-[0.14em] text-[#7a6c58]/55">
                    我的小島
                  </span>
                </div>

                {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                  }
                  if (e.key === "Escape") {
                    setTitleDraft(useStore.getState().projectTitle);
                    setEditField(null);
                    setEditingPlacementId(null);
                  }
                }}
                className="mb-1.5 w-full border-0 bg-transparent p-0 text-[17px] font-bold leading-tight tracking-wide text-[#4a4236] outline-none ring-0"
                style={{ fontFamily: "var(--font-sans, ui-rounded, system-ui)" }}
                aria-label="島嶼名稱"
                maxLength={160}
              />
            ) : (
              <button
                type="button"
                className="mb-1.5 w-full select-none border-0 bg-transparent p-0 text-left text-[17px] font-bold leading-tight tracking-wide text-[#4a4236] outline-none transition hover:text-[#3d362c]"
                style={{ fontFamily: "var(--font-sans, ui-rounded, system-ui)" }}
                onMouseDownCapture={(e) => {
                  if (e.detail >= 2) e.preventDefault();
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  beginEditTitle();
                }}
              >
                {projectTitle || "User Isle"}
              </button>
            )}

                <p className="mb-1 select-none text-[10px] leading-snug text-[#8a7c68]/75">
                  社群與近況總覽 · 雙擊標題或下方文字即可編輯
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {editingBio ? (
                <textarea
                  ref={bioTextareaRef}
                  value={bioDraft}
                  onChange={(e) => setBioDraft(e.target.value)}
                  onBlur={commitBio}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setBioDraft(useStore.getState().identityBio);
                      setEditField(null);
                      setEditingPlacementId(null);
                    }
                  }}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#c9b896]/45 bg-white/55 px-2.5 py-2 text-[12px] leading-relaxed text-[#5c5348] outline-none ring-0 focus:border-[#8ab89a]/70 focus:bg-white/75"
                  aria-label="簡介與社群總覽"
                />
              ) : (
                <button
                  type="button"
                  className="w-full select-none rounded-xl border border-transparent bg-white/35 px-2.5 py-2 text-left text-[12px] leading-relaxed text-[#5c5348]/90 transition hover:border-[#c9b896]/35 hover:bg-white/50"
                  onMouseDownCapture={(e) => {
                    if (e.detail >= 2) e.preventDefault();
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    beginEditBio();
                  }}
                >
                  {identityBio.trim() ? (
                    <span className="whitespace-pre-wrap">{identityBio}</span>
                  ) : (
                    <span className="italic text-[#8a7c68]/65">
                      在這裡寫下你的島嶼宣言、常用平台或今日心情…
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-[#c9b896]/40 pt-2">
              <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
                <span className="select-none text-[9px] font-semibold uppercase tracking-[0.12em] text-[#7a6c58]/55">
                  葉片備忘
                </span>
                <button
                  type="button"
                  data-epis-identity-add-leaf
                  className="flex items-center gap-0.5 rounded-lg border border-[#a8c4a8]/55 bg-[#f0f7f2]/80 px-2 py-0.5 text-[10px] font-medium text-[#4a6b52] transition hover:bg-[#e2efe4]"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    addIdentityLeaf();
                    setSelectedPlacementId(IDENTITY_PLACEMENT_ID);
                  }}
                >
                  <Plus className="h-3 w-3" strokeWidth={2} />
                  加葉子
                </button>
              </div>
              <div
                data-epis-identity-leaf-garden
                className="relative min-h-[96px] flex-1 rounded-xl border border-[#c9d9c4]/35 bg-[#f2efe8]/40"
                onPointerDown={(e) => {
                  if (e.target === e.currentTarget) {
                    e.stopPropagation();
                    setSelectedIdentityLeafId(null);
                    setSelectedPlacementId(IDENTITY_PLACEMENT_ID);
                  }
                }}
              >
                {identityLeaves.map((leaf) => (
                  <IdentityLeafWidget key={leaf.id} leaf={leaf} />
                ))}
              </div>
            </div>
          </div>
          )}
        </div>
        <BlockPlacementResizeHandle
          placementId={IDENTITY_PLACEMENT_ID}
          visible={selected && !editingHere && !collapsed}
          contentScale={viewportScale}
        />
      </div>
    </div>
  );
});
