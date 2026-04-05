import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plane } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ENTRY_PATH_COPY, EXPERIENCE_DESTINATIONS } from "@/isle/chrome/isleDestinations";
import { useAppMode } from "@/isle/ModeContext";
import type { AppMode } from "@/isle/types";

/**
 * CONTRACT (Multi-Isle shell)
 * - Only under `IsleBootstrap` when `mode === "focus"`.
 * - No imports from `@/App`, `@/components/*`, `@/store/*`.
 */
export function FocusIsleTravelHud() {
  const { mode, setMode } = useAppMode();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const go = useCallback(
    (next: AppMode) => {
      setMode(next);
      close();
    },
    [setMode, close]
  );

  const current: AppMode = mode;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute left-4 top-[4.75rem] z-[10050] md:left-6"
      data-epis-isle-travel-hud
    >
      <div className="pointer-events-auto relative">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-[var(--color-panel-border)]/55 bg-white/78 py-1.5 pl-2.5 pr-2 text-epis-ink/75 shadow-sm backdrop-blur-md transition hover:bg-white/92 hover:text-epis-ink/90"
          style={{ borderWidth: "0.5px" }}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={menuId}
          title="體驗路徑"
          onClick={() => setOpen((o) => !o)}
        >
          <Plane className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
          <span className="text-[11px] font-medium tracking-wide">航線</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 opacity-45 transition ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
            aria-hidden
          />
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              id={menuId}
              role="listbox"
              aria-label="切換體驗層或返回起點"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 top-[calc(100%+6px)] min-w-[220px] overflow-hidden rounded-xl border border-[var(--color-panel-border)]/50 bg-white/92 py-1 shadow-lg backdrop-blur-md"
              style={{ borderWidth: "0.5px" }}
            >
              <p className="px-3 pb-1 pt-2 text-[9px] font-medium uppercase tracking-[0.28em] text-epis-ink/38">
                路徑
              </p>
              {EXPERIENCE_DESTINATIONS.map((row) => {
                const here = row.mode != null && row.mode === current;
                const can = row.mode != null;
                return (
                  <button
                    key={row.key}
                    type="button"
                    role="option"
                    aria-selected={here}
                    disabled={!can}
                    className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition ${
                      !can
                        ? "cursor-not-allowed opacity-38"
                        : here
                          ? "bg-[var(--color-accent-soft)]/35"
                          : "hover:bg-[var(--color-glass)]/80"
                    }`}
                    onClick={() => can && row.mode && go(row.mode)}
                  >
                    <span className="text-[12px] font-medium text-epis-ink/88">{row.title}</span>
                    <span className="text-[10px] text-epis-ink/48">{row.subtitle}</span>
                    {here ? (
                      <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-accent)]/90">
                        目前所在
                      </span>
                    ) : null}
                  </button>
                );
              })}
              <div className="my-1 h-px bg-[var(--color-stroke)]/12" />
              <button
                type="button"
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition hover:bg-[var(--color-glass)]/80"
                onClick={() => go("entry")}
              >
                <span className="text-[12px] font-medium text-epis-ink/82">{ENTRY_PATH_COPY.title}</span>
                <span className="text-[10px] text-epis-ink/45">{ENTRY_PATH_COPY.subtitle}</span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
