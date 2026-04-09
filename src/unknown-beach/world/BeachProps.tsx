import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { useMemo, useRef } from "react";
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
  const bark   = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#7a5038"), roughness: 0.92 }), []);
  const leaf   = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#4a7a48"), roughness: 0.78, side: THREE.DoubleSide }), []);
  const coconut = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#5a3a22"), roughness: 0.88 }), []);

  const frondCount = 8;
  const trunkTopX = Math.sin(leanZ) * 0.9;

  return (
    <group position={position} rotation-y={rotationY} scale={scale}>
      <mesh position={[trunkTopX * 0.5, 0.9, 0]} rotation-z={leanZ} castShadow receiveShadow>
        <cylinderGeometry args={[0.068, 0.125, 1.8, 12]} />
        <primitive object={bark} attach="material" />
      </mesh>
      {[0.38, 0.72, 1.08, 1.40, 1.65].map((h, i) => (
        <mesh key={i} position={[Math.sin(leanZ) * h * 0.5, h, 0]} rotation-z={leanZ} castShadow>
          <torusGeometry args={[0.085 + (1.8 - h) * 0.022, 0.016, 6, 18]} />
          <primitive object={bark} attach="material" />
        </mesh>
      ))}
      {Array.from({ length: frondCount }).map((_, i) => {
        const angle = (i / frondCount) * Math.PI * 2 + rotationY * 0.4;
        return (
          <group key={i} position={[trunkTopX, 1.82, 0]} rotation-y={angle}>
            <mesh position={[0.40, -0.06, 0]} rotation-z={-0.44} castShadow>
              <boxGeometry args={[0.78, 0.038, 0.13]} />
              <primitive object={leaf} attach="material" />
            </mesh>
            {[0.22, 0.42, 0.60].map((ox, j) => (
              <mesh key={j} position={[ox, -0.06 - ox * 0.06, j % 2 === 0 ? 0.055 : -0.055]} rotation={[0, 0, -0.44]} castShadow>
                <boxGeometry args={[0.18, 0.028, 0.07]} />
                <primitive object={leaf} attach="material" />
              </mesh>
            ))}
          </group>
        );
      })}
      {[0, 1.1, 2.2].map((a, i) => (
        <mesh key={i} position={[trunkTopX + Math.cos(a) * 0.06, 1.70, Math.sin(a) * 0.06]} castShadow>
          <sphereGeometry args={[0.075, 10, 10]} />
          <primitive object={coconut} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Lounge Chair ──────────────────────────────────────────────────────────
function LoungeChair({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const frame  = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#8a5028"), roughness: 0.80 }), []);
  const fabric = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#e8d5b0"), roughness: 0.85 }), []);

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.78, 0.055, 0.38]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      <mesh position={[-0.26, 0.31, 0]} rotation-z={0.48} castShadow receiveShadow>
        <boxGeometry args={[0.40, 0.055, 0.36]} />
        <primitive object={fabric} attach="material" />
      </mesh>
      {([[0.32,-0.15],[-0.32,-0.15],[0.32,0.15],[-0.32,0.15]] as [number,number][]).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.06, lz]} castShadow>
          <cylinderGeometry args={[0.024, 0.024, 0.30, 8]} />
          <primitive object={frame} attach="material" />
        </mesh>
      ))}
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
function Umbrella({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const pole    = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#c8a060"), roughness: 0.78 }), []);
  const canopy1 = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#c85840"), roughness: 0.9, side: THREE.DoubleSide }), []);
  const canopy2 = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#f0e0c0"), roughness: 0.9, side: THREE.DoubleSide }), []);

  const panelCount = 8;
  const panels = Array.from({ length: panelCount }).map((_, i) => {
    const a0 = (i / panelCount) * Math.PI * 2;
    const a1 = ((i + 1) / panelCount) * Math.PI * 2;
    const r = 1.05;
    const verts = new Float32Array([0,0,0, Math.cos(a0)*r,-0.35,Math.sin(a0)*r, Math.cos(a1)*r,-0.35,Math.sin(a1)*r]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    geo.computeVertexNormals();
    return { geo, mat: i % 2 === 0 ? canopy1 : canopy2 };
  });

  return (
    <group position={position} rotation-y={rotationY}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.052, 1.7, 14]} />
        <primitive object={pole} attach="material" />
      </mesh>
      <group position={[0, 1.72, 0]}>
        {panels.map(({ geo, mat }, i) => (
          <mesh key={i} geometry={geo} castShadow>
            <primitive object={mat} attach="material" />
          </mesh>
        ))}
        <mesh rotation-x={Math.PI / 2} position={[0, -0.35, 0]}>
          <torusGeometry args={[1.06, 0.022, 8, 36]} />
          <primitive object={canopy1} attach="material" />
        </mesh>
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
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#a06038"), roughness: 0.84, metalness: 0 }), []);
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.10, 0.65]} />
        <primitive object={wood} attach="material" />
      </mesh>
      {([[0.42,0.26],[-0.42,0.26],[0.42,-0.26],[-0.42,-0.26]] as [number,number][]).map(([lx, lz], i) => (
        <mesh key={i} position={[lx, -0.25, lz]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.50, 14]} />
          <primitive object={wood} attach="material" />
        </mesh>
      ))}
      <mesh position={[0.18, 0.13, 0.08]} castShadow>
        <cylinderGeometry args={[0.055, 0.048, 0.14, 14]} />
        <primitive object={wood} attach="material" />
      </mesh>
    </group>
  );
}

