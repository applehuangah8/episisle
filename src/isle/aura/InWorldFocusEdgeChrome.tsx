import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAppMode } from "@/isle/ModeContext";

import { getResolvedAuraIslandDisplayName } from "./auraIslandMetadata";
import type { AuraIslandId } from "./auraWorldIslandTypes";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";
import { InWorldClearIslandButton } from "./InWorldClearIslandButton";
import { InWorldFocusBackupBar } from "./InWorldFocusBackupBar";

const ease = [0.22, 1, 0.36, 1] as const;

function RailLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative bg-transparent text-[10px] font-medium tracking-wide"
      style={{ color: "rgba(48,58,56,0.72)" }}
    >
      <span className="relative inline-block">
        {children}
        <span className="pointer-events-none absolute -bottom-0.5 left-0 block h-px w-full origin-center scale-x-[0.28] bg-current opacity-45 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-hover:opacity-85" />
      </span>
    </button>
  );
}

/**
 * Bottom-left edge chrome for in-world Focus: backup + mode glyph rail. Keeps top clear for HUD / map.
 */
export function InWorldFocusEdgeChrome() {
  const isEntered = useAuraWorldSelection((s) => s.isEntered);
  const viewMode = useAuraWorldSelection((s) => s.viewMode);
  const entryFlowStage = useAuraWorldSelection((s) => s.entryFlowStage);
  const selectedWorldId = useAuraWorldSelection((s) => s.selectedWorldId);
  const exitFocusToAura = useAuraWorldSelection((s) => s.exitFocusToAura);
  const focusChromeExpanded = useAuraWorldSelection((s) => s.focusChromeExpanded);
  const setFocusChromeExpanded = useAuraWorldSelection((s) => s.setFocusChromeExpanded);
  const resetWorld = useAuraWorldSelection((s) => s.resetWorldEntry);
  const { setMode } = useAppMode();

  const [chromeHot, setChromeHot] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearLeave = useCallback(() => {
    if (leaveTimer.current != null) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }, []);

  const onChromeEnter = useCallback(() => {
    clearLeave();
    setChromeHot(true);
  }, [clearLeave]);

  const onChromeLeave = useCallback(() => {
    clearLeave();
    leaveTimer.current = setTimeout(() => {
      setChromeHot(false);
      setFocusChromeExpanded(false);
    }, 320);
  }, [clearLeave, setFocusChromeExpanded]);

  useEffect(() => () => clearLeave(), [clearLeave]);

  if (!isEntered || viewMode !== "focus" || entryFlowStage !== "ready" || !selectedWorldId) return null;

  const islandId = selectedWorldId as AuraIslandId;
  const worldName = getResolvedAuraIslandDisplayName(islandId);
  const glyph = (worldName.trim().charAt(0) || "◇").toUpperCase();

  const goEntryPath = () => {
    resetWorld();
    setMode("entry");
  };

  const railOpen = focusChromeExpanded;

  return (
    <div
      className="pointer-events-auto absolute bottom-5 left-4 z-[73] flex max-h-[min(70vh,520px)] flex-col items-start gap-2 md:left-5"
      onPointerEnter={onChromeEnter}
      onPointerLeave={onChromeLeave}
    >
      <div className="flex items-center gap-2">
        <InWorldClearIslandButton variant="focus" />
        <InWorldFocusBackupBar />
      </div>

      <motion.p
        className="max-w-[10rem] pl-0.5 text-[9px] font-normal leading-snug"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          letterSpacing: "0.12em",
          color: "rgba(58,68,64,0.36)",
        }}
        animate={{ opacity: chromeHot || focusChromeExpanded ? 0.72 : 0.38 }}
        transition={{ duration: 0.3, ease }}
      >
        {worldName}
      </motion.p>

      <button
        type="button"
        aria-label={`World controls · ${worldName}`}
        aria-expanded={railOpen}
        onClick={() => setFocusChromeExpanded(!focusChromeExpanded)}
        className="flex size-9 items-center justify-center rounded-full border border-white/[0.18] text-[12px] font-medium transition-[transform,filter,background] duration-200 hover:bg-white/[0.14]"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          color: "rgba(48,58,54,0.75)",
          backdropFilter: "blur(12px)",
        }}
      >
        {glyph}
      </button>

      <AnimatePresence>
        {railOpen ? (
          <motion.div
            key="focus-rail"
            className="flex max-w-[16rem] flex-col gap-2 rounded-2xl border border-white/[0.12] px-3 py-2.5"
            style={{
              borderWidth: "0.5px",
              background: "linear-gradient(168deg, rgba(255,252,248,0.34) 0%, rgba(238,244,240,0.22) 100%)",
              backdropFilter: "blur(14px) saturate(1.1)",
            }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.28, ease }}
          >
            <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-1">
              <RailLink onClick={() => exitFocusToAura()}>Aura</RailLink>
              <RailLink onClick={() => resetWorld()}>Return</RailLink>
              <RailLink onClick={goEntryPath}>Entry path</RailLink>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
