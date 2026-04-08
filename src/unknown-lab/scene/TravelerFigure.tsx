import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

import type { VacationSceneId } from "@/unknown-lab/state/types";

export function TravelerFigure({ vacationScene }: { vacationScene: VacationSceneId }) {
  const mats = useMemo(() => {
    // Porcelain: soft glaze, readable in dark.
    const porcelain = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#e7dfd4"),
      roughness: 0.42,
      metalness: 0.0,
      clearcoat: 0.9,
      clearcoatRoughness: 0.35,
    });

    // Felt: matte base with subtle sheen (fabric-like). This is our “adult” plush.
    const feltCoat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#2f6f7a"),
      roughness: 0.92,
      metalness: 0.0,
      clearcoat: 0.08,
      clearcoatRoughness: 0.95,
      sheen: 0.55,
      sheenColor: new THREE.Color("#9cb7b8"),
      sheenRoughness: 0.85,
    });

    const feltHat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#b06b45"),
      roughness: 0.94,
      metalness: 0.0,
      clearcoat: 0.06,
      clearcoatRoughness: 0.95,
      sheen: 0.45,
      sheenColor: new THREE.Color("#d6c3a8"),
      sheenRoughness: 0.9,
    });

    const lens = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(vacationScene === "v2" ? "#0f2b45" : vacationScene === "v3" ? "#1a2026" : "#2b3a45"),
      roughness: 0.18,
      metalness: 0.0,
      transmission: 0.22,
      thickness: 0.9,
      ior: 1.4,
      clearcoat: 0.8,
      clearcoatRoughness: 0.22,
    });
    const gold = new THREE.MeshStandardMaterial({ color: new THREE.Color("#c99a54"), metalness: 0.35, roughness: 0.55 });
    const ink = new THREE.MeshStandardMaterial({ color: new THREE.Color("#1a2026"), metalness: 0.0, roughness: 0.9 });
    const blush = new THREE.MeshStandardMaterial({ color: new THREE.Color("#d6c3a8"), metalness: 0.0, roughness: 0.85 });
    return { porcelain, feltCoat, feltHat, lens, gold, ink, blush };
  }, [vacationScene]);

  return (
    <group position={[2.35, -0.86, 1.75]} rotation={[0, -0.85, 0]} scale={1.55}>
      {/* body */}
      <RoundedBox args={[0.34, 0.36, 0.26]} radius={0.12} smoothness={6} material={mats.feltCoat} castShadow />
      {/* head */}
      <mesh position={[0, 0.34, 0]}>
        <sphereGeometry args={[0.17, 24, 24]} />
        <primitive object={mats.porcelain} attach="material" />
      </mesh>

      {/* cheeks (very subtle) */}
      <mesh position={[-0.07, 0.315, 0.155]} rotation={[0.02, 0, 0]}>
        <circleGeometry args={[0.028, 18]} />
        <primitive object={mats.blush} attach="material" />
      </mesh>
      <mesh position={[0.07, 0.315, 0.155]} rotation={[0.02, 0, 0]}>
        <circleGeometry args={[0.028, 18]} />
        <primitive object={mats.blush} attach="material" />
      </mesh>

      {/* eyebrows (thin, refined) */}
      <mesh position={[-0.065, 0.38, 0.155]} rotation={[0.02, 0, 0]}>
        <RoundedBox args={[0.07, 0.012, 0.01]} radius={0.006} smoothness={3} material={mats.ink} />
      </mesh>
      <mesh position={[0.065, 0.38, 0.155]} rotation={[0.02, 0, 0]}>
        <RoundedBox args={[0.07, 0.012, 0.01]} radius={0.006} smoothness={3} material={mats.ink} />
      </mesh>
      {/* hat (kept abstract; in vacation it's “hung”, sunglasses show mood instead) */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.08, 24]} />
        <primitive object={mats.feltHat} attach="material" />
      </mesh>
      <mesh position={[0, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.2, 0.03, 10, 28]} />
        <primitive object={mats.feltHat} attach="material" />
      </mesh>

      {/* sunglasses */}
      <mesh position={[-0.07, 0.34, 0.15]} rotation={[0.06, 0, 0]} castShadow>
        <RoundedBox args={[0.14, 0.07, 0.04]} radius={0.03} smoothness={4} material={mats.lens} />
      </mesh>
      <mesh position={[0.07, 0.34, 0.15]} rotation={[0.06, 0, 0]} castShadow>
        <RoundedBox args={[0.14, 0.07, 0.04]} radius={0.03} smoothness={4} material={mats.lens} />
      </mesh>
      <mesh position={[0, 0.34, 0.145]} rotation={[0.06, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 0.015, 0.01]} />
        <primitive object={mats.gold} attach="material" />
      </mesh>

      {/* tiny base plate for “miniature diorama” readability */}
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <cylinderGeometry args={[0.28, 0.3, 0.04, 28]} />
        <primitive object={mats.porcelain} attach="material" />
      </mesh>
    </group>
  );
}

