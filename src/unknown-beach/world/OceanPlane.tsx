import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function OceanPlane() {
  const ref = useRef<THREE.Mesh>(null);

  const geom = useMemo(() => {
    // Wider plane, fully surrounds the island
    const g = new THREE.PlaneGeometry(52, 52, 80, 80);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  // Deep navy — Image 2 slate blue-navy
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#2a5878"),  // slightly lighter navy-teal
        roughness: 0.48,
        metalness: 0.02,
        clearcoat: 0.28,
        clearcoatRoughness: 0.72,  // very spread highlights — no spike, just gentle shimmer
      }),
    []
  );

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    const g = mesh.geometry as THREE.PlaneGeometry;
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y =
        Math.sin(x * 0.20 + t * 0.55) * 0.045 +
        Math.sin(z * 0.16 + t * 0.70) * 0.032 +
        Math.sin(x * 0.38 + z * 0.28 + t * 0.9) * 0.014;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
  });

  // Centered on island so ocean surrounds it equally on all sides
  return <mesh ref={ref} geometry={geom} material={mat} position={[0, -0.98, 0]} receiveShadow />;
}
