import { useMemo } from "react";
import * as THREE from "three";

import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";

const gemGeo = new THREE.OctahedronGeometry(0.22, 1);

export function RefinedGemField() {
  const gems = useUnknownLabStore((s) => s.gems);
  const openKitForGem = useUnknownLabStore((s) => s.openKitForGem);

  const mat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#222831"),
      roughness: 0.35,
      metalness: 0.0,
      transmission: 0.22,
      thickness: 0.9,
      ior: 1.3,
      clearcoat: 0.75,
      clearcoatRoughness: 0.35,
      emissive: new THREE.Color("#2f241a"),
      emissiveIntensity: 0.18,
    });
  }, []);

  return (
    <group>
      {gems.map((g) => (
        <mesh
          key={g.id}
          geometry={gemGeo}
          material={mat}
          castShadow
          position={[g.x, 0.02, g.z]}
          onClick={(e) => {
            e.stopPropagation();
            openKitForGem(g.id);
          }}
        />
      ))}
    </group>
  );
}

