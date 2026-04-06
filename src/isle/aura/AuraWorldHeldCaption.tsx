import { motion } from "framer-motion";

import { getResolvedAuraIslandDisplayName } from "./auraIslandMetadata";
import type { AuraIslandId } from "./auraWorldIslandTypes";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Whispered world title in the lower field while standing in Aura (entered).
 */
export function AuraWorldHeldCaption() {
  const isEntered = useAuraWorldSelection((s) => s.isEntered);
  const viewMode = useAuraWorldSelection((s) => s.viewMode);
  const selectedWorldId = useAuraWorldSelection((s) => s.selectedWorldId);
  useAuraWorldSelection((s) => s.worldMetaById);

  if (!isEntered || viewMode !== "aura" || !selectedWorldId) return null;

  const name = getResolvedAuraIslandDisplayName(selectedWorldId as AuraIslandId);

  return (
    <motion.div
      className="pointer-events-none absolute bottom-[min(14vh,7rem)] left-0 right-0 z-[65] flex justify-center px-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease, delay: 0.2 }}
      aria-hidden
    >
      <p
        className="max-w-xl text-center text-[12px] font-normal tracking-[0.22em]"
        style={{
          fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
          color: "rgba(56,68,62,0.38)",
        }}
      >
        {name}
      </p>
    </motion.div>
  );
}
