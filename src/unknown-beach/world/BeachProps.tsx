import { useMemo } from "react";
import * as THREE from "three";

export function BeachProps() {
  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#c99a54"),
        roughness: 0.85,
        metalness: 0.0,
      }),
    []
  );
  const fabric = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#f7d7b4"),
        roughness: 0.95,
        metalness: 0.0,
      }),
    []
  );

  return (
    <group>
      {/* little wooden table */}
      <group position={[-1.6, -0.78, 1.0]}>
        <mesh castShadow>
          <boxGeometry args={[1.1, 0.12, 0.7]} />
          <primitive object={wood} attach="material" />
        </mesh>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 16]} />
          <primitive object={wood} attach="material" />
        </mesh>
        <mesh position={[0.45, -0.25, 0.25]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 16]} />
          <primitive object={wood} attach="material" />
        </mesh>
        <mesh position={[-0.45, -0.25, 0.25]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 16]} />
          <primitive object={wood} attach="material" />
        </mesh>
        <mesh position={[0.45, -0.25, -0.25]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 16]} />
          <primitive object={wood} attach="material" />
        </mesh>
        <mesh position={[-0.45, -0.25, -0.25]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 16]} />
          <primitive object={wood} attach="material" />
        </mesh>
      </group>

      {/* umbrella */}
      <group position={[1.8, -0.8, 0.9]}>
        <mesh position={[0, 0.8, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.6, 16]} />
          <primitive object={wood} attach="material" />
        </mesh>
        <mesh position={[0, 1.6, 0]} castShadow>
          <coneGeometry args={[1.1, 0.55, 24]} />
          <primitive object={fabric} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

