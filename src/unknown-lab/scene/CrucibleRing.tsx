import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";

const ringGeo = new THREE.TorusGeometry(0.95, 0.04, 12, 96);
const bowlGeo = new THREE.CylinderGeometry(0.46, 0.62, 0.38, 48, 1, true);
const baseGeo = new THREE.CylinderGeometry(0.76, 0.86, 0.12, 48);
const heatGeo = new THREE.RingGeometry(0.54, 0.92, 96);
heatGeo.rotateX(-Math.PI / 2);

export function CrucibleRing() {
  const ringRef = useRef<THREE.Mesh>(null);
  const bowlRef = useRef<THREE.Mesh>(null);
  const heatRef = useRef<THREE.Mesh>(null);
  const selectedCount = useUnknownLabStore((s) => s.selectedOreIds.length);
  const selectedIds = useUnknownLabStore((s) => s.selectedOreIds);
  const ores = useUnknownLabStore((s) => s.ores);

  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#2f6f7a"),
      roughness: 0.65,
      metalness: 0.08,
      clearcoat: 0.65,
      clearcoatRoughness: 0.45,
      emissive: new THREE.Color("#c99a54"),
      emissiveIntensity: 0.12,
    });
    return m;
  }, []);

  const ceramic = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#e7dfd4"),
      roughness: 0.32,
      metalness: 0.0,
      clearcoat: 0.85,
      clearcoatRoughness: 0.26,
    });
  }, []);

  const heatMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#c99a54"),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return m;
  }, []);

  useFrame((_, dt) => {
    const ring = ringRef.current;
    const bowl = bowlRef.current;
    if (ring) {
      const targetY = selectedCount >= 2 ? -0.73 : -0.77;
      ring.position.y = THREE.MathUtils.damp(ring.position.y, targetY, 6, dt);
      ring.rotation.y += dt * 0.2;
    }
    if (bowl) {
      const target = selectedCount >= 2 ? -0.76 : -0.8;
      bowl.position.y = THREE.MathUtils.damp(bowl.position.y, target, 6, dt);
      bowl.rotation.y += dt * 0.08;
    }

    const heat = heatRef.current;
    if (heat) {
      let h = 0;
      if (selectedIds.length >= 2) {
        const picked = ores.filter((o) => selectedIds.includes(o.id));
        if (picked.length >= 2) {
          const cx = picked.reduce((a, b) => a + b.x, 0) / picked.length;
          const cz = picked.reduce((a, b) => a + b.z, 0) / picked.length;
          const d = Math.hypot(cx, cz);
          h = THREE.MathUtils.clamp(1 - d / 1.2, 0, 1);
        }
      }
      const targetOpacity = h * 0.55;
      (heat.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.damp(
        (heat.material as THREE.MeshBasicMaterial).opacity,
        targetOpacity,
        8,
        dt
      );
    }
  });

  return (
    <group>
      {/* ceramic base (diorama prop, readable) */}
      <mesh geometry={baseGeo} material={ceramic} position={[0, -0.92, 0]} receiveShadow castShadow />
      {/* bowl */}
      <mesh
        ref={bowlRef}
        geometry={bowlGeo}
        material={ceramic}
        position={[0, -0.8, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        ref={ringRef}
        geometry={ringGeo}
        material={mat}
        position={[0, -0.77, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh ref={heatRef} geometry={heatGeo} material={heatMat} position={[0, -0.92, 0]} />
    </group>
  );
}

