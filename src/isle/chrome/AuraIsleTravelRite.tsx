import { AnimatePresence, motion } from "framer-motion";
import { Orbit } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ENTRY_PATH_COPY, EXPERIENCE_DESTINATIONS } from "@/isle/chrome/isleDestinations";
import { useAppMode } from "@/isle/ModeContext";
import type { AppMode } from "@/isle/types";

/**
 * Aura 側導航：儀式感面板（orchestrator 疊加，不修改 AuraApp 內場景邏輯）。
 * CONTRACT：僅 `useAppMode`，不 import `@/aura` 內部元件。
 */
export function AuraIsleTravelRite() {
  const { mode, setMode } = useAppMode();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

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
      className="pointer-events-none absolute right-5 top-4 z-[60] md:right-6"
      data-epis-aura-travel-rite
    >
      <div className="pointer-events-auto relative">
        <motion.button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={panelId}
          title="時空機"
          className="group relative flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.1] text-[rgba(232,228,240,0.85)] shadow-[0_0_0_1px_rgba(255,252,248,0.04),0_12px_40px_-8px_rgba(0,0,0,0.5)] backdrop-blur-md transition"
          style={{
            background:
              "radial-gradient(circle at 35% 28%, rgba(200,190,230,0.18) 0%, transparent 55%), rgba(22,20,32,0.55)",
            borderWidth: "0.5px",
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setOpen((o) => !o)}
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition group-hover:opacity-100"
            style={{
              boxShadow: "inset 0 0 24px rgba(188,176,220,0.12)",
            }}
          />
          <Orbit className="h-[18px] w-[18px] opacity-88" strokeWidth={1.75} aria-hidden />
        </motion.button>

        <AnimatePresence>
          {open ? (
            <motion.div
              id={panelId}
              role="dialog"
              aria-label="時空機 · 航線"
              initial={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-[calc(100%+10px)] w-[min(calc(100vw-2.5rem),280px)] overflow-hidden rounded-2xl border border-white/[0.08] shadow-[0_28px_80px_-20px_rgba(0,0,0,0.65)]"
              style={{
                borderWidth: "0.5px",
                background:
                  "linear-gradient(165deg, rgba(32,30,44,0.92) 0%, rgba(18,16,26,0.96) 100%)",
                backdropFilter: "blur(14px)",
              }}
            >
              <div
                className="border-b border-white/[0.06] px-4 py-3"
                style={{ borderBottomWidth: "0.5px" }}
              >
                <p
                  className="text-[10px] font-medium uppercase tracking-[0.42em]"
                  style={{ color: "rgba(200,196,218,0.38)" }}
                >
                  時空機
                </p>
                <p
                  className="mt-1 font-serif text-[15px] font-normal tracking-wide"
                  style={{
                    fontFamily: "var(--epis-font-district), Georgia, serif",
                    color: "rgba(245,240,252,0.9)",
                  }}
                >
                  航線
                </p>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "rgba(200,196,210,0.42)" }}>
                  選一條路徑，或自地圖重新出發。
                </p>
              </div>

              <div className="px-2 py-2">
                {EXPERIENCE_DESTINATIONS.map((row) => {
                  const here = row.mode != null && row.mode === current;
                  const can = row.mode != null;
                  return (
                    <button
                      key={row.key}
                      type="button"
                      disabled={!can}
                      className={`mb-1 w-full rounded-xl border px-3 py-3 text-left transition last:mb-0 ${
                        !can
                          ? "cursor-not-allowed border-white/[0.04] opacity-35"
                          : here
                            ? "border-[rgba(188,176,220,0.22)] bg-[rgba(120,100,160,0.12)]"
                            : "border-transparent hover:border-white/[0.08] hover:bg-white/[0.04]"
                      }`}
                      style={{ borderWidth: "0.5px" }}
                      onClick={() => can && row.mode && go(row.mode)}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className="font-serif text-[13px]"
                          style={{
                            fontFamily: "var(--epis-font-district), Georgia, serif",
                            color: "rgba(238,232,252,0.9)",
                          }}
                        >
                          {row.title}
                        </span>
                        {here ? (
                          <span
                            className="inline-flex shrink-0 items-center gap-1 text-[9px] tracking-widest"
                            style={{ color: "rgba(200,180,220,0.55)" }}
                          >
                            <span style={{ color: "#B2D8D8" }} aria-hidden>
                              {"\u2660\uFE0E"}
                            </span>
                            <span>you are here</span>
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[10px] leading-snug" style={{ color: "rgba(190,186,205,0.45)" }}>
                        {row.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-white/[0.06] px-2 pb-2 pt-1" style={{ borderTopWidth: "0.5px" }}>
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/[0.1] px-3 py-3 text-left transition hover:bg-[rgba(255,252,248,0.04)]"
                  style={{ borderWidth: "0.5px" }}
                  onClick={() => go("entry")}
                >
                  <span
                    className="font-serif text-[13px]"
                    style={{
                      fontFamily: "var(--epis-font-district), Georgia, serif",
                      color: "rgba(232,226,244,0.88)",
                    }}
                  >
                    {ENTRY_PATH_COPY.title}
                  </span>
                  <p className="mt-1 text-[10px]" style={{ color: "rgba(180,176,198,0.48)" }}>
                    {ENTRY_PATH_COPY.subtitle}
                  </p>
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
