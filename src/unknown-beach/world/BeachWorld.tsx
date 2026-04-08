import { ContactShadows, Sky } from "@react-three/drei";

import { BeachProps } from "@/unknown-beach/world/BeachProps";
import { IslandStage } from "@/unknown-beach/world/IslandStage";
import { MiniTraveler } from "@/unknown-beach/world/MiniTraveler";
import { OceanPlane } from "@/unknown-beach/world/OceanPlane";

export function BeachWorld() {
  return (
    <>
      <ambientLight intensity={0.72} color={"#fff2e6"} />
      <directionalLight position={[3.4, 6.2, 4.8]} intensity={1.05} color={"#ffd7b2"} castShadow />
      <directionalLight position={[-5, 2.6, -2]} intensity={0.35} color={"#4f7f8c"} />

      <Sky sunPosition={[0.8, 0.35, -0.2]} turbidity={7} rayleigh={1.6} mieCoefficient={0.03} mieDirectionalG={0.85} />

      <OceanPlane />
      <IslandStage />

      <BeachProps />

      {/* traveler key light (keeps character readable) */}
      <spotLight
        position={[3.35, 1.55, 3.15]}
        intensity={0.85}
        angle={0.55}
        penumbra={0.75}
        distance={8}
        color={"#fff2e6"}
        castShadow
      />
      <MiniTraveler />

      <ContactShadows position={[0, -0.98, 0]} opacity={0.25} scale={13} blur={1.8} far={3.8} />
    </>
  );
}

