import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";

import { AuraIsleTravelRite } from "@/isle/chrome/AuraIsleTravelRite";

import { AuraIslandHoverScreenOverlay } from "./AuraIslandHoverScreenOverlay";
import { AuraWorldDiorama } from "./AuraWorldDiorama";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

/**
 * Layer 2 — Aura World: full-viewport diorama shell (not a flat UI screen).
 * Warm spring shell (#F1F8E8) + orthographic framing.
 *
 * Soulful glow mask (reference art): (1) large soft mint vignette — transparent center,
 * #F1F8E8 toward edges; (2) top-left pale warm wash (high-key sun-in-mist); (3) corner
 * cool mist via Overlay. All rgba — no solid fills; Screen keeps the map bright and readable.
 */
export function AuraWorldShell() {
  return (
    <div className="relative h-full min-h-0 w-full bg-[#F1F8E8]" data-aura-world-shell>
      {/* Canvas below soulful glow so vignette blends on top; hover overlay is z-[75] above both */}
      <div className="absolute inset-0 z-[1] min-h-0">
        <Canvas
          orthographic
          shadows
          dpr={[1, 2]}
          onPointerMissed={() => useAuraWorldSelection.getState().clearSelection()}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.294,
          }}
          camera={{
            position: [10.85, 8.32, 10.55],
            zoom: 40.6,
            near: 0.1,
            far: 260,
          }}
        >
          <Suspense fallback={null}>
            <AuraWorldDiorama />
          </Suspense>
        </Canvas>
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[2] isolate"
        aria-hidden
        data-aura-soulful-glow
      >
        {/* ① Mint mist vignette: clear bright center → pale #F1F8E8 at periphery (matches ref cool haze) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 158% 142% at 50% 46%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 20%, rgba(241,248,232,0.04) 38%, rgba(241,248,232,0.18) 56%, rgba(241,248,232,0.36) 74%, rgba(241,248,232,0.52) 88%, rgba(241,248,232,0.65) 100%)",
            mixBlendMode: "screen",
          }}
        />
        {/* ② Top-left warm key (ref: soft yellow-white wash from upper-left, still transparent toward center) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 118% 100% at 10% 12%, rgba(255,253,244,0.38) 0%, rgba(255,249,232,0.18) 26%, rgba(255,246,224,0.07) 48%, rgba(255,244,220,0.02) 62%, transparent 76%)",
            mixBlendMode: "screen",
          }}
        />
        {/* ③ Asymmetric cool corners + depth (orbit feels like moving inside mist) */}
        <div
          className="absolute inset-0 opacity-[0.38]"
          style={{
            background: [
              "radial-gradient(ellipse 72% 68% at 90% 86%, rgba(228,242,236,0.34) 0%, rgba(236,248,240,0.12) 42%, transparent 62%)",
              "radial-gradient(ellipse 55% 50% at 6% 78%, rgba(236,244,238,0.14) 0%, transparent 58%)",
              "radial-gradient(ellipse 100% 88% at 58% 52%, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 36%, rgba(241,248,232,0.08) 68%, rgba(241,248,232,0.22) 100%)",
            ].join(", "),
            mixBlendMode: "overlay",
          }}
        />
      </div>
      <AuraIsleTravelRite />
      {/* Screen-space hover callout: above glow + travel chrome (pointer-events none → clicks pass through) */}
      <AuraIslandHoverScreenOverlay />
    </div>
  );
}