// ─── Flower ────────────────────────────────────────────────────────────────
function Flower({
  position,
  petalColor,
  centerColor,
  stemH = 0.22,
  scale = 1,
}: {
  position: [number, number, number];
  petalColor: string;
  centerColor: string;
  stemH?: number;
  scale?: number;
}) {
  const stemMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#5a8848"), roughness: 0.88 }), []);
  const petalMat  = useMemo(() => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(petalColor), roughness: 0.75, clearcoat: 0.25, clearcoatRoughness: 0.65, side: THREE.DoubleSide }), [petalColor]);
  const centerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(centerColor), roughness: 0.70, emissive: new THREE.Color(centerColor), emissiveIntensity: 0.12 }), [centerColor]);

  const petalCount = 6;

  return (
    <group position={position} scale={scale}>
      {/* Stem */}
      <mesh position={[0, stemH / 2, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.018, stemH, 6]} />
        <primitive object={stemMat} attach="material" />
      </mesh>
      {/* Small leaf on stem */}
      <mesh position={[0.04, stemH * 0.45, 0]} rotation={[0, 0, 0.7]}>
        <boxGeometry args={[0.08, 0.032, 0.048]} />
        <primitive object={stemMat} attach="material" />
      </mesh>
      {/* Petals */}
      {Array.from({ length: petalCount }).map((_, i) => {
        const a = (i / petalCount) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.072, stemH + 0.008, Math.sin(a) * 0.072]} rotation={[0.35, a, 0]} castShadow>
            <circleGeometry args={[0.050, 10]} />
            <primitive object={petalMat} attach="material" />
          </mesh>
        );
      })}
      {/* Center */}
      <mesh position={[0, stemH + 0.024, 0]} castShadow>
        <sphereGeometry args={[0.036, 10, 10]} />
        <primitive object={centerMat} attach="material" />
      </mesh>
    </group>
  );
}

// ─── Grass Tuft ────────────────────────────────────────────────────────────
function GrassTuft({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  const grassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#7aaa68"),
    roughness: 0.88,
    side: THREE.DoubleSide,
  }), []);

  const blades: [number, number, number, number][] = [
    [-0.06, 0.15, 0.02, -0.28], [0, 0.18, 0, 0.12], [0.07, 0.14, -0.02, 0.38],
    [-0.035, 0.16, 0.05, -0.15], [0.04, 0.17, -0.03, 0.22],
  ];

  return (
    <group position={position} rotation-y={rotationY}>
      {blades.map(([bx, by, bz, rot], i) => (
        <mesh key={i} position={[bx, by / 2, bz]} rotation-z={rot} castShadow>
          <boxGeometry args={[0.022, by, 0.012]} />
          <primitive object={grassMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Succulent Pot ─────────────────────────────────────────────────────────
function SucculentPot({ position }: { position: [number, number, number] }) {
  const potMat  = useMemo(() => new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#d47848"), roughness: 0.82, clearcoat: 0.15 }), []);
  const soilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#6a4830"), roughness: 0.95 }), []);
  const leafMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: new THREE.Color("#78b868"), roughness: 0.72, clearcoat: 0.30, clearcoatRoughness: 0.60 }), []);

  return (
    <group position={position}>
      {/* Pot body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.12, 0.09, 0.18, 14]} />
        <primitive object={potMat} attach="material" />
      </mesh>
      {/* Soil top */}
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.115, 0.115, 0.015, 14]} />
        <primitive object={soilMat} attach="material" />
      </mesh>
      {/* Succulent leaves — rosette */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const r = 0.072;
        return (
          <mesh key={i} position={[Math.cos(a)*r, 0.125, Math.sin(a)*r]} rotation={[0.55, a, 0]} castShadow>
            <circleGeometry args={[0.048, 10]} />
            <primitive object={leafMat} attach="material" />
          </mesh>
        );
      })}
      {/* Center bud */}
      <mesh position={[0, 0.158, 0]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <primitive object={leafMat} attach="material" />
      </mesh>
    </group>
  );
}

