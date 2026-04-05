import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";

import { AuraIsleTravelRite } from "@/isle/chrome/AuraIsleTravelRite";

import { AuraWorldDiorama } from "./AuraWorldDiorama";
import { AuraWorldPostFX } from "./AuraWorldPostFX";

/**
 * Layer 2 — Aura World: full-viewport diorama shell (not a flat UI screen).
 * Warm spring shell (#F1F8E8) + orthographic framing; post grain via EffectComposer.
 */
export function AuraWorldShell() {
  return (
    <div className="relative h-full min-h-0 w-full bg-[#F1F8E8]" data-aura-world-shell>
      <div className="absolute inset-0 min-h-0">
        <Canvas
          orthographic
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.98,
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
            <AuraWorldPostFX />
          </Suspense>
        </Canvas>
      </div>
      <AuraIsleTravelRite />
    </div>
  );
}
