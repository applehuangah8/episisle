import { useMemo } from "react";
import * as THREE from "three";

import { CrucibleRing } from "@/unknown-lab/scene/CrucibleRing";
import { IdeaOreMesh } from "@/unknown-lab/scene/IdeaOreMesh";
import { RefinedGemField } from "@/unknown-lab/scene/RefinedGemField";
import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";

const deskGeo = new THREE.CircleGeometry(6.2, 128);
deskGeo.rotateX(-Math.PI / 2);

export function IdeaOreField() {
  const ores = useUnknownLabStore((s) => s.ores);
  const selectedIds = useUnknownLabStore((s) => s.selectedOreIds);

  const deskMat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#12161b"),
      roughness: 0.95,
      metalness: 0.0,
      transparent: true,
      opacity: 0.9,
      clearcoat: 0.4,
      clearcoatRoughness: 0.85,
    });
    return m;
  }, []);

  return (
    <group>
      <mesh geometry={deskGeo} material={deskMat} receiveShadow position={[0, -0.95, 0]} />
      <CrucibleRing />
      {ores.map((o) => (
        <IdeaOreMesh key={o.id} ore={o} selected={selectedIds.includes(o.id)} />
      ))}
      <RefinedGemField />
    </group>
  );
}