// ─── Sailboat ──────────────────────────────────────────────────────────────
function Sailboat({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  const hullMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#4a88a8"),   // dusty blue hull — reference image
    roughness: 0.65,
    clearcoat: 0.45,
    clearcoatRoughness: 0.55,
  }), []);
  const hullInner = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#f0ece0"), roughness: 0.85 }), []);
  const mastMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#c8a058"), roughness: 0.78 }), []);
  const sailMat   = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#f4ede0"),
    roughness: 0.80,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  }), []);
  const sailMat2  = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#e8b8a0"),   // warm peach second sail — from reference
    roughness: 0.80,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.90,
  }), []);
  const flagMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#d47050"), roughness: 0.80, side: THREE.DoubleSide }), []);
  const ropeMat   = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#c8b888"), roughness: 0.88 }), []);

  // Build main sail triangle
  const sailGeo = useMemo(() => {
    const v = new Float32Array([0,0,0,  0.0,0.85,0,  0.55,0.0,0]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  // Jib sail (front)
  const jibGeo = useMemo(() => {
    const v = new Float32Array([0,0.08,0,  0,0.72,0,  0.40,0.02,0.18]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  // Gentle bob + drift animation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const g = groupRef.current;
    if (!g) return;
    g.position.y = position[1] + Math.sin(t * 0.65) * 0.055 + Math.sin(t * 0.38) * 0.022;
    g.rotation.z = Math.sin(t * 0.48) * 0.025;
    g.rotation.x = Math.sin(t * 0.33) * 0.018;
  });

  return (
    <group ref={groupRef} position={position} rotation-y={0.45}>
      {/* Hull — tapered boat shape */}
      <RoundedBox args={[0.72, 0.22, 0.38]} radius={0.09} smoothness={6} position={[0, 0, 0]} material={hullMat} castShadow />
      {/* Inner deck */}
      <mesh position={[0, 0.10, 0]}>
        <boxGeometry args={[0.58, 0.04, 0.28]} />
        <primitive object={hullInner} attach="material" />
      </mesh>
      {/* Hull stripe */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.74, 0.04, 0.40]} />
        <primitive object={mastMat} attach="material" />
      </mesh>

      {/* Mast */}
      <mesh position={[-0.04, 0.60, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 1.0, 8]} />
        <primitive object={mastMat} attach="material" />
      </mesh>
      {/* Boom (horizontal spar) */}
      <mesh position={[0.22, 0.14, 0]} rotation-z={0.08} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.60, 6]} />
        <primitive object={mastMat} attach="material" />
      </mesh>

      {/* Main sail */}
      <mesh geometry={sailGeo} position={[-0.04, 0.12, 0.01]} material={sailMat} castShadow />

      {/* Jib sail */}
      <mesh geometry={jibGeo} position={[-0.04, 0.12, 0]} material={sailMat2} castShadow />

      {/* Small flag at mast top */}
      <mesh position={[-0.04, 1.12, 0.01]} rotation-y={-0.2}>
        <boxGeometry args={[0.10, 0.052, 0.006]} />
        <primitive object={flagMat} attach="material" />
      </mesh>

      {/* Rope from mast to bow */}
      <mesh position={[0.18, 0.42, 0]} rotation-z={-0.55}>
        <cylinderGeometry args={[0.006, 0.006, 0.52, 4]} />
        <primitive object={ropeMat} attach="material" />
      </mesh>
    </group>
  );
}

