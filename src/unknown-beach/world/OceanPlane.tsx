import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function OceanPlane() {
  const ref = useRef<THREE.Mesh>(null);

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(52, 52, 80, 80);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  // Vibrant teal-aqua — like Palia/garden game water
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#1a8868"),
        roughness: 0.28,
        metalness: 0.04,
        clearcoat: 0.55,
        clearcoatRoughness: 0.42,
        envMapIntensity: 1.2,
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
        Math.sin(x * 0.20 + t * 0.55) * 0.048 +
        Math.sin(z * 0.16 + t * 0.70) * 0.034 +
        Math.sin(x * 0.38 + z * 0.28 + t * 0.9) * 0.016;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
  });

  return <mesh ref={ref} geometry={geom} material={mat} position={[0, -0.98, 0]} receiveShadow />;
}
