import { motion } from "framer-motion";
import { useId, type ReactNode } from "react";

import { AURA_DIORAMA_BG_URL } from "@/aura/constants";

import "@/aura/styles/auraTokens.css";

type DioramaSceneProps = {
  children: ReactNode;
  sceneLabel?: string;
};

/**
 * Single miniature-world stage: photo background, progressive mature overlay, matte noise.
 * One interactive layer slot for children (centered).
 */
export function DioramaScene({ children, sceneLabel = "Aura diorama" }: DioramaSceneProps) {
  const noiseFilterId = `aura-noise-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div
      className="aura-diorama-root relative flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden px-3 py-4 sm:px-5"
      role="region"
      aria-label={sceneLabel}
    >
      {/* Centered “box” — miniature world frame */}
      <div
        className="relative w-full overflow-hidden rounded-[22px] shadow-[0_24px_64px_-20px_rgba(20,18,16,0.35),0_12px_32px_-16px_rgba(30,26,22,0.2),inset_0_1px_0_rgba(255,252,248,0.12)]"
        style={{
          width: "min(100%, 640px)",
          aspectRatio: "4 / 3",
          maxHeight: "min(78vh, 720px)",
        }}
      >
        {/* Photo layer */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${AURA_DIORAMA_BG_URL}')` }}
        />

        {/* Mature tone: starts clear, eases to subtle darken after the scene settles */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.35, duration: 2.4, ease: [0.22, 0.1, 0.22, 1] }}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
          aria-hidden
        />

        {/* Fine ceramic / matte noise (unfiltered turbulence, low opacity) */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.03]" aria-hidden>
          <filter id={noiseFilterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={4} stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${noiseFilterId})`} />
        </svg>

        {/* Inner vignette for depth (very soft) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: "inset 0 0 80px rgba(20, 18, 16, 0.06)",
          }}
          aria-hidden
        />

        {/* Interactive layer */}
        <div className="relative z-[3] flex h-full w-full items-center justify-center p-6 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
