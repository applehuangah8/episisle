import { Environment, Float, ContactShadows } from "@react-three/drei";

import { IdeaOreField } from "@/unknown-lab/scene/IdeaOreField";
import { TravelerFigure } from "@/unknown-lab/scene/TravelerFigure";
import type { VacationSceneId } from "@/unknown-lab/state/types";

export function AlchemyBenchScene({ vacationScene }: { vacationScene: VacationSceneId }) {
  const envPreset =
    vacationScene === "v2"
      ? "city"
      : vacationScene === "v3"
        ? "sunset"
        : "apartment";

  return (
    <>
      {/* Keep WebGL background transparent; use CSS painterly background instead. */}
      <ambientLight intensity={0.58} color={"#e7dfd4"} />
      <directionalLight
        position={[2.8, 5.2, 3.4]}
        intensity={1.25}
        color={"#f0d7b7"}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={18}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight position={[-3.2, 2.0, 2.0]} intensity={0.55} color={"#78a7b2"} />
      <pointLight position={[1.2, 0.6, 1.2]} intensity={0.48} color={"#c99a54"} />
      {/* Traveler key light (makes the miniature readable) */}
      <spotLight
        position={[3.6, 2.6, 3.0]}
        angle={0.45}
        penumbra={0.9}
        intensity={0.65}
        color={"#f2ede4"}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <Float speed={0.2} rotationIntensity={0.08} floatIntensity={0.12}>
        <group position={[0, 0, 0]}>
          <IdeaOreField />
          <TravelerFigure vacationScene={vacationScene} />
        </group>
      </Float>

      <ContactShadows
        position={[0, -0.92, 0]}
        opacity={0.35}
        scale={12}
        blur={1.6}
        far={3.6}
        color="#000000"
      />

      <Environment preset={envPreset as never} />
    </>
  );
}

