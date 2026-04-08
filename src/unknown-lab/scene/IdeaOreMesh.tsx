import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { IdeaOre } from "@/unknown-lab/state/types";
import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";

function oreGeometry(seed: number) {
  // Deterministic-ish geometry without heavy noise libs: start from icosahedron, tweak vertex radius.
  const g = new THREE.IcosahedronGeometry(0.32, 2);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos as any, i);
    const r = v.length();
    // simple hash
    const h = Math.sin(seed * 999 + i * 17.13) * 43758.5453;
    const n = h - Math.floor(h);
    const bump = 0.78 + n * 0.52;
    v.setLength(r * bump);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function IdeaOreMesh({ ore, selected }: { ore: IdeaOre; selected: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const draggingRef = useRef(false);
  const lastWorldRef = useRef<{ x: number; z: number } | null>(null);
  useCursor(hovered);

  const setSelected = useUnknownLabStore((s) => s.setSelectedOreId);
  const setHover = useUnknownLabStore((s) => s.setHoveredOreId);
  const selectedIds = useUnknownLabStore((s) => s.selectedOreIds);
  const moveOresBy = useUnknownLabStore((s) => s.moveOresBy);
  const tryRefineAtCrucible = useUnknownLabStore((s) => s.tryRefineAtCrucible);

  const geom = useMemo(() => oreGeometry(ore.seed), [ore.seed]);
  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#202a33"),
      roughness: 0.68,
      metalness: 0.0,
      transmission: 0.12,
      thickness: 0.6,
      ior: 1.28,
      clearcoat: 0.6,
      clearcoatRoughness: 0.82,
      emissive: new THREE.Color("#3a2b1b"),
      emissiveIntensity: 0.05,
    });
    return m;
  }, []);

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const el = ref.current;
    if (!el) return;
    const targetY = selected ? 0.06 : hovered ? 0.03 : 0;
    el.position.y = THREE.MathUtils.damp(el.position.y, targetY, 8, dt);
    el.rotation.y += dt * (selected ? 0.45 : 0.2);

    const m = mat;
    const targetEm = selected ? 0.22 : hovered ? 0.12 : 0.05;
    m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, targetEm, 8, dt);
  });

  return (
    <mesh
      ref={ref}
      geometry={geom}
      material={mat}
      castShadow
      position={[ore.x, 0, ore.z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setHover(ore.id);
      }}
      onPointerOut={() => {
        setHovered(false);
        setHover(null);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        draggingRef.current = true;
        (e.target as HTMLElement | undefined)?.setPointerCapture?.(e.pointerId);
        const additive = (e.shiftKey || e.metaKey || e.ctrlKey) ?? false;
        setSelected(ore.id, { additive });
        const hit = e.ray.intersectPlane(plane, tmpVec);
        if (hit) lastWorldRef.current = { x: hit.x, z: hit.z };
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        e.stopPropagation();
        const hit = e.ray.intersectPlane(plane, tmpVec);
        if (!hit) return;
        const last = lastWorldRef.current;
        if (!last) {
          lastWorldRef.current = { x: hit.x, z: hit.z };
          return;
        }
        const dx = hit.x - last.x;
        const dz = hit.z - last.z;
        lastWorldRef.current = { x: hit.x, z: hit.z };
        const ids = selectedIds.includes(ore.id) ? selectedIds : [ore.id];
        moveOresBy(ids, { dx, dz });
      }}
      onPointerUp={(e) => {
        if (!draggingRef.current) return;
        e.stopPropagation();
        draggingRef.current = false;
        lastWorldRef.current = null;
        try {
          (e.target as HTMLElement | undefined)?.releasePointerCapture?.(e.pointerId);
        } catch {
          /* ignore */
        }
        const ids = selectedIds.includes(ore.id) ? selectedIds : [ore.id];
        tryRefineAtCrucible(ids);
      }}
      onClick={(e) => {
        // selection handled on pointerdown; click kept for compatibility.
        e.stopPropagation();
      }}
    />
  );
}

