import { AnimatePresence, motion } from "framer-motion";

import App from "@/App";
import AuraModePrototype from "@/aura";
import { AuraIsleTravelRite } from "@/isle/chrome/AuraIsleTravelRite";
import { FocusIsleTravelHud } from "@/isle/chrome/FocusIsleTravelHud";
import { ModeProvider, useAppMode } from "@/isle/ModeContext";
import { IsleSelector } from "@/isle/selector/IsleSelector";

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
        {mode === "selector" ? (
          <motion.div
            key="isle-selector"
            className="absolute inset-0 min-h-0 overflow-hidden"
            {...worldCrossfade}
          >
            <IsleSelector onChooseFocus={() => setMode("focus")} onChooseAura={() => setMode("aura")} />
          </motion.div>
        ) : null}

        {mode === "focus" ? (
          <motion.div
            key="isle-a-focus"
            className="absolute inset-0 min-h-0 overflow-hidden [background:var(--color-app-bg)]"
            {...worldCrossfade}
          >
            {/**
             * Isle A: `App` 檔案不變；僅由 shell 疊加導航 HUD（與 App 同分支，不寫入 App 內）。
             */}
            <FocusIsleTravelHud />
            <App />
          </motion.div>
        ) : null}

        {mode === "aura" ? (
          <motion.div
            key="isle-b-aura"
            className="absolute inset-0 min-h-0 overflow-hidden"
            {...worldCrossfade}
          >
            <AuraIsleTravelRite />
            <AuraModePrototype />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/**
 * Mode Orchestrator: selector (entry) ↔ Isle A (`App`) ↔ Isle B (`AuraApp` via default export).
 * Exactly one tree mounted; A/B source files remain untouched.
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
