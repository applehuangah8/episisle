import { Canvas } from "@react-three/fiber";

import { AlchemyBenchScene } from "@/unknown-lab/scene/AlchemyBenchScene";
import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";

export function UnknownScene() {
  const vacationScene = useUnknownLabStore((s) => s.vacationScene);

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 48, position: [0, 2.4, 6.2], near: 0.1, far: 60 }}
      >
        <AlchemyBenchScene vacationScene={vacationScene} />
      </Canvas>
    </div>
  );
}

