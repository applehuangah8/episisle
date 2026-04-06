import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Download, Plane, Upload } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  exportQuickFocusBackup,
  importQuickFocusBackup,
} from "@/isle/aura/episIsleWorldBackup";
import { ISLE_DESTINATIONS, SELECTOR_COPY } from "@/isle/chrome/isleDestinations";
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
  const backupInputRef = useRef<HTMLInputElement>(null);
  const backupInputId = useId();
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

  const onQuickExport = useCallback(() => {
    const json = exportQuickFocusBackup();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `epis-quick-focus-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const onQuickImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const r = importQuickFocusBackup(String(reader.result ?? ""));
      if (!r.ok) window.alert(r.error);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, []);

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
              aria-label="切換體驗層或回到主頁"
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
              {ISLE_DESTINATIONS.filter((row) => row.action !== "rePickIsland").map((row) => {
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
                      <span className="inline-flex items-center gap-1 text-[9px] font-medium tracking-wide text-epis-ink/58">
                        <span style={{ color: "#B2D8D8" }} aria-hidden>
                          {"\u2660\uFE0E"}
                        </span>
                        <span>目前在此</span>
                      </span>
                    ) : null}
                  </button>
                );
              })}
              <div className="my-1 h-px bg-[var(--color-stroke)]/12" />
              <p className="px-3 pb-1 pt-1 text-[9px] font-medium uppercase tracking-[0.26em] text-epis-ink/35">
                Quick 專案備份
              </p>
              <input
                id={backupInputId}
                ref={backupInputRef}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={onQuickImportFile}
              />
              <div className="flex gap-1 px-2 pb-2">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--color-panel-border)]/45 bg-[var(--color-glass)]/40 py-2 text-[10px] font-medium text-epis-ink/75 transition hover:bg-[var(--color-glass)]/70"
                  style={{ borderWidth: "0.5px" }}
                  onClick={onQuickExport}
                >
                  <Download className="size-3 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                  匯出
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--color-panel-border)]/45 bg-[var(--color-glass)]/40 py-2 text-[10px] font-medium text-epis-ink/75 transition hover:bg-[var(--color-glass)]/70"
                  style={{ borderWidth: "0.5px" }}
                  onClick={() => backupInputRef.current?.click()}
                >
                  <Upload className="size-3 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                  還原
                </button>
              </div>
              <div className="my-1 h-px bg-[var(--color-stroke)]/12" />
              <button
                type="button"
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left transition hover:bg-[var(--color-glass)]/80"
                onClick={() => go("entry")}
              >
                <span className="text-[12px] font-medium text-epis-ink/82">{SELECTOR_COPY.title}</span>
                <span className="text-[10px] text-epis-ink/45">{SELECTOR_COPY.subtitle}</span>
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
