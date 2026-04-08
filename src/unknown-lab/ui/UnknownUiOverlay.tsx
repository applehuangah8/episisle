import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";

type Draft = { text: string; clientX: number; clientY: number } | null;

function isEditableTarget(t: EventTarget | null) {
  const el = t instanceof HTMLElement ? t : null;
  return !!el?.closest("input, textarea, select, [contenteditable=true]");
}

export function UnknownUiOverlay() {
  const [draft, setDraft] = useState<Draft>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const spawnOre = useUnknownLabStore((s) => s.spawnOre);
  const selectedOreIds = useUnknownLabStore((s) => s.selectedOreIds);
  const hoveredOreId = useUnknownLabStore((s) => s.hoveredOreId);
  const ores = useUnknownLabStore((s) => s.ores);

  const focusOreText = useMemo(() => {
    const id = hoveredOreId ?? selectedOreIds[0] ?? null;
    if (!id) return null;
    return ores.find((o) => o.id === id)?.text ?? null;
  }, [hoveredOreId, selectedOreIds, ores]);

  const toWorldXZ = useCallback((clientX: number, clientY: number) => {
    const el = rootRef.current;
    if (!el) return { x: 0, z: 0 };
    const r = el.getBoundingClientRect();
    const nx = (clientX - r.left) / Math.max(1, r.width);
    const ny = (clientY - r.top) / Math.max(1, r.height);
    // simple mapping into desk bounds; refined later with raycast if needed.
    const x = (nx - 0.5) * 9.2;
    const z = (ny - 0.55) * 9.2;
    return { x, z };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        if (draft) {
          setDraft(null);
          return;
        }
      }
      if (isEditableTarget(e.target)) return;
      if (e.key.length !== 1) return;
      setDraft((d) => {
        if (d) return { ...d, text: d.text + e.key };
        const cx = window.innerWidth * 0.5;
        const cy = window.innerHeight * 0.55;
        return { text: e.key, clientX: cx, clientY: cy };
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draft]);

  const commit = useCallback(() => {
    if (!draft?.text.trim()) {
      setDraft(null);
      return;
    }
    const { x, z } = toWorldXZ(draft.clientX, draft.clientY);
    spawnOre({ text: draft.text, x, z });
    setDraft(null);
  }, [draft, spawnOre, toWorldXZ]);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
      <div className="pointer-events-none absolute left-4 top-4 z-[99999]">
        <div className="unknownGlassPanel px-3 py-2 text-[10px] leading-tight text-[var(--unknown-text-muted)]">
          <div className="text-[11px] text-[var(--unknown-text)]">UnknownLab</div>
          <div>{window.location.origin}{window.location.pathname}</div>
          <div>build: {__BUILD_STAMP__}</div>
        </div>
      </div>

      {draft ? (
        <div
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 unknownGlassPanel px-3 py-2 text-[12px] text-[var(--unknown-text)]"
          style={{ left: draft.clientX, top: draft.clientY }}
        >
          <input
            autoFocus
            value={draft.text}
            spellCheck={false}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setDraft(null);
              }
            }}
            className="w-64 bg-transparent outline-none placeholder:text-[var(--unknown-text-muted)]"
            placeholder=""
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--unknown-text-muted)]">
            <span>Enter</span>
            <span>Esc</span>
          </div>
        </div>
      ) : null}

      {focusOreText ? (
        <div className="absolute left-1/2 top-6 -translate-x-1/2 unknownGlassPanel px-4 py-2 text-[12px] text-[var(--unknown-text)]">
          <div className="max-w-[72ch] truncate">
            {focusOreText}
            {selectedOreIds.length >= 2 ? (
              <span className="ml-2 text-[10px] text-[var(--unknown-text-muted)]">
                +{selectedOreIds.length - 1}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Scene switching is handled by VacationSet (Postcards + PassportStamps). */}
    </div>
  );
}

