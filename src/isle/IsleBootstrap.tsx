import { AnimatePresence, motion } from "framer-motion";

import App from "@/App";
import { AuraWorldShell } from "@/isle/aura/AuraWorldShell";
import { FocusIsleTravelHud } from "@/isle/chrome/FocusIsleTravelHud";
import { ModeProvider, useAppMode } from "@/isle/ModeContext";
import { EntryPathSelector } from "@/isle/selector/EntryPathSelector";

const worldCrossfade = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.44, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.36, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function ModeTrees() {
  const { mode, setMode } = useAppMode();

  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden [background:var(--color-app-bg)]"
      data-epis-orchestrator-shell
    >
      <AnimatePresence mode="wait">
        {mode === "entry" ? (
          <motion.div
            key="entry-path"
            className="absolute inset-0 min-h-0 overflow-hidden"
            {...worldCrossfade}
          >
            <EntryPathSelector
              onChooseQuick={() => setMode("worldFocus")}
              onChooseImmersive={() => setMode("auraWorld")}
            />
          </motion.div>
        ) : null}

        {mode === "worldFocus" ? (
          <motion.div
            key="world-focus"
            className="absolute inset-0 min-h-0 overflow-hidden [background:var(--color-app-bg)]"
            {...worldCrossfade}
          >
            {/**
             * Layer 3 path: focusView — existing `App` unchanged; shell-only HUD overlay.
             */}
            <FocusIsleTravelHud />
            <App />
          </motion.div>
        ) : null}

        {mode === "auraWorld" ? (
          <motion.div
            key="aura-world"
            className="absolute inset-0 min-h-0 overflow-hidden"
            {...worldCrossfade}
          >
            <AuraWorldShell />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * Experience orchestrator: Entry Path ↔ worldFocus (`App` + focusView) ↔ auraWorld (3D diorama).
 * Exactly one branch mounted at a time.
 */
export function IsleBootstrap() {
  return (
    <div className="h-full min-h-0 w-full">
      <ModeProvider>
        <ModeTrees />
      </ModeProvider>
    </div>
  );
}
