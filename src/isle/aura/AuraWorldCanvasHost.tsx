import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import { Suspense } from "react";
import * as THREE from "three";

import { AuraWorldDiorama } from "./AuraWorldDiorama";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

const sceneEase = [0.22, 1, 0.36, 1] as const;

export function AuraWorldCanvasHost() {
  const isEntered = useAuraWorldSelection((s) => s.isEntered);
  const viewMode = useAuraWorldSelection((s) => s.viewMode);
  const hideScene = isEntered && viewMode === "focus";

  return (
    <motion.div
      className="absolute inset-0 z-[1] min-h-0"
      animate={{ opacity: hideScene ? 0 : 1 }}
      transition={{ duration: 0.48, ease: sceneEase }}
      style={{ pointerEvents: hideScene ? "none" : "auto" }}
      data-aura-world-canvas-host
    >
      <Canvas
        orthographic
        shadows
        dpr={[1, 2]}
        onPointerMissed={() => {
          const s = useAuraWorldSelection.getState();
          if (s.isEntering || s.isEntered) return;
          s.clearSelection();
        }}
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
    </motion.div>
  );
}
