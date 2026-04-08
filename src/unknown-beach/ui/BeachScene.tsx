import { Canvas } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, N8AO, Noise, Vignette } from "@react-three/postprocessing";

import { BeachWorld } from "@/unknown-beach/world/BeachWorld";

export function BeachScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 45, position: [0, 3.4, 7.6], near: 0.1, far: 80 }}
      >
        <BeachWorld />
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={1.2} intensity={1.15} distanceFalloff={1.2} />
          <DepthOfField focusDistance={0.03} focalLength={0.02} bokehScale={1.6} height={480} />
          <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} intensity={0.45} />
          <Noise opacity={0.02} />
          <Vignette eskil={false} offset={0.12} darkness={0.85} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

