import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";

import App from "@/App";

import { AuraFocusEntryConfirm } from "./AuraFocusEntryConfirm";
import { getResolvedAuraIslandDisplayName } from "./auraIslandMetadata";
import type { AuraIslandId } from "./auraWorldIslandTypes";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";
import { AuraWorldHeldCaption } from "./AuraWorldHeldCaption";
import { AuraWorldModePickPanel } from "./AuraWorldModePickPanel";
import { AuraWorldNamingModal } from "./AuraWorldNamingModal";
import { InWorldClearIslandButton } from "./InWorldClearIslandButton";
import { InWorldFocusEdgeChrome } from "./InWorldFocusEdgeChrome";
import { WorldEnteredFocusScope } from "./WorldEnteredFocusScope";
import { useEpisCodexStore } from "@/isle/aura/codex/episCodexStore";

import { WorldFocusPersistBridge } from "./WorldFocusPersistBridge";

const panelEase = [0.22, 1, 0.36, 1] as const;

export function AuraWorldSpatialInterface() {
  const isEntered = useAuraWorldSelection((s) => s.isEntered);
  const entryFlowStage = useAuraWorldSelection((s) => s.entryFlowStage);
  const viewMode = useAuraWorldSelection((s) => s.viewMode);
  const selectedWorldId = useAuraWorldSelection((s) => s.selectedWorldId);
  const resetWorldEntry = useAuraWorldSelection((s) => s.resetWorldEntry);
  const auraPanelCollapsed = useAuraWorldSelection((s) => s.auraPanelCollapsed);
  const setAuraPanelCollapsed = useAuraWorldSelection((s) => s.setAuraPanelCollapsed);
  const showFocusEntryConfirm = useAuraWorldSelection((s) => s.showFocusEntryConfirm);
  const showNamingModal = useAuraWorldSelection((s) => s.showNamingModal);
  useAuraWorldSelection((s) => s.worldMetaById);
  const openCodexForWorld = useEpisCodexStore((s) => s.openCodexForWorld);

  if (!isEntered || !selectedWorldId) return null;

  const entryReady = entryFlowStage === "ready";
  const islandId = selectedWorldId as AuraIslandId;
  const displayName = getResolvedAuraIslandDisplayName(islandId);

  const returnToArchipelago = () => {
    resetWorldEntry();
  };

  return (
    <>
      <AnimatePresence mode="sync">
        {entryFlowStage === "chooseMode" ? <AuraWorldModePickPanel key="mode-pick" /> : null}
      </AnimatePresence>

      {entryReady && viewMode === "aura" ? <AuraWorldHeldCaption /> : null}

      {entryReady && viewMode === "aura" && auraPanelCollapsed ? (
        <motion.button
          type="button"
          aria-label="Show world controls"
          className="pointer-events-auto absolute bottom-6 right-5 z-[70] flex size-11 items-center justify-center rounded-full border border-white/[0.16] text-[11px] font-medium shadow-[0_14px_40px_-18px_rgba(48,62,56,0.35)] transition-[transform,filter] duration-200 hover:brightness-[1.06]"
          style={{
            borderWidth: "0.5px",
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "rgba(48,58,54,0.72)",
            background: "linear-gradient(168deg, rgba(255,252,248,0.42) 0%, rgba(236,242,238,0.3) 100%)",
            backdropFilter: "blur(14px)",
          }}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: panelEase }}
          onClick={() => setAuraPanelCollapsed(false)}
        >
          {(displayName.trim().charAt(0) || "◇").toUpperCase()}
        </motion.button>
      ) : null}

      {entryReady && viewMode === "aura" && !auraPanelCollapsed ? (
        <motion.aside
          role="region"
          aria-label="In-world controls"
          className="pointer-events-auto absolute bottom-6 right-5 z-[70] flex w-[min(17.5rem,calc(100vw-2rem))] flex-col gap-3 md:right-7"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: panelEase, delay: 0.08 }}
          data-aura-world-spatial-panel
        >
          <motion.div
            className="rounded-2xl border border-white/[0.14] px-3 pb-3 pt-2.5 shadow-[0_18px_56px_-20px_rgba(48,62,56,0.28)]"
            style={{
              borderWidth: "0.5px",
              background: "linear-gradient(168deg, rgba(255,252,248,0.38) 0%, rgba(236,242,238,0.26) 100%)",
              backdropFilter: "blur(16px) saturate(1.15)",
            }}
            whileHover={{ filter: "brightness(1.04)", y: -1 }}
            transition={{ duration: 0.22, ease: panelEase }}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <InWorldClearIslandButton variant="aura" />
              <button
                type="button"
                aria-label="Hide panel"
                onClick={() => setAuraPanelCollapsed(true)}
                className="rounded-lg p-1.5 opacity-55 transition-[opacity,background] duration-200 hover:bg-white/[0.1] hover:opacity-90"
                style={{ color: "rgba(62,72,68,0.65)" }}
              >
                <ChevronDown className="size-4" strokeWidth={1.6} aria-hidden />
              </button>
            </div>

            <div
              className="mb-2.5 h-[3.25rem] overflow-hidden rounded-xl border border-white/[0.08]"
              style={{
                background:
                  "linear-gradient(125deg, rgba(210,232,218,0.5) 0%, rgba(244,248,236,0.35) 45%, rgba(228,236,244,0.4) 100%)",
              }}
            >
              <div
                className="flex h-full flex-col items-center justify-center gap-0.5 px-2 text-center"
                style={{ color: "rgba(72,88,92,0.42)" }}
              >
                <span
                  className="text-[12px] font-normal tracking-[0.12em]"
                  style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif" }}
                >
                  {displayName}
                </span>
                <span className="text-[8px] font-medium uppercase tracking-[0.28em] opacity-70">{selectedWorldId}</span>
              </div>
            </div>

            <div className="mt-1 space-y-2">
              <button
                type="button"
                onClick={() => openCodexForWorld(selectedWorldId)}
                className="w-full rounded-lg border border-white/[0.12] py-2 text-[11px] font-medium transition-[background,filter] duration-200 hover:bg-white/[0.12]"
                style={{ color: "rgba(52,62,68,0.72)" }}
              >
                Epis Codex
              </button>
              <p className="text-center text-[9px] leading-relaxed text-[rgba(78,90,96,0.42)]">
                開啟圖鑑編輯典藏；備份與還原請於圖鑑或專注畫面操作
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/[0.08] pt-2.5">
              <span className="text-[9px] uppercase tracking-[0.28em]" style={{ color: "rgba(88,98,104,0.4)" }}>
                Worlds
              </span>
              <button
                type="button"
                onClick={returnToArchipelago}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-[background,filter] duration-200 hover:bg-white/[0.14]"
                style={{ color: "rgba(48,58,64,0.72)" }}
                aria-label="Return to world selection"
              >
                <ArrowLeft className="size-3.5 opacity-70" strokeWidth={1.75} aria-hidden />
                Return
              </button>
            </div>
          </motion.div>
        </motion.aside>
      ) : null}

      <AnimatePresence mode="sync">
        {entryReady && viewMode === "focus" ? (
          <motion.div
            key="in-world-focus"
            data-epis-in-world-focus
            className="absolute inset-0 z-[56] min-h-0 overflow-hidden bg-[var(--color-app-bg)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.48, ease: panelEase }}
          >
            <InWorldFocusEdgeChrome />
            <WorldFocusPersistBridge worldId={selectedWorldId}>
              <WorldEnteredFocusScope worldId={selectedWorldId}>
                <App />
              </WorldEnteredFocusScope>
            </WorldFocusPersistBridge>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="sync">
        {showFocusEntryConfirm ? <AuraFocusEntryConfirm key="focus-confirm" /> : null}
        {showNamingModal ? <AuraWorldNamingModal key="world-naming" /> : null}
      </AnimatePresence>
    </>
  );
}
