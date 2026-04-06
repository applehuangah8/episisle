import { AnimatePresence, motion } from "framer-motion";

import App from "@/App";
import { AuraWorldShell } from "@/isle/aura/AuraWorldShell";
import { FocusIsleTravelHud } from "@/isle/chrome/FocusIsleTravelHud";
import { ModeProvider, useAppMode } from "@/isle/ModeContext";
import { EntryPathSelector } from "@/isle/selector/EntryPathSelector";

/**
 * Exit-only fade: entering modes start at opacity 1.
 * Otherwise `wait` + `initial:{opacity:0}` can leave the next layer stuck invisible
 * (WebGL canvas never gets a reliable first paint): users see only `--color-app-bg`.
 */
const worldCrossfade = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
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
      {/**
       * AnimatePresence `mode="wait"` must receive a single child. Multiple sibling
       * conditionals (`A ? x : null`, `B ? y : null`, ...) count as several children and can
       * leave the shell empty after route/mode changes.
       */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          className="absolute inset-0 min-h-0 overflow-hidden"
          {...worldCrossfade}
        >
          {mode === "entry" ? (
            <EntryPathSelector
              onChooseQuick={() => setMode("worldFocus")}
              onChooseImmersive={() => setMode("auraWorld")}
            />
          ) : null}

          {mode === "worldFocus" ? (
            <>
              {/**
               * Layer 3 path: focusView — existing `App` unchanged; shell-only HUD overlay.
               */}
              <FocusIsleTravelHud />
              <App />
            </>
          ) : null}

          {mode === "auraWorld" ? <AuraWorldShell /> : null}
        </motion.div>
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
