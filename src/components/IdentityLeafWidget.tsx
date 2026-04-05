import { Plus, X } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";

import { AccentColorPickerPanel } from "@/components/ui/AccentColorPickerPanel";
import { IDENTITY_PLACEMENT_ID } from "@/core/identityBlock";
import { normalizeLeafAccent } from "@/core/accentColor";
import type { IdentityLeaf } from "@/core/types";
import { lockGlobalTextSelection, unlockGlobalTextSelection } from "@/dom/globalTextSelectionLock";
import { useStore } from "@/store/useStore";

const DRAG_THRESHOLD = 5;
const INK = "#3A3F47";

export const IdentityLeafWidget = memo(function IdentityLeafWidgetInner({ leaf }: { leaf: IdentityLeaf }) {
  const viewportScale = useStore((s) => s.viewport.scale);
  const selectedLeafId = useStore((s) => s.selectedIdentityLeafId);
  const setSelectedLeaf = useStore((s) => s.setSelectedIdentityLeafId);
  const setSelectedPlacement = useStore((s) => s.setSelectedPlacementId);
  const updateLeaf = useStore((s) => s.updateIdentityLeaf);
  const removeLeaf = useStore((s) => s.removeIdentityLeaf);

  const [editing, setEditing] = useState(false);
  const [toneOpen, setToneOpen] = useState(false);
  const [draft, setDraft] = useState(leaf.text);
  const fileRef = useRef<HTMLInputElement>(null);
  const toneWrapRef = useRef<HTMLDivElement>(null);
  const unbindRef = useRef<(() => void) | null>(null);

  const selected = selectedLeafId === leaf.id;

  useEffect(() => {
    if (!editing) setDraft(leaf.text);
  }, [editing, leaf.text]);

  useEffect(() => {
    if (editing) setToneOpen(false);
  }, [editing]);

  useEffect(() => {
    if (!toneOpen) return;
    let cancelled = false;
    const onDoc = (e: MouseEvent) => {
      if (toneWrapRef.current?.contains(e.target as Node)) return;
      setToneOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setToneOpen(false);
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
  }, [toneOpen]);

  const commitText = useCallback(() => {
    updateLeaf(leaf.id, { text: draft });
    setEditing(false);
  }, [draft, leaf.id, updateLeaf]);

  const onImageFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f || !f.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          updateLeaf(leaf.id, { imageUrl: reader.result, imagePanX: 0, imagePanY: 0, imageScale: 1 });
        }
      };
      reader.readAsDataURL(f);
    },
    [leaf.id, updateLeaf]
  );

  const onLeafPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as HTMLElement;
      if (
        t.closest(
          "[data-epis-leaf-no-drag], [data-epis-leaf-resize], [data-epis-leaf-image-pan], button, textarea, input"
        )
      )
        return;
      e.stopPropagation();
      unbindRef.current?.();
      setSelectedLeaf(leaf.id);
      setSelectedPlacement(IDENTITY_PLACEMENT_ID);

      const startClient = { x: e.clientX, y: e.clientY };
      const origin = { x: leaf.x, y: leaf.y };
      const sc = viewportScale > 1e-6 ? viewportScale : 1;
      let moved = false;

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startClient.x) / sc;
        const dy = (ev.clientY - startClient.y) / sc;
        if (!moved) {
          if (dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
          moved = true;
          lockGlobalTextSelection();
        }
        updateLeaf(leaf.id, { x: origin.x + dx, y: origin.y + dy });
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        unbindRef.current = null;
      };

      const onUp = () => {
        cleanup();
        unlockGlobalTextSelection();
      };

      unbindRef.current = cleanup;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [
      leaf.id,
      leaf.x,
      leaf.y,
      setSelectedLeaf,
      setSelectedPlacement,
      updateLeaf,
      viewportScale,
    ]
  );

  const onImagePanPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (editing) return;
      const el = e.target as HTMLElement;
      if (el.closest("button, a, [data-epis-leaf-no-drag]")) return;
      e.stopPropagation();
      e.preventDefault();
      unbindRef.current?.();
      setSelectedLeaf(leaf.id);
      const start = { x: e.clientX, y: e.clientY };
      const pan0 = { x: leaf.imagePanX, y: leaf.imagePanY };
      const sc = viewportScale > 1e-6 ? viewportScale : 1;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - start.x) / sc;
        const dy = (ev.clientY - start.y) / sc;
        updateLeaf(leaf.id, { imagePanX: pan0.x + dx, imagePanY: pan0.y + dy });
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        unbindRef.current = null;
      };

      const onUp = () => {
        cleanup();
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      };

      unbindRef.current = cleanup;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [
      editing,
      leaf.id,
      leaf.imagePanX,
      leaf.imagePanY,
      setSelectedLeaf,
      updateLeaf,
      viewportScale,
    ]
  );

  const onImageWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.07 : 0.07;
      updateLeaf(leaf.id, { imageScale: leaf.imageScale + delta });
    },
    [leaf.id, leaf.imageScale, updateLeaf]
  );

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      unbindRef.current?.();
      setSelectedLeaf(leaf.id);

      const startClient = { x: e.clientX, y: e.clientY };
      const startW = leaf.width;
      const startH = leaf.height;
      const sc = viewportScale > 1e-6 ? viewportScale : 1;

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startClient.x) / sc;
        const dy = (ev.clientY - startClient.y) / sc;
        updateLeaf(leaf.id, { width: startW + dx, height: startH + dy });
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
    [leaf.id, leaf.height, leaf.width, setSelectedLeaf, updateLeaf, viewportScale]
  );

  const accent = normalizeLeafAccent(leaf.accentBg);

  return (
    <div
      className="absolute"
      style={{
        left: leaf.x,
        top: leaf.y,
        width: leaf.width,
        height: leaf.height,
        zIndex: selected ? 8 : 3,
      }}
      onPointerDown={onLeafPointerDown}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={onImageFile}
      />
      <div
        className="relative h-full w-full overflow-hidden rounded-xl border transition"
        style={{
          backgroundColor: accent,
          borderColor: INK,
          borderWidth: "1px",
          boxShadow:
            "0 3px 10px -2px rgba(58,63,71,0.22), inset 0 1px 0 rgba(255,255,255,0.35)",
          outline: selected ? `2px solid ${INK}` : "none",
          outlineOffset: selected ? 2 : 0,
        }}
      >
        <div className="flex h-full min-h-0 w-full flex-col px-2 pb-1 pt-1.5">
          {leaf.imageUrl ? (
            <div
              data-epis-leaf-image-pan
              className="relative mb-1 h-[38%] min-h-[22px] w-full shrink-0 cursor-grab overflow-hidden rounded-lg active:cursor-grabbing"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              onPointerDown={onImagePanPointerDown}
              onWheel={onImageWheel}
            >
              <img
                src={leaf.imageUrl}
                alt=""
                draggable={false}
                className="pointer-events-none h-full w-full select-none object-cover"
                style={{
                  transform: `translate(${leaf.imagePanX}px, ${leaf.imagePanY}px) scale(${leaf.imageScale})`,
                  transformOrigin: "center center",
                }}
              />
              <button
                type="button"
                data-epis-leaf-no-drag
                className="absolute right-0 top-0 z-[2] rounded-bl p-0.5"
                style={{ backgroundColor: "rgba(58,63,71,0.45)", color: "#fff" }}
                aria-label="移除葉片圖"
                title="移除圖片"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  updateLeaf(leaf.id, {
                    imageUrl: null,
                    imagePanX: 0,
                    imagePanY: 0,
                    imageScale: 1,
                  });
                }}
              >
                <X className="h-2.5 w-2.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-visible">
            {editing ? (
              <textarea
                data-epis-leaf-no-drag
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitText}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setDraft(leaf.text);
                    setEditing(false);
                  }
                }}
                className="box-border h-full w-full resize-none rounded-md border-0 bg-white/30 px-1.5 py-1 text-left text-[10px] leading-snug outline-none"
                style={{ color: INK, textIndent: 0 }}
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="box-border h-full w-full select-none rounded-md border-0 bg-transparent px-1.5 py-1 text-left text-[10px] leading-snug"
                style={{ color: INK }}
                data-epis-dblclick-edit
                onMouseDownCapture={(ev) => {
                  if (ev.detail >= 2) ev.preventDefault();
                }}
                onDoubleClick={(ev) => {
                  ev.stopPropagation();
                  setDraft(leaf.text);
                  setEditing(true);
                }}
              >
                {leaf.text || "雙擊編輯"}
              </button>
            )}
          </div>
          <div
            className="mt-0.5 flex shrink-0 items-center justify-between gap-1.5"
            data-epis-leaf-no-drag
          >
            <div ref={toneWrapRef} className="relative min-w-0 flex-1 py-px">
              <button
                type="button"
                aria-expanded={toneOpen}
                aria-haspopup="listbox"
                aria-label="底色"
                title="底色"
                className="rounded-full transition hover:opacity-95"
                style={{
                  width: 38,
                  height: 5,
                  minHeight: 4,
                  background: accent,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 0 0 1px rgba(58,63,71,0.2)`,
                }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setToneOpen((o) => !o);
                }}
              />
              {toneOpen ? (
                <div
                  role="dialog"
                  aria-label="選擇底色"
                  className="absolute bottom-full left-0 z-20 mb-1 w-[min(calc(100vw-2rem),15.5rem)] max-h-[min(72vh,26rem)] overflow-y-auto rounded-[12px] border border-[rgba(58,63,71,0.1)] bg-white/[0.98] px-2.5 py-2.5 shadow-[0_12px_40px_-8px_rgba(58,63,71,0.3)] backdrop-blur-md"
                  style={{ borderWidth: "0.5px" }}
                  onPointerDown={(ev) => ev.stopPropagation()}
                >
                  <AccentColorPickerPanel
                    value={leaf.accentBg}
                    variant="card"
                    onSelect={(hex) => updateLeaf(leaf.id, { accentBg: hex })}
                  />
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                data-epis-leaf-no-drag
                className="rounded-md p-0.5 transition hover:bg-black/10"
                style={{ color: INK }}
                title="葉片圖案"
                aria-label="上傳葉片圖"
                onClick={(ev) => {
                  ev.stopPropagation();
                  fileRef.current?.click();
                }}
              >
                <Plus className="h-3 w-3" strokeWidth={2.25} />
              </button>
              <button
                type="button"
                data-epis-leaf-no-drag
                className="rounded p-0.5 transition hover:bg-black/10"
                style={{ color: INK }}
                title="刪除葉片"
                aria-label="刪除葉片"
                onClick={(ev) => {
                  ev.stopPropagation();
                  removeLeaf(leaf.id);
                }}
              >
                <X className="h-3 w-3" strokeWidth={2.2} />
              </button>
            </div>
          </div>
        </div>
      </div>
      {selected ? (
        <div
          data-epis-leaf-resize
          className="pointer-events-auto absolute bottom-0 right-0 z-10 h-4 w-4 cursor-se-resize rounded-tl border"
          style={{ borderColor: INK, backgroundColor: `${accent}ee` }}
          title="縮放葉片"
          aria-label="縮放葉片"
          onPointerDown={onResizePointerDown}
        />
      ) : null}
    </div>
  );
});
