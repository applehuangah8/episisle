import { ContactShadows } from "@react-three/drei";

import { BeachProps } from "@/unknown-beach/world/BeachProps";
import { IslandStage } from "@/unknown-beach/world/IslandStage";
import { MiniTraveler } from "@/unknown-beach/world/MiniTraveler";
import { OceanPlane } from "@/unknown-beach/world/OceanPlane";

export function BeachWorld() {
  return (
    <>
      {/* Warm cream ambient */}
      <ambientLight intensity={1.05} color="#f5eee6" />

      {/* Main sun — warm golden afternoon, upper-right */}
      <directionalLight
        position={[6, 11, 5]}
        intensity={1.6}
        color="#f5d898"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={32}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0005}
      />

      {/* Cool fill — from ocean/left, counters harsh sun */}
      <directionalLight position={[-5, 3, -2]} intensity={0.42} color="#7aaec0" />

      {/* Warm rim — low from behind, halo on island edge */}
      <directionalLight position={[-0.5, 1.8, -8]} intensity={0.55} color="#ffaa60" />

      {/* Canvas is alpha:true — body CSS --beach-bg gradient shows through as sky.
           Fog color matches the gradient's mid-lower tone so ocean fades naturally */}
      <fogExp2 attach="fog" args={["#8ab0c8", 0.011]} />

      <OceanPlane />
      <IslandStage />
      <BeachProps />

      {/* Traveler key light — warm, close */}
      <spotLight
        position={[4, 3.5, 3.8]}
        intensity={1.4}
        angle={0.55}
        penumbra={0.82}
        distance={8}
        color="#fff6e0"
        castShadow
        shadow-bias={-0.001}
      />
      <MiniTraveler />

      {/* Contact shadows on island sand surface (y = -0.44) */}
      <ContactShadows position={[0, -0.44, 0]} opacity={0.5} scale={12} blur={2.4} far={1.8} />
    </>
  );
}
