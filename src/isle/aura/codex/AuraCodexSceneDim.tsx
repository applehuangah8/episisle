import { motion } from "framer-motion";

import { useEpisCodexStore } from "./episCodexStore";

const ease = [0.22, 1, 0.36, 1] as const;

/** Soft veil over the 3D stack while Codex is open; does not intercept pointer events. */
export function AuraCodexSceneDim() {
  const active = useEpisCodexStore((s) => Boolean(s.isCodexOpen && s.codexContextWorldId));

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[71]"
      initial={false}
      animate={{
        opacity: active ? 1 : 0,
      }}
      transition={{ duration: active ? 0.85 : 0.55, ease }}
      style={{
        background: "linear-gradient(180deg, rgba(18,26,22,0.14) 0%, rgba(12,18,16,0.22) 100%)",
      }}
    />
  );
}
