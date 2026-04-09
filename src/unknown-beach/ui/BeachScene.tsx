import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, Noise, Vignette } from "@react-three/postprocessing";

import { BeachWorld } from "@/unknown-beach/world/BeachWorld";

export function BeachScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        shadows
        camera={{ fov: 50, position: [1.5, 7.5, 12], near: 0.1, far: 100 }}
      >
        <BeachWorld />
        <EffectComposer multisampling={4}>
          <N8AO aoRadius={1.6} intensity={1.2} distanceFalloff={1.0} />
          <Bloom luminanceThreshold={0.96} luminanceSmoothing={0.9} intensity={0.06} />
          <Noise opacity={0.010} />
          <Vignette eskil={false} offset={0.22} darkness={0.52} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
