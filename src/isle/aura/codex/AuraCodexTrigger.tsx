import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useEffect } from "react";

import { useAuraWorldSelection } from "@/isle/aura/auraWorldSelectionStore";

import { useEpisCodexStore } from "./episCodexStore";

const ease = [0.22, 1, 0.36, 1] as const;

/** Subtle in-scene entry to Epis Codex (Aura explore only). */
export function AuraCodexTrigger() {
  const isEntered = useAuraWorldSelection((s) => s.isEntered);
  const entryFlowStage = useAuraWorldSelection((s) => s.entryFlowStage);
  const viewMode = useAuraWorldSelection((s) => s.viewMode);
  const selectedWorldId = useAuraWorldSelection((s) => s.selectedWorldId);
  const openCodexForWorld = useEpisCodexStore((s) => s.openCodexForWorld);

  useEffect(() => {
    if (!isEntered || !selectedWorldId) return;
    useEpisCodexStore.getState().ensureHydrated(selectedWorldId);
  }, [isEntered, selectedWorldId]);

  if (!isEntered || entryFlowStage !== "ready" || viewMode !== "aura" || !selectedWorldId) {
    return null;
  }

  return (
    <motion.button
      type="button"
      title="Epis Codex"
      aria-label="Open Epis Codex"
      className="pointer-events-auto absolute left-4 top-[4.75rem] z-[85] flex size-11 items-center justify-center rounded-full border border-white/[0.18] shadow-[0_10px_36px_-12px_rgba(42,56,48,0.45)] md:left-6"
      style={{
        borderWidth: "0.5px",
        color: "rgba(52,62,56,0.78)",
        background:
          "linear-gradient(165deg, rgba(255,252,248,0.52) 0%, rgba(236,244,236,0.32) 100%)",
        backdropFilter: "blur(14px) saturate(1.12)",
      }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => openCodexForWorld(selectedWorldId)}
    >
      <BookOpen className="size-[18px] opacity-90" strokeWidth={1.65} aria-hidden />
    </motion.button>
  );
}
