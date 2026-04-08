import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function OceanPlane() {
  const ref = useRef<THREE.Mesh>(null);

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(40, 18, 96, 32);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#2f6f7a"),
        roughness: 0.22,
        metalness: 0.0,
        transmission: 0.08,
        thickness: 1.0,
        clearcoat: 0.55,
        clearcoatRoughness: 0.18,
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
      const y = Math.sin(x * 0.22 + t * 0.6) * 0.04 + Math.sin(z * 0.18 + t * 0.75) * 0.03;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
  });

  return (
    <mesh ref={ref} geometry={geom} material={mat} position={[0, -0.98, -8.5]} receiveShadow />
  );
}