// ─── Seagull ───────────────────────────────────────────────────────────────
function Seagull({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const wingMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#f0ece8"), roughness: 0.85, side: THREE.DoubleSide }), []);
  const bodyMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#e8e4e0"), roughness: 0.82 }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const g = groupRef.current;
    if (!g) return;
    // Gentle soar drift
    g.position.y = position[1] + Math.sin(t * 0.55 + position[0]) * 0.08;
    // Wing flap
    const children = g.children;
    if (children[1]) children[1].rotation.z =  0.28 + Math.sin(t * 2.2) * 0.18;
    if (children[2]) children[2].rotation.z = -0.28 - Math.sin(t * 2.2) * 0.18;
  });

  return (
    <group ref={groupRef} position={position} scale={scale} rotation-y={position[0] > 0 ? 0.6 : -0.4}>
      {/* Body */}
      <mesh castShadow>
        <sphereGeometry args={[0.055, 10, 8]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
      {/* Left wing */}
      <mesh position={[-0.12, 0.01, 0]} rotation-z={0.28} castShadow>
        <boxGeometry args={[0.22, 0.018, 0.055]} />
        <primitive object={wingMat} attach="material" />
      </mesh>
      {/* Right wing */}
      <mesh position={[0.12, 0.01, 0]} rotation-z={-0.28} castShadow>
        <boxGeometry args={[0.22, 0.018, 0.055]} />
        <primitive object={wingMat} attach="material" />
      </mesh>
      {/* Head */}
      <mesh position={[0.055, 0.025, 0]}>
        <sphereGeometry args={[0.032, 8, 8]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>
    </group>
  );
}

// ─── Scattered shells ──────────────────────────────────────────────────────
const SHELLS: { pos: [number, number, number]; r: number }[] = [
  { pos: [3.1, -0.43, 0.5],   r: 0.06  },
  { pos: [2.8, -0.43, -1.2],  r: 0.045 },
  { pos: [-3.0, -0.43, 1.1],  r: 0.055 },
  { pos: [3.4, -0.43, -0.3],  r: 0.038 },
  { pos: [-2.4, -0.43, -1.8], r: 0.05  },
  { pos: [1.4, -0.43, 3.2],   r: 0.042 },
];

// Flower placements — on island sand (y = -0.44 base)
const FLOWERS: { pos: [number, number, number]; petal: string; center: string; stemH: number; sc: number }[] = [
  { pos: [-1.6, -0.44, 1.8],  petal: "#f0ece0", center: "#d4a040", stemH: 0.26, sc: 1.0 },  // white daisy
  { pos: [-2.8, -0.44, -1.2], petal: "#d4784c", center: "#c89028", stemH: 0.22, sc: 0.90 }, // orange
  { pos: [0.8, -0.44, -3.0],  petal: "#e8a8b0", center: "#f0ece0", stemH: 0.20, sc: 0.85 }, // pink
  { pos: [2.6, -0.44, 1.4],   petal: "#7aaeb8", center: "#f0ece0", stemH: 0.24, sc: 0.95 }, // teal
  { pos: [-0.6, -0.44, 3.2],  petal: "#f0ece0", center: "#d4a040", stemH: 0.18, sc: 0.80 }, // small white
  { pos: [2.0, -0.44, -2.2],  petal: "#e8c898", center: "#c87828", stemH: 0.22, sc: 0.88 }, // golden
  { pos: [-3.2, -0.44, 0.4],  petal: "#e8a8b0", center: "#d48898", stemH: 0.25, sc: 1.05 }, // pink2
];

// ─── BeachProps ────────────────────────────────────────────────────────────
export function BeachProps() {
  const shellMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f0e8dc"),
      roughness: 0.55,
      clearcoat: 0.55,
      clearcoatRoughness: 0.38,
    }),
    []
  );

  return (
    <group>
      {/* ── Palm trees ───────────────────────────────────── */}
      <PalmTree position={[-2.4, -0.44, -0.6]} rotationY={0.4}  leanZ={0.09} scale={1.05} />
      <PalmTree position={[0.6,  -0.44, -2.6]} rotationY={-1.1} leanZ={0.12} scale={0.88} />

      {/* ── Grass tufts near palms ────────────────────────── */}
      <GrassTuft position={[-2.0, -0.44, -0.2]} rotationY={0.3} />
      <GrassTuft position={[-2.8, -0.44, -0.8]} rotationY={1.1} />
      <GrassTuft position={[0.2,  -0.44, -2.2]} rotationY={-0.5} />
      <GrassTuft position={[1.1,  -0.44, -2.8]} rotationY={0.8} />

      {/* ── Flowers scattered on island ───────────────────── */}
      {FLOWERS.map((f, i) => (
        <Flower key={i} position={f.pos} petalColor={f.petal} centerColor={f.center} stemH={f.stemH} scale={f.sc} />
      ))}

      {/* ── Lounge chair ──────────────────────────────────── */}
      <LoungeChair position={[-0.5, -0.30, 1.1]} rotationY={0.35} />

      {/* ── Beach umbrella ────────────────────────────────── */}
      <Umbrella position={[1.6, -0.44, 0.85]} rotationY={0.2} />

      {/* ── Low table ─────────────────────────────────────── */}
      <SmallTable position={[-1.5, 0.06, 0.7]} />

      {/* ── Succulent pot on table ────────────────────────── */}
      <SucculentPot position={[-1.78, 0.21, 0.55]} />

      {/* ── Beach shells ──────────────────────────────────── */}
      {SHELLS.map((s, i) => (
        <mesh key={i} position={s.pos} castShadow>
          <sphereGeometry args={[s.r, 10, 10]} />
          <primitive object={shellMat} attach="material" />
        </mesh>
      ))}

      {/* ── Sailboat in ocean — right side, visible from camera ── */}
      <Sailboat position={[7.2, -0.90, 2.8]} />

      {/* ── Seagulls soaring ──────────────────────────────── */}
      <Seagull position={[4.5, 3.2, 0.5]}   scale={0.9} />
      <Seagull position={[-3.2, 4.0, -1.0]} scale={0.75} />
      <Seagull position={[2.0, 4.8, -3.5]}  scale={0.65} />
    </group>
  );
}
