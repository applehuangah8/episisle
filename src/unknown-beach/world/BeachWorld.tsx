import { ContactShadows } from "@react-three/drei";

import { BeachProps } from "@/unknown-beach/world/BeachProps";
import { IslandStage } from "@/unknown-beach/world/IslandStage";
import { MiniTraveler } from "@/unknown-beach/world/MiniTraveler";
import { OceanPlane } from "@/unknown-beach/world/OceanPlane";

export function BeachWorld() {
  return (
    <>
      {/* Ambient — lowered for more contrast (bright tops, shadowed sides) */}
      <ambientLight intensity={0.75} color="#f0e8dc" />

      {/* Main sun — strong warm golden afternoon, upper-right */}
      <directionalLight
        position={[6, 12, 5]}
        intensity={2.2}
        color="#f8e080"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={32}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />

      {/* Ocean bounce — teal-green fill from below/front, simulates water reflection */}
      <directionalLight position={[0, -2, 6]} intensity={0.38} color="#60c8a0" />

      {/* Cool fill — from ocean/left */}
      <directionalLight position={[-5, 3, -2]} intensity={0.30} color="#7aaec0" />

      {/* Warm rim — low sunset from behind, creates halo on island edge */}
      <directionalLight position={[-0.5, 1.8, -8]} intensity={0.60} color="#ffaa60" />

      {/* Canvas alpha:true — body CSS gradient shows as sky */}
      <fogExp2 attach="fog" args={["#6898b8", 0.010]} />

      <OceanPlane />
      <IslandStage />
      <BeachProps />

      {/* Character key light — warm, close */}
      <spotLight
        position={[5, 4.5, 4.5]}
        intensity={1.8}
        angle={0.50}
        penumbra={0.75}
        distance={10}
        color="#fff0d8"
        castShadow
        shadow-bias={-0.001}
      />
      <MiniTraveler />

      {/* Contact shadows — deeper opacity for more ground depth */}
      <ContactShadows position={[0, -0.44, 0]} opacity={0.65} scale={14} blur={2.8} far={2.2} />
    </>
  );
}
