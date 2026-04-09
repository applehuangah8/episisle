import { useMemo } from "react";
import * as THREE from "three";

// ─── Palm Tree ─────────────────────────────────────────────────────────────
function PalmTree({
  position,
  rotationY = 0,
  leanZ = 0.10,
  scale = 1,
}: {
  position: [number, number, number];
  rotationY?: number;
  leanZ?: number;
  scale?: number;
}) {
  const bark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#7a5038"), roughness: 0.92 }),
    []
  );
  const leaf = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#4a7a48"),
        roughness: 0.78,
        side: THREE.DoubleSide,
      }),
    []
  );
  const coconut = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#5a3a22"), roughness: 0.88 }),
    []
  );

  const frondCount = 8;
  const trunkTopX = Math.sin(leanZ) * 0.9; // approximate lean offset at trunk top

  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      {/* Trunk — tapered, leaning */}
      <mesh position={[trunkTopX * 0.5, 0.9, 0]} rotation-z={leanZ} castShadow receiveShadow>
        <cylinderGeometry args={[0.068, 0.125, 1.8, 12]} />
        <primitive object={bark} attach="material" />
      </mesh>
      {/* Bark ring details */}
      {[0.38, 0.72, 1.08, 1.40, 1.65].map((h, i) => (
        <mesh
          key={i}
          position={[Math.sin(leanZ) * h * 0.5, h, 0]}
          rotation-z={leanZ}
          castShadow
        >
          <torusGeometry args={[0.085 + (1.8 - h) * 0.022, 0.016, 6, 18]} />
          <primitive object={bark} attach="material" />
        </mesh>
      ))}
      {/* Fronds */}
      {Array.from({ length: frondCount }).map((_, i) => {
        const angle = (i / frondCount) * Math.PI * 2 + rotationY * 0.4;
        return (
          <group key={i} position={[trunkTopX, 1.82, 0]} rotation-y={angle}>
            {/* Main frond */}
            <mesh position={[0.40, -0.06, 0]} rotation-z={-0.44} castShadow>
              <boxGeometry args={[0.78, 0.038, 0.13]} />
              <primitive object={leaf} attach="material" />
            </mesh>
            {/* Small sub-leaflets along frond */}
            {[0.22, 0.42, 0.60].map((ox, j) => (
              <mesh
                key={j}
                position={[ox, -0.06 - ox * 0.06, j % 2 === 0 ? 0.055 : -0.055]}
                rotation={[0, 0, -0.44]}
                castShadow
              >
                <boxGeometry args={[0.18, 0.028, 0.07]} />
                <primitive object={leaf} attach="material" />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* Coconut cluster */}
      {[0, 1.1, 2.2].map((a, i) => (
        <mesh
          key={i}
          position={[trunkTopX + Math.cos(a) * 0.06, 1.70, Math.sin(a) * 0.06]}
          castShadow
        >
          <sphereGeometry args={[0.075, 10, 10]} />
          <primitive object={coconut} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Lounge Chair ──────────────────────────────────────────────────────────
function LoungeChair({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const frame = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#8a5028"), roughness: 0.80 }),
    []
  );
  const fabric = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#e8d5b0"), roughness: 0.85 }),
    []
  );

  return (
    <group position={position} rotation-y={rotationY}>
      {/* Seat */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.78, 0.055, 0.38]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* Backrest — reclined ~28° */}
      <mesh position={[-0.26, 0.31, 0]} rotation-z={0.48} castShadow receiveShadow>
        <boxGeometry args={[0.40, 0.055, 0.36]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {/* 4 legs */}
      {(
        [
          [0.32, -0.15],
          [-0.32, -0.15],
          [0.32, 0.15],
          [-0.32, 0.15],
        ] as [number, number][]
      ).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.06, lz]} castShadow>
          <cylinderGeometry args={[0.024, 0.024, 0.30, 8]} />
          <primitive object={frame} attach="material" />
        </mesh>
      ))}
      {/* Side rails */}
      <mesh position={[0, 0.20, 0.22]} rotation-z={0.22} castShadow>
        <boxGeometry args={[0.62, 0.028, 0.036]} />
        <primitive object={frame} attach="material" />
      </mesh>
      <mesh position={[0, 0.20, -0.22]} rotation-z={0.22} castShadow>
        <boxGeometry args={[0.62, 0.028, 0.036]} />
        <primitive object={frame} attach="material" />
      </mesh>
    </group>
  );
}

// ─── Beach Umbrella ────────────────────────────────────────────────────────
function Umbrella({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  const pole = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#c8a060"), roughness: 0.78 }),
    []
  );
  const canopy1 = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#c85840"), roughness: 0.9, side: THREE.DoubleSide }),
    []
  );
  const canopy2 = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#f0e0c0"), roughness: 0.9, side: THREE.DoubleSide }),
    []
  );

  // 8-panel alternating striped canopy via individual triangle panels
  const panelCount = 8;
  const panels = Array.from({ length: panelCount }).map((_, i) => {
    const a0 = (i / panelCount) * Math.PI * 2;
    const a1 = ((i + 1) / panelCount) * Math.PI * 2;
    const r = 1.05;
    const verts = new Float32Array([
      0, 0, 0,
      Math.cos(a0) * r, -0.35, Math.sin(a0) * r,
      Math.cos(a1) * r, -0.35, Math.sin(a1) * r,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    geo.computeVertexNormals();
    return { geo, mat: i % 2 === 0 ? canopy1 : canopy2 };
  });

  return (
    <group position={position} rotation-y={rotationY}>
      {/* Pole — sticks into sand */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.052, 1.7, 14]} />
        <primitive object={pole} attach="material" />
      </mesh>
      {/* Canopy panels */}
      <group position={[0, 1.72, 0]}>
        {panels.map(({ geo, mat }, i) => (
          <mesh key={i} geometry={geo} castShadow>
            <primitive object={mat} attach="material" />
          </mesh>
        ))}
        {/* Canopy rim */}
        <mesh rotation-x={Math.PI / 2} position={[0, -0.35, 0]}>
          <torusGeometry args={[1.06, 0.022, 8, 36]} />
          <primitive object={canopy1} attach="material" />
        </mesh>
        {/* Center finial */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <sphereGeometry args={[0.055, 12, 12]} />
          <primitive object={pole} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

// ─── Low table ─────────────────────────────────────────────────────────────
function SmallTable({ position }: { position: [number, number, number] }) {
  const wood = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#a06038"),
        roughness: 0.84,
        metalness: 0,
      }),
    []
  );

  return (
    <group position={position}>
      {/* Top */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.10, 0.65]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {/* 4 legs — legs bottom at y = -0.50, so sit on sand if group_y ≈ 0.06 */}
      {(
        [
          [0.42, 0.26],
          [-0.42, 0.26],
          [0.42, -0.26],
          [-0.42, -0.26],
        ] as [number, number][]
      ).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, -0.25, lz]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.50, 14]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}
      {/* Drink cup on table */}
      <mesh position={[0.18, 0.13, 0.08]} castShadow>
        <cylinderGeometry args={[0.055, 0.048, 0.14, 14]} />
        <primitive object={wood} attach="material" />
      </mesh>
    </group>
  );
}

// ─── Scattered shells ──────────────────────────────────────────────────────
const SHELLS: { pos: [number, number, number]; r: number }[] = [
  { pos: [3.1, -0.43, 0.5], r: 0.06 },
  { pos: [2.8, -0.43, -1.2], r: 0.045 },
  { pos: [-3.0, -0.43, 1.1], r: 0.055 },
  { pos: [3.4, -0.43, -0.3], r: 0.038 },
  { pos: [-2.4, -0.43, -1.8], r: 0.05 },
  { pos: [1.4, -0.43, 3.2], r: 0.042 },
];

// ─── BeachProps ────────────────────────────────────────────────────────────
export function BeachProps() {
  const shellMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#f0e8dc"),
        roughness: 0.55,
        clearcoat: 0.55,
        clearcoatRoughness: 0.38,
      }),
    []
  );

  return (
    <group>
      {/* ── Palm trees ─────────────────────────────────── */}
      {/* Left-back: tall, slight rightward lean */}
      <PalmTree position={[-2.4, -0.44, -0.6]} rotationY={0.4} leanZ={0.09} scale={1.05} />
      {/* Right-back: shorter, different angle */}
      <PalmTree position={[0.6, -0.44, -2.6]} rotationY={-1.1} leanZ={0.12} scale={0.88} />

      {/* ── Lounge chair (near character, facing ocean) ─── */}
      {/*
        Chair legs bottom: group_y + (-0.14) = -0.44 → group_y = -0.30
        Seat visible at y ≈ -0.30 + 0.16 = -0.14 (above sand ✓)
      */}
      <LoungeChair position={[-0.5, -0.30, 1.1]} rotationY={0.35} />

      {/* ── Umbrella (sticks into sand, correct y) ──────── */}
      {/*
        Pole spans from group_y (bottom) upward.
        At y=-0.44 pole bottom is at sand surface.
      */}
      <Umbrella position={[1.6, -0.44, 0.85]} rotationY={0.2} />

      {/* ── Low table ───────────────────────────────────── */}
      {/*
        Leg bottom: group_y - 0.25 - 0.25 = group_y - 0.50
        group_y = 0.06 → leg bottom = -0.44 (sand ✓)
      */}
      <SmallTable position={[-1.5, 0.06, 0.7]} />

      {/* ── Beach shells ──────────────────────────────── */}
      {SHELLS.map((s, i) => (
        <mesh key={i} position={s.pos} castShadow>
          <sphereGeometry args={[s.r, 10, 10]} />
          <primitive object={shellMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
