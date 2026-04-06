import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useAuraWorldSelection } from "./auraWorldSelectionStore";

/** Brief warm veil + stepped “arrival” — not navigation, not solid UI. */
export function AuraWorldEnterFlash() {
  const isEntered = useAuraWorldSelection((s) => s.isEntered);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!isEntered) {
      setPulse(false);
      return;
    }
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 900);
    return () => window.clearTimeout(t);
  }, [isEntered]);

  return (
    <AnimatePresence>
      {pulse ? (
        <motion.div
          key="aura-enter-veil"
          className="pointer-events-none absolute inset-0 z-[3]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.18, 0.06, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.95, times: [0, 0.22, 0.55, 1], ease: [0.45, 0, 0.2, 1] as const }}
          style={{
            background:
              "radial-gradient(ellipse 92% 78% at 50% 44%, rgba(255,250,242,0.72) 0%, rgba(248,238,228,0.18) 38%, transparent 68%)",
            mixBlendMode: "soft-light",
          }}
          aria-hidden
          data-aura-world-enter-flash
        />
      ) : null}
    </AnimatePresence>
  );
}
