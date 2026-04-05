import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

/** Warm spring shell — matches scene.background / FogExp2 */
const SKY = "#F1F8E8";
const FOG_COLOR = "#F1F8E8";
const FOG_DENSITY = 0.011;
const PETAL_SKY_TINT = /* @__PURE__ */ new THREE.Color(SKY);
const PETAL_HSL_TMP = { h: 0, s: 0, l: 0 };

/** Island 1 — Harbor / lagoon (cool mass + navy-teal water) */
const HARBOR_MOSS = "#5A6D68";
const HARBOR_DEEP = "#3D4E4A";
const BLOB_DEEP = "#3A5568";
const BLOB_MID = "#4F6F82";
const BLOB_LIGHT = "#5F8496";
const BLOB_MIST = "#6E94A6";
const SLATE = "#4A5562";
const HARBOR_WATER = "#4A6B82";
const HARBOR_WATER_DEEP = "#2C4558";
const PIER_WOOD = "#8B7A62";
const RESORT_CREAM = "#F4EDE2";
const RESORT_SUN = "#E5C9A0";

/** Mascot accents — navy / coral pops on cool ground */
const MASCOT_NAVY = "#1A2A3C";
const MASCOT_CORAL = "#E85A3A";

/** Island 2 — Anchor (ochre-green, terracotta accents) */
const MATCHA = "#9BA888";
/** Solid under-island pad + cloud sea core — pale matcha (replaces ContactShadows sheets) */
const MATCHA_MIST = "#C9DAB8";
const TERRACE_A = "#86A090";
const TERRACE_B = "#5F7A6E";
const WOOD = "#A89882";
const TRUNK = "#5C4A3A";
const CANOPY = "#455E48";
const WATER = "#4F7580";
const PLANK_SLATE = "#7A8590";
const PLANK_WOOD = "#75685C";

/** Island 3 — Citadel (sand / burnt sienna strata) */
const CITADEL_SAND = "#E8D2A4";
const CITADEL_STRATA = "#C9B08A";
const TERRACOTTA = "#B86448";
const CITADEL_CREAM = "#E5D8C0";

/** Great Tree */
const SPIRAL_CORE = "#0F1E28";
const CANOPY_DARK = "#243828";
const CANOPY_MID = "#3D5A42";
const CANOPY_LIGHT = "#6E9074";

const ROUGH = 0.9;

/** Archipelago focal — mid + citadel cluster, slightly off-center */
const ARCH_CENTER: [number, number, number] = [1.2, 0.32, -0.58];

type SeededRng = () => number;

function mulberry32(seed: number): SeededRng {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Multi-sine wander — non-circular, deterministic chaos from seed */
type WanderParams = {
  cx: number;
  cz: number;
  maxRadius: number;
  layers: number;
  ax: number[];
  az: number[];
  fx: number[];
  fz: number[];
  fm: number[];
  px: number[];
  pz: number[];
  wobbleFreq: number;
  phase0: number;
  speedBase: number;
};

function buildWanderParams(seed: number, cx: number, cz: number, maxRadius: number): WanderParams {
  const rnd = mulberry32(seed);
  const layers = 4 + Math.floor(rnd() * 4);
  const ax: number[] = [];
  const az: number[] = [];
  const fx: number[] = [];
  const fz: number[] = [];
  const fm: number[] = [];
  const px: number[] = [];
  const pz: number[] = [];
  const ampScale = maxRadius / Math.sqrt(layers * 0.5);
  for (let i = 0; i < layers; i++) {
    ax.push(ampScale * (0.22 + rnd() * 0.78));
    az.push(ampScale * (0.22 + rnd() * 0.78));
    fx.push(0.09 + rnd() * 2.55);
    fz.push(0.11 + rnd() * 2.48);
    fm.push(0.94 + rnd() * 0.22 + i * 0.013);
    px.push(rnd() * Math.PI * 2);
    pz.push(rnd() * Math.PI * 2);
  }
  return {
    cx,
    cz,
    maxRadius,
    layers,
    ax,
    az,
    fx,
    fz,
    fm,
    px,
    pz,
    wobbleFreq: 2.8 + rnd() * 7.2,
    phase0: rnd() * Math.PI * 2,
    speedBase: 0.2 + rnd() * 0.68,
  };
}

function evalWanderXZ(
  p: WanderParams,
  t: number,
  speedMul: number
): { x: number; z: number; vx: number; vz: number; bouncePhase: number } {
  const s = t * p.speedBase * speedMul;
  let x = p.cx;
  let z = p.cz;
  let vx = 0;
  let vz = 0;
  const sb = p.speedBase * speedMul;
  for (let i = 0; i < p.layers; i++) {
    const m = p.fm[i];
    const txs = p.fx[i] * s + p.px[i];
    const tzs = p.fz[i] * s * m + p.pz[i];
    x += p.ax[i] * Math.sin(txs);
    z += p.az[i] * Math.sin(tzs);
    vx += p.ax[i] * p.fx[i] * sb * Math.cos(txs);
    vz += p.az[i] * p.fz[i] * sb * m * Math.cos(tzs);
  }
  const dx = x - p.cx;
  const dz = z - p.cz;
  const d = Math.hypot(dx, dz);
  if (d > p.maxRadius && d > 1e-6) {
    const k = p.maxRadius / d;
    x = p.cx + dx * k;
    z = p.cz + dz * k;
  }
  return {
    x,
    z,
    vx,
    vz,
    bouncePhase: Math.abs(Math.sin(s * p.wobbleFreq + p.phase0)),
  };
}

function useFeltGrainTexture() {
  return useMemo(() => {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const img = ctx.createImageData(size, size);
    const d = img.data;
    let seed = 901;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < d.length; i += 4) {
      const n = (rnd() - 0.5) * 28;
      const base = 208 + n * 0.32;
      d[i] = base + n * 0.92;
      d[i + 1] = base + n * 0.96;
      d[i + 2] = base + n * 1.04;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 5);
    t.anisotropy = 4;
    return t;
  }, []);
}

function useFeltBumpTexture() {
  return useMemo(() => {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const img = ctx.createImageData(size, size);
    const d = img.data;
    let s = 404;
    const rnd = () => {
      s = (s * 48271) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < d.length; i += 4) {
      const v = 110 + (rnd() - 0.5) * 50;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    return t;
  }, []);
}

function useCanopyProfileGeometry() {
  return useMemo(() => {
    const points: THREE.Vector2[] = [];
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = t * 0.44;
      const envelope = Math.pow(Math.sin(t * Math.PI), 0.92);
      const r = 0.024 + 0.2 * envelope * (0.88 + 0.12 * (1 - t));
      points.push(new THREE.Vector2(r, y));
    }
    const geo = new THREE.LatheGeometry(points, 40);
    geo.computeVertexNormals();
    return geo;
  }, []);
}

function useSpiralTubeGeometry() {
  return useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 88; i++) {
      const t = i / 88;
      const turn = t * Math.PI * 9.2;
      const y = 0.06 + t * 1.78;
      const rad = 0.038 + t * 0.26;
      pts.push(new THREE.Vector3(Math.cos(turn) * rad, y, Math.sin(turn) * rad));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 160, 0.024, 7, false);
  }, []);
}

function ShadowSetup() {
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);
  return null;
}

function DioramaCameraRig() {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(10.85, 8.32, 10.55);
    camera.lookAt(...ARCH_CENTER);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

function IslandFloat({
  x,
  y,
  z,
  speed,
  phase,
  amplitude,
  children,
}: {
  x: number;
  y: number;
  z: number;
  speed: number;
  phase: number;
  amplitude: number;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.x = x;
    ref.current.position.z = z;
    ref.current.position.y = y + Math.sin(t * speed + phase) * amplitude;
  });
  return (
    <group ref={ref} position={[x, y, z]}>
      {children}
    </group>
  );
}

function IslandFloor({
  radius,
  color,
  grainMap,
  scale = [1, 1, 1] as [number, number, number],
  rotationY = 0,
  puckHeight = 0.11,
}: {
  radius: number;
  color: string;
  grainMap: THREE.Texture | null;
  scale?: [number, number, number];
  rotationY?: number;
  puckHeight?: number;
}) {
  const matTop = (
    <meshStandardMaterial
      color={color}
      roughness={ROUGH}
      metalness={0}
      map={grainMap ?? undefined}
      bumpMap={grainMap ?? undefined}
      bumpScale={0.022}
      side={THREE.DoubleSide}
    />
  );
  const matPuck = (
    <meshStandardMaterial
      color={color}
      roughness={ROUGH}
      metalness={0}
      map={grainMap ?? undefined}
      bumpMap={grainMap ?? undefined}
      bumpScale={0.018}
    />
  );
  const half = puckHeight / 2;

  return (
    <group rotation={[0, rotationY, 0]} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} castShadow receiveShadow>
        <circleGeometry args={[radius, 80]} />
        {matTop}
      </mesh>
      <mesh rotation={[0, 0, 0]} position={[0, -half + 0.003, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[radius * 0.995, radius * 0.995, puckHeight, 72]} />
        {matPuck}
      </mesh>
    </group>
  );
}

/** Interlocking riverbed cobbles around ellipse perimeter */
function RiverbedStoneRing({
  rx,
  rz: ellipseRz,
  count,
  seed,
}: {
  rx: number;
  rz: number;
  count: number;
  seed: number;
}) {
  const rnd = useMemo(() => mulberry32(seed), [seed]);
  const items = useMemo(() => {
    const out: {
      x: number;
      z: number;
      w: number;
      h: number;
      d: number;
      rotY: number;
      rotX: number;
      rotZ: number;
      slate: boolean;
    }[] = [];
    const r = rnd;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (r() - 0.5) * 0.55;
      const bump = 0.1 + r() * 0.22;
      out.push({
        x: Math.cos(a) * (rx + bump),
        z: Math.sin(a) * (ellipseRz + bump),
        w: 0.14 + r() * 0.14,
        h: 0.05 + r() * 0.05,
        d: 0.12 + r() * 0.1,
        rotY: a + r() * 0.4,
        rotX: (r() - 0.5) * 0.25,
        rotZ: (r() - 0.5) * 0.2,
        slate: r() > 0.42,
      });
    }
    return out;
  }, [count, rx, ellipseRz, rnd]);

  return (
    <group>
      {items.map((it, i) => (
        <RoundedBox
          key={i}
          args={[it.w, it.h, it.d]}
          radius={0.035}
          smoothness={4}
          position={[it.x, it.h / 2 + 0.01, it.z]}
          rotation={[it.rotX, it.rotY, it.rotZ]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={it.slate ? SLATE : HARBOR_DEEP} roughness={0.92} metalness={0} />
        </RoundedBox>
      ))}
    </group>
  );
}

function HarborWaterBody() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.62) * 0.018;
  });
  return (
    <group ref={ref} position={[0.35, -0.125, 0.55]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[10.5, 9.2]} />
        <meshStandardMaterial color={HARBOR_WATER_DEEP} roughness={0.95} metalness={0} transparent opacity={0.94} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[8.8, 7.6]} />
        <meshStandardMaterial color={HARBOR_WATER} roughness={0.88} metalness={0} transparent opacity={0.52} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]} receiveShadow>
        <planeGeometry args={[5.5, 4.2]} />
        <meshStandardMaterial color="#8CB4CC" roughness={0.78} metalness={0} transparent opacity={0.24} />
      </mesh>
    </group>
  );
}

/**
 * Thick irregular “blue island” — interlocking spheres + rounded blocks (cloudy base + verticality).
 * Walkable deck sits at y ≈ 0.
 */
function HarborOrganicMass() {
  const lumps = useMemo(
    () => [
      { p: [0.15, -0.38, 0.05] as [number, number, number], s: [3.35, 0.72, 2.05] as [number, number, number], c: BLOB_DEEP },
      { p: [-1.15, -0.48, 0.65] as [number, number, number], s: [1.55, 1.05, 1.75] as [number, number, number], c: BLOB_MID },
      { p: [1.25, -0.44, -0.55] as [number, number, number], s: [1.65, 0.95, 1.45] as [number, number, number], c: BLOB_LIGHT },
      { p: [-0.55, -0.55, -0.85] as [number, number, number], s: [1.25, 1.15, 1.35] as [number, number, number], c: BLOB_MIST },
      { p: [1.65, -0.52, 0.85] as [number, number, number], s: [1.1, 0.88, 1.2] as [number, number, number], c: BLOB_MID },
      { p: [0.45, -0.62, 1.15] as [number, number, number], s: [1.4, 0.75, 1.0] as [number, number, number], c: BLOB_DEEP },
      { p: [-1.55, -0.35, -0.35] as [number, number, number], s: [1.2, 0.55, 1.4] as [number, number, number], c: BLOB_LIGHT },
      { p: [0.85, -0.45, -0.95] as [number, number, number], s: [1.35, 0.68, 1.15] as [number, number, number], c: BLOB_MIST },
    ],
    []
  );
  return (
    <group>
      {lumps.map((L, i) => (
        <mesh key={i} position={L.p} scale={L.s} castShadow receiveShadow>
          <sphereGeometry args={[0.5, 22, 18]} />
          <meshStandardMaterial color={L.c} roughness={0.92} metalness={0} />
        </mesh>
      ))}
      <RoundedBox args={[2.4, 0.38, 1.35]} radius={0.14} smoothness={5} position={[0.1, -0.22, -0.15]} rotation={[0.08, 0.25, 0.04]} castShadow receiveShadow>
        <meshStandardMaterial color={BLOB_MID} roughness={0.9} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[1.65, 0.32, 1.1]} radius={0.12} smoothness={4} position={[-0.85, -0.18, 0.45]} rotation={[-0.05, -0.4, 0.06]} castShadow receiveShadow>
        <meshStandardMaterial color={BLOB_DEEP} roughness={0.91} metalness={0} />
      </RoundedBox>
    </group>
  );
}

/** Patchwork turf deck — three offset ellipses for irregular outline */
function HarborTurfDeck({ grainMap }: { grainMap: THREE.Texture | null }) {
  const mat = (
    <meshStandardMaterial
      color={HARBOR_MOSS}
      roughness={ROUGH}
      metalness={0}
      map={grainMap ?? undefined}
      bumpMap={grainMap ?? undefined}
      bumpScale={0.024}
      side={THREE.DoubleSide}
    />
  );
  return (
    <group position={[0, 0.012, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[2.35, 1.15, 1]} castShadow receiveShadow>
        <circleGeometry args={[1, 56]} />
        {mat}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0.35]} position={[0.45, 0.002, 0.2]} scale={[1.85, 0.95, 1]} castShadow receiveShadow>
        <circleGeometry args={[1, 56]} />
        {mat}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, -0.22]} position={[-0.55, 0.004, -0.15]} scale={[1.55, 1.2, 1]} castShadow receiveShadow>
        <circleGeometry args={[1, 48]} />
        {mat}
      </mesh>
    </group>
  );
}

/** Small fabric pennant — gentle sway */
function DreamPennant({ y, phase }: { y: number; phase: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.z = Math.sin(t * 2.1 + phase) * 0.14;
    ref.current.rotation.x = Math.sin(t * 1.55 + phase * 0.7) * 0.07;
  });
  return (
    <group ref={ref} position={[0.2, y, 0]}>
      <mesh castShadow>
        <planeGeometry args={[0.12, 0.2]} />
        <meshStandardMaterial color="#D9A878" roughness={0.9} metalness={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Dream-city verticality: tilted “book” blocks + cream spires (abstract, not literal). */
function HarborDreamStacks() {
  const stacks = useMemo(
    () =>
      [
        { p: [-1.35, 0.02, -0.75] as [number, number, number], ry: 0.22 },
        { p: [-1.05, 0.02, -1.05] as [number, number, number], ry: -0.18 },
        { p: [1.55, 0.02, -0.35] as [number, number, number], ry: 0.45 },
        { p: [0.25, 0.02, -1.35] as [number, number, number], ry: -0.55 },
      ] as const,
    []
  );
  return (
    <group>
      {stacks.map((base, si) => (
        <group key={si} position={base.p} rotation={[0, base.ry, 0]}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <RoundedBox
              key={i}
              args={[0.2 + i * 0.02, 0.26 + (i % 3) * 0.06, 0.12 + (i % 2) * 0.03]}
              radius={0.025}
              smoothness={3}
              position={[i * 0.045 + (i % 2) * 0.03, 0.16 + i * 0.28, (i % 2) * 0.04]}
              rotation={[0.04 + i * 0.02, 0.12 * i, 0.03 * (i % 2)]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={i % 2 ? SLATE : RESORT_CREAM}
                roughness={0.88}
                metalness={0}
              />
            </RoundedBox>
          ))}
          <DreamPennant y={1.42} phase={si * 1.7} />
          <mesh position={[0.15, 1.35, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.028, 0.038, 0.95, 8]} />
            <meshStandardMaterial color={RESORT_CREAM} roughness={0.9} metalness={0} />
          </mesh>
          <mesh position={[-0.08, 1.05, 0.12]} castShadow receiveShadow>
            <cylinderGeometry args={[0.022, 0.03, 0.62, 8]} />
            <meshStandardMaterial color={BLOB_MIST} roughness={0.9} metalness={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HarborMiniBridge() {
  return (
    <group position={[0.85, 0.06, 0.55]} rotation={[0, -0.5, 0]}>
      <mesh position={[0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.035, 1.15, 10]} />
        <meshStandardMaterial color={RESORT_CREAM} roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[0.2, -0.05, 0.12]} rotation={[Math.PI / 2, 0, 0.6]} castShadow receiveShadow>
        <torusGeometry args={[0.28, 0.018, 6, 16, Math.PI * 0.42]} />
        <meshStandardMaterial color={SLATE} roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

function HarborPalm({ position, scale = 1, rotY = 0 }: { position: [number, number, number]; scale?: number; rotY?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.04, 0.055, 0.48, 8]} />
        <meshStandardMaterial color={TRUNK} roughness={0.9} metalness={0} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <group key={i} position={[0, 0.48, 0]} rotation={[0, (i / 6) * Math.PI * 2, 0]}>
          <mesh rotation={[0.55, 0, 0]} position={[0, 0.06, 0.2]} castShadow receiveShadow>
            <coneGeometry args={[0.1, 0.38, 5]} />
            <meshStandardMaterial color={CANOPY_MID} roughness={0.9} metalness={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HarborBeachUmbrella({ position, rotY = 0 }: { position: [number, number, number]; rotY?: number }) {
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.012, 0.014, 0.26, 8]} />
        <meshStandardMaterial color={SLATE} roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.32, 0.12, 8]} />
        <meshStandardMaterial color={RESORT_SUN} roughness={0.88} metalness={0} />
      </mesh>
    </group>
  );
}

function HarborBuoy({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.14, 6]} />
        <meshStandardMaterial color={SLATE} roughness={0.85} metalness={0} />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <sphereGeometry args={[0.055, 14, 12]} />
        <meshStandardMaterial color="#E8A87C" roughness={0.88} metalness={0} />
      </mesh>
    </group>
  );
}

const HARBOR_MASCOT_MINT = "#C8E8E0";
const HARBOR_MASCOT_TEAL = "#3D8A88";
const ANCHOR_MASCOT_GOLD = "#E8D4A0";
const ANCHOR_MASCOT_OCHRE = "#8B6239";
const CITADEL_MASCOT_BLUSH = "#E8B8B0";
const CITADEL_MASCOT_INK = "#2E3A52";

/** Per-island mascot: multi-sine wander (not a loop), unique silhouette + palette */
function IslandWanderMascot({
  seed,
  speedMul,
  center,
  maxRadius,
  yGround,
  scale,
  variant,
}: {
  seed: number;
  speedMul: number;
  center: [number, number];
  maxRadius: number;
  yGround: number;
  scale: number;
  variant: "harbor" | "anchor" | "citadel";
}) {
  const params = useMemo(
    () => buildWanderParams(seed, center[0], center[1], maxRadius),
    [seed, center[0], center[1], maxRadius]
  );
  const ref = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const rotY = useRef(0);
  const legGain = variant === "citadel" ? 0.32 : variant === "anchor" ? 0.48 : 0.4;

  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const { x, z, vx, vz, bouncePhase } = evalWanderXZ(params, clock.elapsedTime, speedMul);
    const bounce = bouncePhase * 0.055 * scale;
    ref.current.position.set(x, yGround + bounce, z);

    const spd = Math.hypot(vx, vz);
    if (spd > 0.006) {
      const targetY = Math.atan2(vx, vz);
      let dy = targetY - rotY.current;
      if (dy > Math.PI) dy -= Math.PI * 2;
      if (dy < -Math.PI) dy += Math.PI * 2;
      rotY.current += dy * Math.min(1, 12 * delta);
    }
    ref.current.rotation.y = rotY.current;

    const stride = Math.sin(clock.elapsedTime * params.wobbleFreq * speedMul * 1.12 + seed * 0.01);
    if (legL.current) legL.current.rotation.x = stride * legGain;
    if (legR.current) legR.current.rotation.x = -stride * legGain;
  });

  if (variant === "harbor") {
    return (
      <group ref={ref} scale={scale}>
        <mesh position={[0, 0.19, 0]} castShadow>
          <sphereGeometry args={[0.19, 16, 14]} />
          <meshStandardMaterial color={HARBOR_MASCOT_MINT} roughness={0.9} metalness={0} />
        </mesh>
        <mesh position={[0, 0.33, 0.04]} castShadow>
          <sphereGeometry args={[0.14, 14, 12]} />
          <meshStandardMaterial color={HARBOR_MASCOT_MINT} roughness={0.88} metalness={0} />
        </mesh>
        <mesh position={[-0.1, 0.4, 0]} rotation={[0, 0, -0.4]} castShadow>
          <sphereGeometry args={[0.048, 8, 6]} />
          <meshStandardMaterial color={HARBOR_MASCOT_TEAL} roughness={0.9} metalness={0} />
        </mesh>
        <mesh position={[0.1, 0.4, 0]} rotation={[0, 0, 0.4]} castShadow>
          <sphereGeometry args={[0.048, 8, 6]} />
          <meshStandardMaterial color={HARBOR_MASCOT_TEAL} roughness={0.9} metalness={0} />
        </mesh>
        <mesh position={[-0.038, 0.34, 0.11]} castShadow>
          <sphereGeometry args={[0.02, 6, 5]} />
          <meshStandardMaterial color={MASCOT_NAVY} roughness={0.78} metalness={0.02} />
        </mesh>
        <mesh position={[0.038, 0.34, 0.11]} castShadow>
          <sphereGeometry args={[0.02, 6, 5]} />
          <meshStandardMaterial color={MASCOT_NAVY} roughness={0.78} metalness={0.02} />
        </mesh>
        <mesh position={[0, 0.3, 0.125]} castShadow>
          <sphereGeometry args={[0.024, 8, 6]} />
          <meshStandardMaterial color={MASCOT_CORAL} roughness={0.86} metalness={0} />
        </mesh>
        <group ref={legL} position={[-0.075, 0.07, 0]}>
          <mesh position={[0, -0.045, 0]} castShadow>
            <capsuleGeometry args={[0.04, 0.065, 5, 8]} />
            <meshStandardMaterial color={HARBOR_MASCOT_TEAL} roughness={0.9} metalness={0} />
          </mesh>
        </group>
        <group ref={legR} position={[0.075, 0.07, 0]}>
          <mesh position={[0, -0.045, 0]} castShadow>
            <capsuleGeometry args={[0.04, 0.065, 5, 8]} />
            <meshStandardMaterial color={HARBOR_MASCOT_TEAL} roughness={0.9} metalness={0} />
          </mesh>
        </group>
        <mesh position={[0, 0.2, -0.14]} castShadow>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshStandardMaterial color={MASCOT_CORAL} roughness={0.9} metalness={0} />
        </mesh>
      </group>
    );
  }

  if (variant === "anchor") {
    return (
      <group ref={ref} scale={scale}>
        <RoundedBox args={[0.32, 0.22, 0.26]} radius={0.07} smoothness={4} position={[0, 0.14, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={ANCHOR_MASCOT_GOLD} roughness={0.9} metalness={0} />
        </RoundedBox>
        <RoundedBox args={[0.22, 0.18, 0.2]} radius={0.06} smoothness={4} position={[0, 0.34, 0.02]} castShadow receiveShadow>
          <meshStandardMaterial color={ANCHOR_MASCOT_GOLD} roughness={0.88} metalness={0} />
        </RoundedBox>
        <mesh position={[0, 0.48, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.12, 0.2, 6]} />
          <meshStandardMaterial color={CANOPY_MID} roughness={0.9} metalness={0} />
        </mesh>
        <mesh position={[-0.06, 0.36, 0.12]} castShadow>
          <sphereGeometry args={[0.028, 6, 5]} />
          <meshStandardMaterial color={ANCHOR_MASCOT_OCHRE} roughness={0.82} metalness={0} />
        </mesh>
        <mesh position={[0.06, 0.36, 0.12]} castShadow>
          <sphereGeometry args={[0.028, 6, 5]} />
          <meshStandardMaterial color={ANCHOR_MASCOT_OCHRE} roughness={0.82} metalness={0} />
        </mesh>
        <mesh position={[0, 0.32, 0.14]} castShadow>
          <boxGeometry args={[0.05, 0.04, 0.04]} />
          <meshStandardMaterial color={TERRACOTTA} roughness={0.88} metalness={0} />
        </mesh>
        <group ref={legL} position={[-0.1, 0.04, 0]}>
          <mesh position={[0, -0.055, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.08, 5, 8]} />
            <meshStandardMaterial color={ANCHOR_MASCOT_OCHRE} roughness={0.9} metalness={0} />
          </mesh>
        </group>
        <group ref={legR} position={[0.1, 0.04, 0]}>
          <mesh position={[0, -0.055, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.08, 5, 8]} />
            <meshStandardMaterial color={ANCHOR_MASCOT_OCHRE} roughness={0.9} metalness={0} />
          </mesh>
        </group>
      </group>
    );
  }

  return (
    <group ref={ref} scale={scale}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <sphereGeometry args={[0.13, 14, 12]} />
        <meshStandardMaterial color={CITADEL_MASCOT_BLUSH} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.11, 12, 10]} />
        <meshStandardMaterial color={CITADEL_CREAM} roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.1, 0.018, 6, 16]} />
        <meshStandardMaterial color={TERRACOTTA} roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[-0.045, 0.32, 0.09]} castShadow>
        <sphereGeometry args={[0.018, 6, 5]} />
        <meshStandardMaterial color={CITADEL_MASCOT_INK} roughness={0.75} metalness={0.02} />
      </mesh>
      <mesh position={[0.045, 0.32, 0.09]} castShadow>
        <sphereGeometry args={[0.018, 6, 5]} />
        <meshStandardMaterial color={CITADEL_MASCOT_INK} roughness={0.75} metalness={0.02} />
      </mesh>
      <group ref={legL} position={[-0.06, 0.05, 0]}>
        <mesh position={[0, -0.035, 0]} castShadow>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshStandardMaterial color={TERRACOTTA} roughness={0.9} metalness={0} />
        </mesh>
      </group>
      <group ref={legR} position={[0.06, 0.05, 0]}>
        <mesh position={[0, -0.035, 0]} castShadow>
          <sphereGeometry args={[0.04, 8, 6]} />
          <meshStandardMaterial color={TERRACOTTA} roughness={0.9} metalness={0} />
        </mesh>
      </group>
    </group>
  );
}

const CLOUD_TOY_PALETTES: Record<string, [string, string]> = {
  mist: ["#EEF6F4", "#D8EAE6"],
  blossom: ["#F8ECF2", "#E5D0DC"],
  lemon: ["#F9F6E0", "#E6E4C4"],
  sea: ["#E4EEF4", "#CEDEE8"],
  mint: ["#E2F2EA", "#C8E4D8"],
  /** Soft blue-grey — pairs with reference plate */
  plate: ["#DCECF4", "#C8DDE8"],
  plateTeal: ["#D4EBE6", "#BFE0D8"],
};

/** Reference plate — muted, non-neon (toy petals + ring scatter) */
const FAIRY_PETAL_PALETTE = ["#4B89BF", "#88BFB0", "#F2EDDF", "#F2C879", "#F2A950"];
const FAIRY_PETAL_COOL_BIAS = ["#4B89BF", "#4B89BF", "#88BFB0", "#88BFB0", "#F2EDDF", "#F2C879"];

/** Soft stacked spheres — “toy cloud”; palette + seed give variety */
function SoftCloudletCluster({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  seed,
  palette = "mist",
  lobeCount = 8,
  lobeSpreadMul = 1,
  lobeSizeMul = 1,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  seed: number;
  palette?: keyof typeof CLOUD_TOY_PALETTES;
  lobeCount?: number;
  lobeSpreadMul?: number;
  lobeSizeMul?: number;
}) {
  const lobes = useMemo(() => {
    const rnd = mulberry32(seed);
    const [a, b] = CLOUD_TOY_PALETTES[palette] ?? CLOUD_TOY_PALETTES.mist;
    const n = Math.max(5, Math.min(12, lobeCount));
    const sm = lobeSpreadMul;
    const zm = lobeSizeMul;
    const out: { p: [number, number, number]; s: number; c: string }[] = [];
    for (let i = 0; i < n; i++) {
      out.push({
        p: [(rnd() - 0.5) * 0.68 * sm, (rnd() * 0.32 + 0.04) * sm, (rnd() - 0.5) * 0.58 * sm],
        s: (0.09 + rnd() * 0.17) * zm,
        c: rnd() > 0.5 ? a : b,
      });
    }
    return out;
  }, [seed, palette, lobeCount, lobeSpreadMul, lobeSizeMul]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {lobes.map((b, i) => (
        <mesh key={i} position={b.p} castShadow receiveShadow>
          <sphereGeometry args={[b.s, 12, 10]} />
          <meshStandardMaterial color={b.c} roughness={0.96} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/** Squashed chips — petal toys; palette from reference plate (no neon) */
function PierFairyPetals({
  seed,
  position = [0, 0, 0],
  flakeCount = 20,
  spread = 1,
  coolTint = false,
  sizeMul = 1,
}: {
  seed: number;
  position?: [number, number, number];
  flakeCount?: number;
  spread?: number;
  coolTint?: boolean;
  sizeMul?: number;
}) {
  const flakes = useMemo(() => {
    const rnd = mulberry32(seed);
    const colors = coolTint ? FAIRY_PETAL_COOL_BIAS : FAIRY_PETAL_PALETTE;
    const n = Math.max(8, Math.min(32, flakeCount));
    return Array.from({ length: n }, () => ({
      p: [(rnd() - 0.5) * 1.12 * spread, rnd() * 0.58 * spread, (rnd() - 0.5) * 1.02 * spread] as [
        number,
        number,
        number,
      ],
      ry: rnd() * 6.28,
      sc: (0.5 + rnd() * 0.95) * sizeMul,
      c: colors[Math.floor(rnd() * colors.length)]!,
    }));
  }, [seed, flakeCount, spread, coolTint, sizeMul]);

  return (
    <group position={position}>
      {flakes.map((f, i) => (
        <mesh
          key={i}
          position={f.p}
          rotation={[0.25 + i * 0.05, f.ry, 0.12]}
          scale={[f.sc * 0.13, f.sc * 0.038, f.sc * 0.11]}
          castShadow
        >
          <sphereGeometry args={[0.5, 10, 8]} />
          <meshStandardMaterial color={f.c} roughness={0.88} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/** Geometric “ring + crystal” toy — contrasts with fluffy cloud cluster */
function DreamToyRingScatter({ seed }: { seed: number }) {
  const bits = useMemo(() => {
    const rnd = mulberry32(seed);
    const cols = FAIRY_PETAL_PALETTE;
    type Bit = {
      kind: "torus" | "oct";
      p: [number, number, number];
      r: [number, number, number];
      col: string;
      sc: number;
      arc: number;
    };
    const out: Bit[] = [];
    for (let i = 0; i < 8; i++) {
      out.push({
        kind: "torus",
        p: [(rnd() - 0.5) * 1.55, rnd() * 0.55 + 0.08, (rnd() - 0.5) * 1.35],
        r: [rnd() * 0.55, rnd() * 6.28, rnd() * 0.55],
        col: cols[Math.floor(rnd() * cols.length)]!,
        sc: 0.62 + rnd() * 0.48,
        arc: Math.PI * (1.35 + rnd() * 0.55),
      });
    }
    for (let i = 0; i < 6; i++) {
      out.push({
        kind: "oct",
        p: [(rnd() - 0.5) * 1.35, rnd() * 0.48, (rnd() - 0.5) * 1.2],
        r: [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28],
        col: cols[Math.floor(rnd() * cols.length)]!,
        sc: 0.38 + rnd() * 0.52,
        arc: 0,
      });
    }
    return out;
  }, [seed]);

  return (
    <group>
      {bits.map((b, i) =>
        b.kind === "torus" ? (
          <mesh key={i} position={b.p} rotation={b.r} scale={b.sc}>
            <torusGeometry args={[0.44, 0.048, 9, 32, b.arc]} />
            <meshStandardMaterial color={b.col} roughness={0.9} metalness={0} />
          </mesh>
        ) : (
          <mesh key={i} position={b.p} rotation={b.r} scale={b.sc}>
            <octahedronGeometry args={[0.15, 0]} />
            <meshStandardMaterial color={b.col} roughness={0.91} metalness={0} />
          </mesh>
        )
      )}
    </group>
  );
}

/** Gentle bob for floating toy clusters in the open mist */
function DreamToyBob({ phase = 0, amp = 0.07, children }: { phase?: number; amp?: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.72 + phase) * amp;
  });
  return <group ref={ref}>{children}</group>;
}

/** Two large outer toys only — A fluffy mega-cloud vs B ring/crystal field */
function WorldScatterDreamToys() {
  return (
    <>
      <group position={[-18.4, 1.62, 5.4]} rotation={[0, 0.28, 0]} scale={2.35}>
        <DreamToyBob phase={0.45} amp={0.11}>
          <SoftCloudletCluster
            position={[0, 0.22, 0]}
            scale={1.05}
            seed={31001}
            palette="plate"
            lobeCount={12}
            lobeSpreadMul={1.32}
            lobeSizeMul={1.45}
          />
          <SoftCloudletCluster
            position={[0.42, 0.04, -0.28]}
            scale={0.78}
            rotation={[0, -0.62, 0]}
            seed={31002}
            palette="plateTeal"
            lobeCount={9}
            lobeSpreadMul={1.12}
            lobeSizeMul={1.2}
          />
          <PierFairyPetals seed={31003} flakeCount={28} spread={1.38} sizeMul={1.42} />
          <mesh position={[0.22, 0.58, -0.16]}>
            <sphereGeometry args={[0.075, 8, 6]} />
            <meshBasicMaterial color="#F2EDDF" transparent opacity={0.2} depthWrite={false} />
          </mesh>
        </DreamToyBob>
      </group>

      <group position={[18.2, 1.48, -9.1]} rotation={[0, -0.82, 0]} scale={2.18}>
        <DreamToyBob phase={2.35} amp={0.1}>
          <DreamToyRingScatter seed={32001} />
          <PierFairyPetals seed={32002} flakeCount={22} spread={1.22} sizeMul={1.28} coolTint />
          <mesh position={[0.15, 0.72, 0.08]}>
            <sphereGeometry args={[0.065, 7, 6]} />
            <meshBasicMaterial color="#88BFB0" transparent opacity={0.16} depthWrite={false} />
          </mesh>
        </DreamToyBob>
      </group>
    </>
  );
}

/** Log pier — posts + spanning cylinders (deck sits higher on lagoon island) */
function LogPathPier({ deckLift = 0 }: { deckLift?: number }) {
  const posts = useMemo(
    () => [
      [0.15, 0.1, 0.35],
      [0.15, 0.1, 0.95],
      [0.85, 0.1, 0.35],
      [0.85, 0.1, 0.95],
      [1.65, 0.08, 0.65],
    ] as [number, number, number][],
    []
  );
  const ly = deckLift;
  return (
    <group position={[-0.15, ly, 0.2]} rotation={[0, 0.35, 0]}>
      {posts.map((p, i) => (
        <mesh key={i} position={p} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.055, 0.2, 10]} />
          <meshStandardMaterial color={SLATE} roughness={0.9} metalness={0} />
        </mesh>
      ))}
      {[
        [1.72, 0.06, 0.38],
        [1.58, 0.07, 0.92],
        [1.02, 0.09, 1.05],
      ].map((p, i) => (
        <mesh key={`far-${i}`} position={p as [number, number, number]} castShadow receiveShadow>
          <cylinderGeometry args={[0.038, 0.042, 0.16, 8]} />
          <meshStandardMaterial color={PIER_WOOD} roughness={0.91} metalness={0} />
        </mesh>
      ))}
      {[0.48, 1.12].map((z, i) => (
        <mesh key={`b-${i}`} position={[0.52, 0.22 + ly, z]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.042, 0.042, 1.72, 14]} />
          <meshStandardMaterial color={PIER_WOOD} roughness={0.9} metalness={0} />
        </mesh>
      ))}
      <group position={[1.36, 0.34, 0.7]}>
        <SoftCloudletCluster position={[0, 0.26, 0]} scale={1.08} seed={7712} />
        <SoftCloudletCluster position={[0.22, 0.1, -0.12]} scale={0.62} rotation={[0, 0.55, 0]} seed={7713} />
        <PierFairyPetals seed={4412} position={[0.02, 0.02, 0.04]} />
        <mesh position={[0.35, 0.42, -0.08]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          <meshBasicMaterial color="#F2EDDF" transparent opacity={0.26} depthWrite={false} />
        </mesh>
        <mesh position={[-0.12, 0.38, 0.14]}>
          <sphereGeometry args={[0.04, 6, 5]} />
          <meshBasicMaterial color="#88BFB0" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function PuddingRock({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <sphereGeometry args={[0.11, 20, 18]} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} />
    </mesh>
  );
}

/** Abstract miniature mall + vehicles — matte, low toy-literal */
function HarborMiniUrban() {
  return (
    <group position={[-1.1, 0, 0.85]} rotation={[0, 0.5, 0]}>
      <RoundedBox args={[0.38, 0.14, 0.28]} radius={0.03} position={[0, 0.07, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#8E969E" roughness={0.88} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[0.22, 0.2, 0.2]} radius={0.04} position={[0.38, 0.1, 0.08]} castShadow receiveShadow>
        <meshStandardMaterial color="#A8B0B8" roughness={0.85} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[0.18, 0.16, 0.24]} radius={0.03} position={[-0.32, 0.08, -0.05]} castShadow receiveShadow>
        <meshStandardMaterial color={CITADEL_CREAM} roughness={0.9} metalness={0} />
      </RoundedBox>
      {[
        [0.55, 0.035, 0.35],
        [-0.45, 0.028, -0.4],
        [0.12, 0.028, -0.52],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={[0.1, 0.04, 0.06]} />
          <meshStandardMaterial color={i ? SLATE : "#6A6F78"} roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function Tree({
  position,
  scale = 1,
  canopyGeo,
  feltBump,
}: {
  position: [number, number, number];
  scale?: number;
  canopyGeo: THREE.LatheGeometry;
  feltBump: THREE.Texture | null;
}) {
  const trunkH = 0.56;
  return (
    <group position={position} scale={scale} rotation={[0, 0, 0]}>
      <mesh position={[0, trunkH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.014, 0.019, trunkH, 10]} />
        <meshStandardMaterial color={TRUNK} roughness={ROUGH} metalness={0} />
      </mesh>
      <mesh position={[0, trunkH, 0]} castShadow receiveShadow geometry={canopyGeo}>
        <meshStandardMaterial
          color={CANOPY}
          roughness={ROUGH}
          metalness={0}
          bumpMap={feltBump ?? undefined}
          bumpScale={0.04}
        />
      </mesh>
    </group>
  );
}

function GreatCitadelTree({
  position,
  canopyGeo,
  feltBump,
  spiralGeo,
}: {
  position: [number, number, number];
  canopyGeo: THREE.LatheGeometry;
  feltBump: THREE.Texture | null;
  spiralGeo: THREE.TubeGeometry;
}) {
  const trunkH = 1.18;
  const base = trunkH;
  return (
    <group position={position} rotation={[0, 0, 0]}>
      <mesh position={[0, trunkH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.03, 0.038, trunkH, 12]} />
        <meshStandardMaterial color={TRUNK} roughness={ROUGH} metalness={0} />
      </mesh>
      <mesh geometry={spiralGeo} position={[0, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={SPIRAL_CORE} roughness={0.86} metalness={0} />
      </mesh>
      <mesh position={[0, base + 0.18, 0]} scale={[1.48, 0.92, 1.48]} castShadow receiveShadow geometry={canopyGeo}>
        <meshStandardMaterial
          color={CANOPY_DARK}
          roughness={ROUGH}
          metalness={0}
          bumpMap={feltBump ?? undefined}
          bumpScale={0.048}
        />
      </mesh>
      <mesh position={[0, base + 0.52, 0]} scale={[1.12, 0.7, 1.12]} castShadow receiveShadow geometry={canopyGeo}>
        <meshStandardMaterial
          color={CANOPY_MID}
          roughness={ROUGH}
          metalness={0}
          bumpMap={feltBump ?? undefined}
          bumpScale={0.04}
        />
      </mesh>
      <mesh position={[0, base + 0.82, 0]} scale={[0.78, 0.55, 0.78]} castShadow receiveShadow geometry={canopyGeo}>
        <meshStandardMaterial
          color={CANOPY_LIGHT}
          roughness={ROUGH}
          metalness={0}
          bumpMap={feltBump ?? undefined}
          bumpScale={0.036}
        />
      </mesh>
    </group>
  );
}

function Windmill({ position }: { position: [number, number, number] }) {
  const bladesRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const speedRef = useRef(0.28);
  const speedVel = useRef(0);

  useFrame((_, delta) => {
    const target = hovered ? 1.35 : 0.28;
    const k = 2.2;
    const d = 4.5;
    const accel = k * (target - speedRef.current) - d * speedVel.current;
    speedVel.current += accel * delta;
    speedRef.current += speedVel.current * delta;
    speedRef.current = THREE.MathUtils.clamp(speedRef.current, 0.2, 1.6);
    if (bladesRef.current) bladesRef.current.rotation.z += delta * speedRef.current;
  });

  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.72, 18]} />
        <meshStandardMaterial color={WOOD} roughness={ROUGH} metalness={0} />
      </mesh>
      <group ref={bladesRef} position={[0, 0.72, 0]}>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((rz, i) => (
          <mesh key={i} rotation-z={rz} castShadow receiveShadow>
            <boxGeometry args={[0.72, 0.028, 0.016]} />
            <meshStandardMaterial color="#DDD5CA" roughness={ROUGH} metalness={0} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function fivePetalShape(outerR: number, innerR: number): THREE.Shape {
  const shape = new THREE.Shape();
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const x0 = Math.cos(a0) * innerR;
    const y0 = Math.sin(a0) * innerR;
    const xm = Math.cos(a1) * outerR;
    const ym = Math.sin(a1) * outerR;
    const x1 = Math.cos(a2) * innerR;
    const y1 = Math.sin(a2) * innerR;
    if (i === 0) shape.moveTo(x0, y0);
    shape.quadraticCurveTo(xm, ym, x1, y1);
  }
  return shape;
}

const sharedFeltFlowerGeo = (() => {
  const sh = fivePetalShape(0.055, 0.018);
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: 0.014,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.003,
    bevelSegments: 2,
    curveSegments: 12,
  });
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
})();

function FeltFlower({
  position,
  color,
  rotationY,
  feltBump,
}: {
  position: [number, number, number];
  color: string;
  rotationY: number;
  feltBump: THREE.Texture | null;
}) {
  return (
    <mesh geometry={sharedFeltFlowerGeo} position={position} rotation-y={rotationY} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        roughness={ROUGH}
        metalness={0}
        bumpMap={feltBump ?? undefined}
        bumpScale={0.055}
      />
    </mesh>
  );
}

function ScatterFlowers({
  seed,
  count,
  maxRadius,
  innerRadius,
  feltBump,
}: {
  seed: number;
  count: number;
  maxRadius: number;
  innerRadius: number;
  feltBump: THREE.Texture | null;
}) {
  const data = useMemo(() => {
    const colors = ["#D4A088", "#E0C090", "#7A9EB0", "#A8BCC8"];
    const rnd = mulberry32(seed);
    const out: { p: [number, number, number]; c: string; ry: number }[] = [];
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2;
      const r = innerRadius + rnd() * (maxRadius - innerRadius);
      const jitter = (rnd() - 0.5) * 0.08;
      out.push({
        p: [Math.cos(a) * r + jitter, 0.009, Math.sin(a) * r + jitter],
        c: colors[Math.floor(rnd() * colors.length)]!,
        ry: rnd() * Math.PI * 2,
      });
    }
    return out;
  }, [seed, count, maxRadius, innerRadius]);

  return (
    <group>
      {data.map((f, i) => (
        <FeltFlower key={i} position={f.p} color={f.c} rotationY={f.ry} feltBump={feltBump} />
      ))}
    </group>
  );
}

function ScatterMochiRocks({
  seed,
  count,
  maxRadius,
  innerRadius,
  tints,
}: {
  seed: number;
  count: number;
  maxRadius: number;
  innerRadius: number;
  tints: string[];
}) {
  const data = useMemo(() => {
    const rnd = mulberry32(seed);
    const out: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [];
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2;
      const r = innerRadius + rnd() * (maxRadius - innerRadius);
      out.push({
        p: [Math.cos(a) * r, 0.032 + rnd() * 0.025, Math.sin(a) * r],
        s: [0.75 + rnd() * 0.65, 0.48 + rnd() * 0.42, 0.72 + rnd() * 0.55],
        c: tints[Math.floor(rnd() * tints.length)]!,
      });
    }
    return out;
  }, [seed, count, maxRadius, innerRadius, tints]);

  return (
    <group>
      {data.map((r, i) => (
        <mesh key={i} position={r.p} scale={r.s} castShadow receiveShadow>
          <sphereGeometry args={[0.062, 14, 12]} />
          <meshStandardMaterial color={r.c} roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function LogPlankPath() {
  const count = 14;
  const startZ = -0.72;
  const spacing = 0.1;
  const radius = 0.048;
  const length = 0.11;

  const planks = useMemo(() => {
    const out: { key: string; z: number; color: string; rot: number }[] = [];
    for (let i = 0; i < count; i++) {
      out.push({
        key: `p-${i}`,
        z: startZ + i * spacing,
        color: i % 2 === 0 ? PLANK_SLATE : PLANK_WOOD,
        rot: (i * 0.31) % (Math.PI * 2),
      });
    }
    return out;
  }, []);

  return (
    <group position={[0.05, radius, 0]}>
      {planks.map((p) => (
        <mesh key={p.key} position={[0, 0, p.z]} rotation={[0, p.rot, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, length, 20]} />
          <meshStandardMaterial color={p.color} roughness={ROUGH} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function TerracesCenter() {
  const matProps = { roughness: ROUGH, metalness: 0 };
  return (
    <group position={[0.15, 0, -0.55]}>
      <RoundedBox args={[2.35, 0.32, 1.75]} radius={0.16} smoothness={5} position={[0, 0.16, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={TERRACE_A} {...matProps} />
      </RoundedBox>
      <RoundedBox args={[1.85, 0.28, 1.35]} radius={0.14} smoothness={5} position={[-0.25, 0.48, -0.15]} castShadow receiveShadow>
        <meshStandardMaterial color={TERRACE_B} {...matProps} />
      </RoundedBox>
      <RoundedBox args={[1.35, 0.24, 1.05]} radius={0.12} smoothness={5} position={[0.1, 0.76, -0.32]} castShadow receiveShadow>
        <meshStandardMaterial color={TERRACE_A} {...matProps} />
      </RoundedBox>
      <mesh position={[-0.55, 0.42, 0.35]} rotation={[-Math.PI / 2 - 0.08, 0, 0]} castShadow receiveShadow>
        <planeGeometry args={[0.55, 0.9]} />
        <meshStandardMaterial color={WATER} {...matProps} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

/** Cut-away strata cylinder stack */
function CitadelStrataBase() {
  const stacked = useMemo(() => {
    const layers = [
      { r: 1.42, h: 0.15, c: TERRACOTTA },
      { r: 1.32, h: 0.13, c: CITADEL_SAND },
      { r: 1.22, h: 0.12, c: CITADEL_STRATA },
      { r: 1.1, h: 0.11, c: CITADEL_SAND },
      { r: 0.98, h: 0.1, c: TERRACOTTA },
      { r: 0.86, h: 0.09, c: CITADEL_CREAM },
    ];
    let acc = 0;
    return layers.map((L) => {
      const cy = acc + L.h / 2;
      acc += L.h;
      return { ...L, cy };
    });
  }, []);

  return (
    <group>
      {stacked.map((L, i) => (
        <mesh key={i} position={[0, L.cy, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[L.r, L.r * 0.97, L.h, 32]} />
          <meshStandardMaterial color={L.c} roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/** Low-opacity instanced geometric dust — full-frame mist field */
function GeometricDust({ count = 420 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geom = useMemo(() => new THREE.OctahedronGeometry(0.032, 0), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#B8D0C4",
        transparent: true,
        opacity: 0.095,
        depthWrite: false,
      }),
    []
  );

  useLayoutEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const rnd = mulberry32(8844);
    const v = new THREE.Vector3();
    const span = 62;
    for (let i = 0; i < count; i++) {
      v.set(
        (rnd() - 0.5) * span,
        -3.2 + rnd() * 26,
        (rnd() - 0.5) * span
      );
      e.set(rnd() * Math.PI * 2, rnd() * Math.PI * 2, rnd() * Math.PI * 2);
      q.setFromEuler(e);
      const s = 0.28 + rnd() * 1.25;
      m.compose(v, q, new THREE.Vector3(s, s, s));
      ref.current.setMatrixAt(i, m);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.018;
  });

  return <instancedMesh ref={ref} args={[geom, mat, count]} frustumCulled={false} />;
}

/** Thin floating felt / pollen slivers — full-frame, high-key */
function FloatingVacuumShards({ count = 160 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geom = useMemo(() => new THREE.BoxGeometry(0.09, 0.012, 0.07), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#EEF6F0",
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
      }),
    []
  );

  useLayoutEffect(() => {
    if (!ref.current) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const rnd = mulberry32(6601);
    const v = new THREE.Vector3();
    const span = 58;
    for (let i = 0; i < count; i++) {
      v.set(
        (rnd() - 0.5) * span,
        -2.5 + rnd() * 24,
        (rnd() - 0.5) * span
      );
      e.set(rnd() * 6.28, rnd() * 6.28, rnd() * 6.28);
      q.setFromEuler(e);
      const sx = 0.45 + rnd() * 1.45;
      m.compose(v, q, new THREE.Vector3(sx, 0.35 + rnd() * 0.95, sx * 0.85));
      ref.current.setMatrixAt(i, m);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.011;
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.31) * 0.06;
  });

  return <instancedMesh ref={ref} args={[geom, mat, count]} frustumCulled={false} />;
}

function HarborSailboat() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = -0.052 + Math.sin(clock.elapsedTime * 0.9) * 0.038;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.14) * 0.12;
  });
  return (
    <group ref={ref} position={[2.08, -0.052, 1.32]}>
      <mesh position={[0, 0.035, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.075, 0.15]} />
        <meshStandardMaterial color={PIER_WOOD} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.017, 0.4, 6]} />
        <meshStandardMaterial color={SLATE} roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[0.1, 0.26, 0]} rotation={[0, 0, -0.38]} castShadow receiveShadow>
        <coneGeometry args={[0.26, 0.36, 4]} />
        <meshStandardMaterial color={RESORT_CREAM} roughness={0.88} metalness={0} />
      </mesh>
    </group>
  );
}

function HarborStringLights() {
  const bulbs = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i <= 18; i++) {
      const t = i / 18;
      out.push([0.15 + t * 1.55, 0.52 + Math.sin(t * Math.PI) * 0.1, 0.28 + t * 0.62]);
    }
    return out;
  }, []);
  return (
    <group position={[0.35, 0, 0.45]} rotation={[0, 0.28, 0]}>
      <mesh position={[0.15, 0.52, 0.28]} castShadow receiveShadow>
        <cylinderGeometry args={[0.006, 0.006, 1.85, 4]} />
        <meshStandardMaterial color={SLATE} roughness={0.85} metalness={0} />
      </mesh>
      {bulbs.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[0.026, 8, 8]} />
          <meshStandardMaterial
            color={RESORT_CREAM}
            roughness={0.82}
            metalness={0}
            emissive="#FFF0DD"
            emissiveIntensity={0.09}
          />
        </mesh>
      ))}
    </group>
  );
}

function HarborLoungeSet() {
  const chair = (px: number, pz: number, ry: number) => (
    <group position={[px, 0, pz]} rotation={[0, ry, 0]}>
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 0.05, 0.36]} />
        <meshStandardMaterial color={SLATE} roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[0, 0.14, -0.12]} rotation={[-0.4, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.025, 0.24]} />
        <meshStandardMaterial color={PIER_WOOD} roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
  return (
    <group position={[0.62, 0, 0.68]} rotation={[0, -0.35, 0]}>
      {chair(0, 0, 0.2)}
      {chair(0.38, 0.12, -0.15)}
      <mesh position={[0.2, 0.03, 0.08]} rotation={[-Math.PI / 2, 0, 0.15]} receiveShadow>
        <circleGeometry args={[0.22, 20]} />
        <meshStandardMaterial color={HARBOR_WATER} roughness={0.92} metalness={0} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function HarborSecondGangway() {
  return (
    <group position={[-0.55, 0.04, 1.15]} rotation={[0, 1.1, 0]}>
      {[0, 0.45, 0.9].map((z, i) => (
        <mesh key={i} position={[0.35, 0.1, z]} castShadow receiveShadow>
          <cylinderGeometry args={[0.038, 0.04, 0.14, 8]} />
          <meshStandardMaterial color={SLATE} roughness={0.88} metalness={0} />
        </mesh>
      ))}
      {[1.12, 1.34].map((z, i) => (
        <mesh key={`deep-${i}`} position={[0.32, 0.075, z]} castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.034, 0.11, 7]} />
          <meshStandardMaterial color="#6A7580" roughness={0.9} metalness={0} />
        </mesh>
      ))}
      <mesh position={[0.55, 0.18, 0.45]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.038, 0.038, 1.05, 12]} />
        <meshStandardMaterial color={PIER_WOOD} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0.52, 0.18, 1.22]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.62, 10]} />
        <meshStandardMaterial color={PIER_WOOD} roughness={0.92} metalness={0} />
      </mesh>
      <group position={[0.34, 0.4, 0.52]}>
        <SoftCloudletCluster position={[0, 0, 0]} scale={0.78} rotation={[0, 0.5, 0]} seed={9021} />
        <SoftCloudletCluster position={[-0.18, -0.06, 0.14]} scale={0.48} rotation={[0, -0.35, 0]} seed={9022} />
        <PierFairyPetals seed={8833} position={[0.04, -0.04, 0.02]} />
        <mesh position={[0.12, 0.2, -0.06]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshBasicMaterial color="#F2C879" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Large soft mist orbs — mint morning mist, corners + mid field */
function SkyMistOrbs() {
  const cfg = useMemo(
    () => [
      { p: [-7.2, 3.6, 1.5] as [number, number, number], s: [3.8, 0.5, 2.4] as [number, number, number], o: 0.06 },
      { p: [5.5, 4.1, -2] as [number, number, number], s: [2.9, 0.45, 2.1] as [number, number, number], o: 0.052 },
      { p: [0.5, 5.2, 5] as [number, number, number], s: [4.2, 0.42, 3.1] as [number, number, number], o: 0.045 },
      { p: [-3.5, 3.9, -4.5] as [number, number, number], s: [3.2, 0.48, 2.0] as [number, number, number], o: 0.054 },
      { p: [-16.5, 3.2, 11] as [number, number, number], s: [5.6, 0.52, 4.0] as [number, number, number], o: 0.048 },
      { p: [-13.8, 5.4, 7.2] as [number, number, number], s: [4.2, 0.4, 3.2] as [number, number, number], o: 0.042 },
      { p: [15.8, 2.6, -11.5] as [number, number, number], s: [5.2, 0.48, 3.9] as [number, number, number], o: 0.046 },
      { p: [18.2, 4.1, -7.8] as [number, number, number], s: [3.8, 0.38, 2.9] as [number, number, number], o: 0.04 },
      { p: [-11.5, 2.1, -12] as [number, number, number], s: [4.8, 0.45, 3.4] as [number, number, number], o: 0.038 },
      { p: [10.5, 5.8, 13.5] as [number, number, number], s: [4.0, 0.36, 2.7] as [number, number, number], o: 0.036 },
    ],
    []
  );
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.006;
  });
  return (
    <group ref={ref}>
      {cfg.map((c, i) => (
        <mesh key={i} position={c.p} scale={c.s}>
          <sphereGeometry args={[0.5, 14, 12]} />
          <meshBasicMaterial color="#E2EFE4" transparent opacity={c.o} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function ShoreBirdSilhouettes() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.11;
    ref.current.position.y = 2.65 + Math.sin(clock.elapsedTime * 0.5) * 0.08;
  });
  return (
    <group ref={ref} position={[0, 2.65, 0]}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <group key={i} rotation={[0, (i / 6) * Math.PI * 2, 0]} position={[0, 0, 4.2]}>
          <mesh rotation={[0, 0.75, 0.35]} position={[-0.05, 0, 0]}>
            <boxGeometry args={[0.14, 0.018, 0.045]} />
            <meshBasicMaterial color="#2A3D52" transparent opacity={0.38} depthWrite={false} />
          </mesh>
          <mesh rotation={[0, -0.75, -0.35]} position={[0.05, 0, 0]}>
            <boxGeometry args={[0.14, 0.018, 0.045]} />
            <meshBasicMaterial color="#2A3D52" transparent opacity={0.38} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CitadelMiniGrove({
  canopyGeo,
  feltBump,
}: {
  canopyGeo: THREE.LatheGeometry;
  feltBump: THREE.Texture | null;
}) {
  return (
    <group>
      <Tree position={[0.62, 0.7, 0.38]} scale={0.4} canopyGeo={canopyGeo} feltBump={feltBump} />
      <Tree position={[-0.52, 0.7, 0.42]} scale={0.36} canopyGeo={canopyGeo} feltBump={feltBump} />
      <Tree position={[0.08, 0.7, 0.72]} scale={0.32} canopyGeo={canopyGeo} feltBump={feltBump} />
    </group>
  );
}

function CitadelFestoon() {
  return (
    <group position={[0, 0.82, 0]}>
      {[-0.55, 0, 0.55].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.58]} rotation={[0.25, 0.1 * i, 0.12 * i]} castShadow>
          <planeGeometry args={[0.12, 0.09]} />
          <meshStandardMaterial color="#C9956A" roughness={0.88} metalness={0} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh position={[0, 0.38, 0.95]} castShadow receiveShadow>
        <torusGeometry args={[0.42, 0.02, 6, 20, Math.PI * 0.55]} />
        <meshStandardMaterial color={TERRACOTTA} roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

function CitadelStrataVines() {
  const rnd = useMemo(() => mulberry32(7712), []);
  const clumps = useMemo(() => {
    const r = rnd;
    const out: { p: [number, number, number]; s: number; c: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const a = r() * Math.PI * 2;
      const rad = 0.95 + r() * 0.42;
      const y = 0.08 + r() * 0.55;
      out.push({
        p: [Math.cos(a) * rad, y, Math.sin(a) * rad],
        s: 0.08 + r() * 0.1,
        c: r() > 0.5 ? CANOPY_DARK : CANOPY_MID,
      });
    }
    return out;
  }, [rnd]);
  return (
    <group>
      {clumps.map((c, i) => (
        <mesh key={i} position={c.p} scale={c.s} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={c.c} roughness={0.92} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function AnchorGardenFence() {
  const posts = useMemo(() => {
    const out: { a: number; r: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const a = -0.85 + i * 0.12;
      out.push({ a, r: 2.65 });
    }
    return out;
  }, []);
  return (
    <group position={[0, 0, 0]} rotation={[0, 0.35, 0]}>
      {posts.map((p, i) => (
        <mesh
          key={i}
          position={[Math.cos(p.a) * p.r, 0.09, Math.sin(p.a) * p.r]}
          rotation={[0, -p.a + Math.PI / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.04, 0.18, 0.04]} />
          <meshStandardMaterial color={PLANK_WOOD} roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

function AnchorStoneLantern() {
  return (
    <group position={[-1.95, 0, 0.55]} rotation={[0, 0.5, 0]}>
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.11, 0.2, 8]} />
        <meshStandardMaterial color={SLATE} roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.05, 0.08, 8]} />
        <meshStandardMaterial color={RESORT_CREAM} roughness={0.85} emissive="#FFF6E8" emissiveIntensity={0.06} metalness={0} />
      </mesh>
    </group>
  );
}

function AnchorHayStack() {
  return (
    <group position={[2.15, 0, -0.85]} rotation={[0, -0.9, 0]}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.28, 0.35, 6]} />
        <meshStandardMaterial color="#C4B598" roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[0.12, 0.08, 0.08]} castShadow>
        <coneGeometry args={[0.18, 0.22, 5]} />
        <meshStandardMaterial color="#B8A888" roughness={0.9} metalness={0} />
      </mesh>
    </group>
  );
}

function AnchorLilyPads() {
  const pads = useMemo(() => {
    const rnd = mulberry32(4412);
    const r = rnd;
    const out: [number, number, number][] = [];
    for (let i = 0; i < 11; i++) {
      out.push([-0.38 + (r() - 0.5) * 0.42, 0.424, -0.18 + (r() - 0.5) * 0.42]);
    }
    return out;
  }, []);
  return (
    <group>
      {pads.map((p, i) => (
        <mesh key={i} position={p} rotation={[-Math.PI / 2, 0, i * 0.73]} receiveShadow>
          <circleGeometry args={[0.048 + (i % 3) * 0.018, 12]} />
          <meshStandardMaterial color="#5A8068" roughness={0.9} metalness={0} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function AnchorResortNook() {
  return (
    <group position={[1.85, 0, 0.95]} rotation={[0, -0.65, 0]}>
      <HarborBeachUmbrella position={[0, 0, 0]} rotY={0.4} />
      <mesh position={[0.22, 0.02, 0.08]} rotation={[-Math.PI / 2, 0, 0.2]} receiveShadow>
        <planeGeometry args={[0.42, 0.55]} />
        <meshStandardMaterial color={RESORT_SUN} roughness={0.92} metalness={0} />
      </mesh>
      <HarborPalm position={[-0.35, 0, -0.12]} scale={0.85} rotY={1.2} />
      <mesh position={[0.45, 0.14, -0.05]} castShadow>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#F5E6D8" roughness={0.88} metalness={0} />
      </mesh>
    </group>
  );
}

/** Spring-forward: butter yellows, blossom pink, fresh mint, soft sky */
const PETAL_WILD = ["#F2E050", "#FFE566", "#E8D060", "#FFF59D", "#EDE294", "#F5E878"];
const PETAL_WARM = ["#FF9AA8", "#FFB7C5", "#E8B4A8", "#F5A8B8", "#D4A574", "#E8C9A0", "#FFD6E8"];
const PETAL_COOL = ["#7DCF9E", "#98E4C4", "#7A9B7E", "#5A9090", "#7BA8C4", "#B8E994", "#A8D8EA"];
const PETAL_NEUTRAL = ["#FFF8F0", "#F5EDE4", "#E8F8EE"];

function pickPetalPaintColor(r: SeededRng, out: THREE.Color) {
  const u = r();
  const pickArr = (arr: string[]) => arr[Math.floor(r() * arr.length)]!;
  if (u < 0.36) out.set(pickArr(PETAL_WILD));
  else if (u < 0.68) out.set(pickArr(PETAL_WARM));
  else if (u < 0.93) out.set(pickArr(PETAL_COOL));
  else out.set(pickArr(PETAL_NEUTRAL));
  out.multiplyScalar(1.02 + r() * 0.16);
  /* Yellow / pink families: lower saturation + blend toward sky (airier / higher transparency) */
  if (u < 0.68) {
    out.getHSL(PETAL_HSL_TMP);
    out.setHSL(
      PETAL_HSL_TMP.h,
      PETAL_HSL_TMP.s * 0.45,
      Math.min(0.94, PETAL_HSL_TMP.l + 0.04)
    );
    out.lerp(PETAL_SKY_TINT, 0.36);
  }
}

type PetalSeed = {
  x: number;
  y: number;
  z: number;
  f1: number;
  f2: number;
  f3: number;
  p1: number;
  p2: number;
  p3: number;
  a1: number;
  a2: number;
  a3: number;
  wx: number;
  wy: number;
  wz: number;
  bw: number;
  bh: number;
  bt: number;
  spin: number;
  spin2: number;
};

function buildPetalSeeds(count: number): PetalSeed[] {
  const rnd = mulberry32(22033);
  const focusX = 3.15;
  const focusZ = -0.55;
  /** Mostly uniform full-frame; small bias keeps a whisper of density near anchor */
  const clusterFrac = 0.07;
  const spanX = 78;
  const spanY = 26;
  const spanZ = 74;
  const out: PetalSeed[] = [];

  for (let i = 0; i < count; i++) {
    let x: number;
    let z: number;
    if (rnd() < clusterFrac) {
      const ring = Math.sqrt(rnd()) * (9.5 + rnd() * 7.5);
      const ang = rnd() * Math.PI * 2;
      x = focusX + Math.cos(ang) * ring + (rnd() - 0.5) * 5.5;
      z = focusZ + Math.sin(ang) * ring + (rnd() - 0.5) * 5.5;
    } else {
      const u = rnd();
      const w = rnd();
      const rx = (u - 0.5) * 2;
      const rz = (w - 0.5) * 2;
      const mag = 0.55 + rnd() * 0.45;
      x = rx * spanX * 0.5 * mag + (rnd() - 0.5) * 8;
      z = rz * spanZ * 0.5 * mag + (rnd() - 0.5) * 8;
    }
    const yBias = Math.pow(rnd(), 0.48);
    let bw = 0.05 + rnd() * 0.2;
    let bh = 0.045 + rnd() * 0.19;
    if (rnd() < 0.24) [bw, bh] = [bh, bw];
    const squash = 0.72 + rnd() * 0.56;
    bw *= squash;
    bh *= squash;
    const thick = 0.0032 + Math.pow(rnd(), 1.35) * 0.042;
    out.push({
      x,
      y: -0.8 + yBias * spanY * (0.55 + rnd() * 0.65) + (rnd() - 0.5) * 6,
      z,
      f1: 0.031 + rnd() * 0.14,
      f2: 0.047 + rnd() * 0.19,
      f3: 0.023 + rnd() * 0.11,
      p1: rnd() * Math.PI * 2,
      p2: rnd() * Math.PI * 2,
      p3: rnd() * Math.PI * 2,
      a1: 0.8 + rnd() * 4.5,
      a2: 0.6 + rnd() * 3.8,
      a3: 0.5 + rnd() * 3.2,
      wx: rnd() * 6.28,
      wy: rnd() * 6.28,
      wz: rnd() * 6.28,
      bw,
      bh,
      bt: thick,
      spin: (rnd() - 0.5) * 0.14,
      spin2: (rnd() - 0.5) * 0.09,
    });
  }
  return out;
}

function splitPetalLayerCounts(total: number, layers: number): number[] {
  const base = Math.floor(total / layers);
  const rem = total - base * layers;
  return Array.from({ length: layers }, (_, i) => base + (i < rem ? 1 : 0));
}

/** Soft ellipsoid petal */
const PETAL_GEOM_SPHERE = /* @__PURE__ */ (() => {
  const g = new THREE.SphereGeometry(0.5, 16, 12);
  return g;
})();

/** Crescent / arc chip */
const PETAL_GEOM_TORUS = /* @__PURE__ */ (() => {
  const g = new THREE.TorusGeometry(0.38, 0.05, 10, 40, Math.PI * 1.82);
  return g;
})();

/** Organic teardrop — extruded bezier */
const PETAL_GEOM_TEAR = /* @__PURE__ */ (() => {
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.42);
  sh.bezierCurveTo(0.52, -0.08, 0.42, 0.4, 0, 0.54);
  sh.bezierCurveTo(-0.42, 0.4, -0.52, -0.08, 0, -0.42);
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 20,
  });
  g.rotateX(-Math.PI / 2);
  g.center();
  return g;
})();

/** Low-poly irregular pebble */
const PETAL_GEOM_ICO = /* @__PURE__ */ (() => new THREE.IcosahedronGeometry(0.46, 1))();

/** Slightly tapered prism — not a square slab */
const PETAL_GEOM_CYL = /* @__PURE__ */ (() => new THREE.CylinderGeometry(0.46, 0.34, 0.13, 5))();

/**
 * One instanced layer — same motion; geometry defines silhouette (round / arc / tear / lumpy / prism).
 * Per-instance color via instanceColor only (never vertexColors on mesh without color attr).
 */
function PetalInstancedLayer({
  seeds,
  geometry,
  material,
  colorRngSeed,
  sizeNorm,
  scaleMul,
  worldScale = 1,
}: {
  seeds: PetalSeed[];
  geometry: THREE.BufferGeometry;
  material: THREE.MeshBasicMaterial;
  colorRngSeed: number;
  sizeNorm: number;
  scaleMul: [number, number, number];
  worldScale?: number;
}) {
  const count = seeds.length;
  const ref = useRef<THREE.InstancedMesh>(null);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const tmpC = useMemo(() => new THREE.Color(), []);
  const bootstrapped = useRef(false);

  useLayoutEffect(() => {
    bootstrapped.current = false;
  }, [count, seeds, geometry]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh || count === 0) return;

    if (!bootstrapped.current) {
      bootstrapped.current = true;
      const rnd = mulberry32(colorRngSeed);
      for (let i = 0; i < count; i++) {
        pickPetalPaintColor(rnd, tmpC);
        mesh.setColorAt(i, tmpC);
        const o = seeds[i]!;
        v.set(o.x, o.y, o.z);
        q.identity();
        s.set(
          ((o.bw * scaleMul[0]) / sizeNorm) * worldScale,
          ((o.bh * scaleMul[1]) / sizeNorm) * worldScale,
          ((o.bt * scaleMul[2]) / sizeNorm) * worldScale
        );
        m.compose(v, q, s);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    const t = clock.elapsedTime;
    const [mx, my, mz] = scaleMul;
    for (let i = 0; i < count; i++) {
      const o = seeds[i]!;
      const dx =
        Math.sin(t * o.f1 + o.p1) * o.a1 +
        Math.sin(t * o.f2 * 1.7 + o.wx + i * 0.1) * o.a2 * 0.35 +
        Math.sin(t * 0.11 + o.wz) * 0.85;
      const dy =
        Math.sin(t * o.f2 * 0.85 + o.p2) * o.a2 * 0.55 +
        Math.cos(t * o.f3 * 2.1 + o.wy) * 0.65 +
        Math.sin(t * 0.07 + i * 0.03) * 1.1;
      const dz =
        Math.cos(t * o.f1 * 1.1 + o.p3) * o.a3 +
        Math.sin(t * o.f3 + o.wz) * 1.15 +
        Math.cos(t * 0.09 + i * 0.17) * 0.7;
      v.set(o.x + dx, o.y + dy, o.z + dz);
      e.set(
        t * o.spin + o.wx * 0.2 + Math.sin(t * o.f2 + i) * 0.25,
        t * o.spin2 + o.wy * 0.15 + Math.cos(t * o.f1 * 0.8 + i) * 0.35,
        t * (o.spin * 0.6) + Math.sin(t * 0.04 + o.p1) * 0.2
      );
      q.setFromEuler(e);
      const flutter = 0.9 + Math.sin(t * 2.4 + o.p2 + i * 0.4) * 0.14;
      const thickPulse = 0.88 + Math.sin(t * 1.9 + o.p3 + i * 0.31) * 0.14;
      s.set(
        ((o.bw * flutter * mx) / sizeNorm) * worldScale,
        ((o.bh * flutter * my) / sizeNorm) * worldScale,
        ((o.bt * thickPulse * mz) / sizeNorm) * worldScale
      );
      m.compose(v, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;
  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />;
}

/** +20% vs 666 → ~799; half-size instances via worldScale */
function DriftingFeltPetals({ count = 799 }: { count?: number }) {
  const petalMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );
  useEffect(() => () => petalMaterial.dispose(), [petalMaterial]);
  const seeds = useMemo(() => buildPetalSeeds(count), [count]);
  const parts = splitPetalLayerCounts(count, 5);
  const [n0, n1, n2, n3, n4] = parts;
  let a = 0;
  const s0 = seeds.slice(a, (a += n0));
  const s1 = seeds.slice(a, (a += n1));
  const s2 = seeds.slice(a, (a += n2));
  const s3 = seeds.slice(a, (a += n3));
  const s4 = seeds.slice(a, (a += n4));

  return (
    <>
      <PetalInstancedLayer
        seeds={s0}
        geometry={PETAL_GEOM_SPHERE}
        material={petalMaterial}
        colorRngSeed={44881}
        sizeNorm={0.5}
        scaleMul={[1.05, 1.05, 1.02]}
        worldScale={0.5}
      />
      <PetalInstancedLayer
        seeds={s1}
        geometry={PETAL_GEOM_TORUS}
        material={petalMaterial}
        colorRngSeed={55102}
        sizeNorm={0.38}
        scaleMul={[1.18, 1.18, 0.92]}
        worldScale={0.5}
      />
      <PetalInstancedLayer
        seeds={s2}
        geometry={PETAL_GEOM_TEAR}
        material={petalMaterial}
        colorRngSeed={66203}
        sizeNorm={0.44}
        scaleMul={[1.12, 1.12, 1.05]}
        worldScale={0.5}
      />
      <PetalInstancedLayer
        seeds={s3}
        geometry={PETAL_GEOM_ICO}
        material={petalMaterial}
        colorRngSeed={77314}
        sizeNorm={0.46}
        scaleMul={[1.08, 1.08, 1.08]}
        worldScale={0.5}
      />
      <PetalInstancedLayer
        seeds={s4}
        geometry={PETAL_GEOM_CYL}
        material={petalMaterial}
        colorRngSeed={88425}
        sizeNorm={0.46}
        scaleMul={[1.15, 1.15, 0.88]}
        worldScale={0.5}
      />
    </>
  );
}

/** Soft aura specks — full-volume light pollen */
function AuraVoidParticles({ count = 260 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geom = useMemo(() => new THREE.SphereGeometry(0.035, 6, 5), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#EEF6F2",
        transparent: true,
        opacity: 0.09,
        depthWrite: false,
      }),
    []
  );
  const seeds = useMemo(() => {
    const rnd = mulberry32(9901);
    const out: { x: number; y: number; z: number; a: number; b: number }[] = [];
    const span = 56;
    for (let i = 0; i < count; i++) {
      out.push({
        x: (rnd() - 0.5) * span,
        y: -2 + rnd() * 22,
        z: (rnd() - 0.5) * span,
        a: 0.06 + rnd() * 0.09,
        b: rnd() * 6.28,
      });
    }
    return out;
  }, [count]);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const sc = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const o = seeds[i]!;
      const bob = Math.sin(t * o.a + o.b) * 0.28;
      const sway = Math.cos(t * o.a * 1.3 + i * 0.4) * 0.42;
      v.set(o.x + sway, o.y + bob, o.z + Math.sin(t * 0.05 + o.b) * 0.38);
      q.identity();
      const h = 0.65 + (i % 7) * 0.06;
      sc.set(h, h, h);
      m.compose(v, q, sc);
      ref.current.setMatrixAt(i, m);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  useLayoutEffect(() => {
    if (!ref.current) return;
    for (let i = 0; i < count; i++) {
      const o = seeds[i]!;
      v.set(o.x, o.y, o.z);
      q.identity();
      sc.set(1, 1, 1);
      m.compose(v, q, sc);
      ref.current.setMatrixAt(i, m);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count, m, q, sc, v, seeds]);

  return <instancedMesh ref={ref} args={[geom, mat, count]} frustumCulled={false} />;
}

const CLOUD_SEA_VS = /* glsl */ `
varying vec2 vWorldXZ;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldXZ = wp.xz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const CLOUD_SEA_FS = /* glsl */ `
uniform vec3 uColorCenter;
uniform vec3 uColorEdge;
uniform vec2 uOriginXZ;
uniform float uRadius;
varying vec2 vWorldXZ;
void main() {
  float d = length(vWorldXZ - uOriginXZ) / uRadius;
  vec3 col = mix(uColorCenter, uColorEdge, smoothstep(0.06, 0.78, d));
  float alpha = mix(0.9, 0.0, smoothstep(0.28, 1.0, d));
  gl_FragColor = vec4(col, alpha);
}
`;

const MIST_VEIL_FS = /* glsl */ `
uniform vec3 uColorCenter;
uniform vec3 uColorEdge;
uniform vec2 uOriginXZ;
uniform float uRadius;
varying vec2 vWorldXZ;
void main() {
  float d = length(vWorldXZ - uOriginXZ) / uRadius;
  vec3 col = mix(uColorCenter, uColorEdge, smoothstep(0.04, 0.72, d));
  float alpha = mix(0.24, 0.0, smoothstep(0.18, 1.0, d));
  gl_FragColor = vec4(col, alpha);
}
`;

const MIST_HEMI_VS = /* glsl */ `
varying vec3 vWorldPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const MIST_HEMI_FS = /* glsl */ `
uniform vec3 uCenter;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uMistLow;
varying vec3 vWorldPos;
void main() {
  vec3 rd = normalize(vWorldPos - uCenter);
  float up = clamp(rd.y * 0.62 + 0.5, 0.0, 1.0);
  vec3 base = mix(uHorizon, uZenith, pow(up, 0.76));
  float low = smoothstep(0.18, -0.48, rd.y);
  vec3 col = mix(base, uMistLow, low * 0.52);
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Continuous mint mist backdrop — replaces flat void with graded morning haze */
function MistySkyHemisphere() {
  const shaderArgs = useMemo((): [THREE.ShaderMaterialParameters] => {
    const uniforms: THREE.ShaderMaterialParameters["uniforms"] = {
      uCenter: {
        value: new THREE.Vector3(ARCH_CENTER[0], 0.15, ARCH_CENTER[2]),
      },
      uZenith: { value: new THREE.Color("#F7FCF5") },
      uHorizon: { value: new THREE.Color("#E9F3E6") },
      uMistLow: { value: new THREE.Color("#D8EAD8") },
    };
    return [
      {
        uniforms,
        vertexShader: MIST_HEMI_VS,
        fragmentShader: MIST_HEMI_FS,
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: true,
      },
    ];
  }, []);

  return (
    <mesh
      position={[ARCH_CENTER[0], 0.35, ARCH_CENTER[2]]}
      frustumCulled={false}
      renderOrder={-30}
    >
      <sphereGeometry args={[198, 44, 32]} />
      <shaderMaterial attach="material" args={shaderArgs} />
    </mesh>
  );
}

/** Mid-height mist sheet — softens horizon band so the frame never “cuts off” */
function MistVeilPlane() {
  const shaderArgs = useMemo((): [THREE.ShaderMaterialParameters] => {
    const uniforms: THREE.ShaderMaterialParameters["uniforms"] = {
      uColorCenter: { value: new THREE.Color("#DCE9DC") },
      uColorEdge: { value: new THREE.Color(SKY) },
      uOriginXZ: { value: new THREE.Vector2(ARCH_CENTER[0], ARCH_CENTER[2]) },
      uRadius: { value: 218 },
    };
    return [
      {
        uniforms,
        vertexShader: CLOUD_SEA_VS,
        fragmentShader: MIST_VEIL_FS,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      },
    ];
  }, []);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[ARCH_CENTER[0], -6.8, ARCH_CENTER[2]]}
      frustumCulled={false}
      renderOrder={-6}
    >
      <circleGeometry args={[218, 64]} />
      <shaderMaterial attach="material" args={shaderArgs} />
    </mesh>
  );
}

/** Radial mist “sea” under the archipelago — read as depth when looking down */
function CloudSeaPlane() {
  const shaderArgs = useMemo((): [THREE.ShaderMaterialParameters] => {
    const uniforms: THREE.ShaderMaterialParameters["uniforms"] = {
      uColorCenter: { value: new THREE.Color(MATCHA_MIST) },
      uColorEdge: { value: new THREE.Color(SKY) },
      uOriginXZ: { value: new THREE.Vector2(ARCH_CENTER[0], ARCH_CENTER[2]) },
      uRadius: { value: 176 },
    };
    return [
      {
        uniforms,
        vertexShader: CLOUD_SEA_VS,
        fragmentShader: CLOUD_SEA_FS,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      },
    ];
  }, []);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[ARCH_CENTER[0], -10, ARCH_CENTER[2]]}
      frustumCulled={false}
      renderOrder={-5}
    >
      <circleGeometry args={[176, 96]} />
      <shaderMaterial attach="material" args={shaderArgs} />
    </mesh>
  );
}

/** Solid pale matcha pad — replaces translucent ContactShadows */
function IslandMatchaGround({ radius }: { radius: number }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.0025, 0]}
      renderOrder={-2}
      castShadow={false}
      receiveShadow={false}
    >
      <circleGeometry args={[radius, 56]} />
      <meshBasicMaterial
        color={MATCHA_MIST}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </mesh>
  );
}

/** Plank bridge with parabolic sag + side rails (Harbor ↔ Anchor) */
function HangingWoodBridge({
  ax,
  az,
  bx,
  bz,
  y,
  sag = 0.32,
  plankCount = 17,
}: {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  y: number;
  sag?: number;
  plankCount?: number;
}) {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz);
  const midX = (ax + bx) / 2;
  const midZ = (az + bz) / 2;
  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    const to = new THREE.Vector3(dx, 0, dz).normalize();
    q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), to);
    return q;
  }, [dx, dz]);

  const plankW = (len / plankCount) * 0.78;

  return (
    <group position={[midX, y, midZ]} quaternion={quat}>
      <mesh position={[0, -0.02, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[len * 1.02, 0.055, 0.07]} />
        <meshStandardMaterial color={PIER_WOOD} roughness={ROUGH} metalness={0} />
      </mesh>
      <mesh position={[0, -0.02, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[len * 1.02, 0.055, 0.07]} />
        <meshStandardMaterial color={PIER_WOOD} roughness={ROUGH} metalness={0} />
      </mesh>
      {Array.from({ length: plankCount }, (_, i) => {
        const t = (i + 0.5) / plankCount - 0.5;
        const px = t * len;
        const yOff = -sag * (1 - 4 * t * t);
        return (
          <mesh key={i} position={[px, yOff, 0]} castShadow receiveShadow>
            <boxGeometry args={[plankW, 0.038, 0.32]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? PLANK_WOOD : PLANK_SLATE}
              roughness={ROUGH}
              metalness={0}
            />
          </mesh>
        );
      })}
      <mesh position={[-len * 0.48, -0.14, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.22, 14, 12]} />
        <meshStandardMaterial color={SLATE} roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[len * 0.48, -0.12, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.2, 14, 12]} />
        <meshStandardMaterial color={SLATE} roughness={0.92} metalness={0} />
      </mesh>
    </group>
  );
}

/** Rope + slat span with sag (Anchor ↔ Citadel) */
function RopeSlatBridge({
  ax,
  az,
  bx,
  bz,
  y,
  sag = 0.38,
  slats = 15,
}: {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  y: number;
  sag?: number;
  slats?: number;
}) {
  const dx = bx - ax;
  const dz = bz - az;
  const len = Math.hypot(dx, dz);
  const midX = (ax + bx) / 2;
  const midZ = (az + bz) / 2;
  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(dx, 0, dz).normalize());
    return q;
  }, [dx, dz]);

  const [ropeGeoL, ropeGeoR] = useMemo(() => {
    const steps = 36;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const t = u - 0.5;
      pts.push(new THREE.Vector3(t * len, -sag * (1 - 4 * t * t), 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const a = new THREE.TubeGeometry(curve, 64, 0.026, 6, false);
    const b = a.clone();
    return [a, b];
  }, [len, sag]);

  useEffect(
    () => () => {
      ropeGeoL.dispose();
      ropeGeoR.dispose();
    },
    [ropeGeoL, ropeGeoR]
  );

  const slatMeta = useMemo(() => {
    const out: { x: number; y: number; rz: number }[] = [];
    for (let i = 0; i < slats; i++) {
      const u = (i + 0.5) / slats;
      const t = u - 0.5;
      const lx = t * len;
      const ly = -sag * (1 - 4 * t * t);
      const rz = -Math.atan2(8 * sag * t, len);
      out.push({ x: lx, y: ly, rz });
    }
    return out;
  }, [len, sag, slats]);

  const slatW = (len / slats) * 0.72;

  return (
    <group position={[midX, y, midZ]} quaternion={quat}>
      <mesh geometry={ropeGeoL} position={[0, 0, -0.1]} castShadow>
        <meshStandardMaterial color={TRUNK} roughness={ROUGH} metalness={0.02} />
      </mesh>
      <mesh geometry={ropeGeoR} position={[0, 0, 0.1]} castShadow>
        <meshStandardMaterial color={TRUNK} roughness={ROUGH} metalness={0.02} />
      </mesh>
      {slatMeta.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, 0]} rotation={[0, 0, p.rz]} castShadow receiveShadow>
          <boxGeometry args={[slatW, 0.02, 0.12]} />
          <meshStandardMaterial color={PIER_WOOD} roughness={ROUGH} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/** Top-left — distant pudding rocks (eye lead-in) */
function DistantCornerPuddingCluster() {
  return (
    <group position={[-15.6, 0.06, 9.8]} rotation={[0, 0.42, 0]}>
      <PuddingRock position={[0, 0, 0]} scale={[0.42, 0.24, 0.38]} color={HARBOR_MOSS} />
      <PuddingRock position={[0.58, 0.02, 0.38]} scale={[0.34, 0.2, 0.32]} color={SLATE} />
      <PuddingRock position={[-0.42, -0.02, 0.22]} scale={[0.36, 0.22, 0.34]} color={MATCHA} />
      <PuddingRock position={[0.22, 0.01, -0.45]} scale={[0.3, 0.18, 0.28]} color={BLOB_MID} />
      <PuddingRock position={[-0.28, 0.03, -0.28]} scale={[0.28, 0.17, 0.26]} color="#8A9B8E" />
    </group>
  );
}

/** Bottom-right — two tiny moss islets with delicate trees */
function DistantMossIslets({
  canopyGeo,
  feltBump,
}: {
  canopyGeo: THREE.LatheGeometry;
  feltBump: THREE.Texture | null;
}) {
  const bump = feltBump ?? undefined;
  return (
    <>
      <group position={[14.4, -0.06, -10.9]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} castShadow receiveShadow>
          <circleGeometry args={[0.92, 28]} />
          <meshStandardMaterial
            color={MATCHA}
            roughness={ROUGH}
            metalness={0}
            bumpMap={bump}
            bumpScale={0.03}
          />
        </mesh>
        <mesh position={[0, -0.06, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.88, 0.82, 0.13, 24]} />
          <meshStandardMaterial color={TERRACE_B} roughness={ROUGH} metalness={0} bumpMap={bump} bumpScale={0.025} />
        </mesh>
        <Tree position={[0.14, 0, 0.08]} scale={0.26} canopyGeo={canopyGeo} feltBump={feltBump} />
        <Tree position={[-0.2, 0, -0.14]} scale={0.21} canopyGeo={canopyGeo} feltBump={feltBump} />
      </group>
      <group position={[17.95, -0.04, -7.45]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} castShadow receiveShadow>
          <circleGeometry args={[0.58, 22]} />
          <meshStandardMaterial color={MATCHA} roughness={ROUGH} metalness={0} bumpMap={bump} bumpScale={0.028} />
        </mesh>
        <mesh position={[0, -0.045, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.55, 0.5, 0.1, 20]} />
          <meshStandardMaterial color={TERRACE_A} roughness={ROUGH} metalness={0} />
        </mesh>
        <Tree position={[0.02, 0, 0.06]} scale={0.3} canopyGeo={canopyGeo} feltBump={feltBump} />
      </group>
    </>
  );
}

/** Bottom-left foreground — curved log bridge hint */
function ForegroundArcLogBridge() {
  const n = 10;
  return (
    <group position={[-10.5, 0.035, -14.2]} rotation={[0, 0.72, 0]}>
      {Array.from({ length: n }, (_, i) => {
        const t = i / Math.max(1, n - 1);
        const x = (t - 0.5) * 1.52;
        const z = Math.sin(t * Math.PI) * 0.48 - 0.08;
        const y = Math.sin(t * Math.PI) * 0.14;
        const ry = (t - 0.5) * 0.62;
        return (
          <mesh
            key={i}
            position={[x, y, z]}
            rotation={[0.12 + t * 0.08, ry, 0.06]}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[0.034, 0.038, 0.19, 8]} />
            <meshStandardMaterial color={PIER_WOOD} roughness={0.92} metalness={0} />
          </mesh>
        );
      })}
    </group>
  );
}

export function AuraWorldDiorama() {
  const grainMap = useFeltGrainTexture();
  const feltBump = useFeltBumpTexture();
  const canopyGeo = useCanopyProfileGeometry();
  const spiralGeo = useSpiralTubeGeometry();

  const harborRockTints = useMemo(() => [HARBOR_DEEP, SLATE, "#6B756E", HARBOR_MOSS], []);
  const anchorRockTints = useMemo(() => ["#B5ADA2", "#A89E92", "#9E958A", MATCHA], []);
  const citadelRockTints = useMemo(() => [CITADEL_STRATA, TERRACOTTA, CITADEL_CREAM], []);

  return (
    <>
      <ShadowSetup />
      <DioramaCameraRig />

      <color attach="background" args={["#EAF4EB"]} />
      <fogExp2 attach="fog" args={[FOG_COLOR, FOG_DENSITY]} />

      <MistySkyHemisphere />
      <MistVeilPlane />
      <CloudSeaPlane />

      <ambientLight intensity={0.84} color="#FFF4E0" />

      <hemisphereLight color="#F1F8E8" groundColor="#D2B48C" intensity={0.52} />

      <directionalLight
        ref={(L) => {
          if (L) L.shadow.radius = 9;
        }}
        castShadow
        position={[10, 15, 10]}
        intensity={1.32}
        color="#FFF6EC"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={62}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-bias={-0.00045}
        shadow-normalBias={0.052}
      />

      <GeometricDust count={920} />
      <FloatingVacuumShards count={320} />
      <SkyMistOrbs />
      <DriftingFeltPetals count={799} />
      <AuraVoidParticles count={280} />
      <ShoreBirdSilhouettes />

      <DistantCornerPuddingCluster />
      <DistantMossIslets canopyGeo={canopyGeo} feltBump={feltBump} />
      <WorldScatterDreamToys />
      <ForegroundArcLogBridge />

      {/* Harbor (lagoon) ↔ Anchor — heavy plank span */}
      <HangingWoodBridge ax={-2.72} az={3.05} bx={0.52} bz={0.98} y={0.09} sag={0.34} plankCount={18} />
      {/* Anchor ↔ Citadel — rope + slats */}
      <RopeSlatBridge ax={4.82} az={-3.28} bx={5.78} bz={-4.68} y={0.22} sag={0.4} slats={16} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.95}
        maxPolarAngle={Math.PI / 2.08}
        minAzimuthAngle={-0.88}
        maxAzimuthAngle={0.82}
        target={ARCH_CENTER}
        enableDamping
        dampingFactor={0.032}
      />

      {/* Island 1 — Blue lagoon */}
      <IslandFloat x={-5.05} y={0.04} z={4.45} speed={0.42} phase={0.65} amplitude={0.032}>
        <group scale={1.28} rotation={[0, 0.52, 0]}>
          <HarborOrganicMass />
          <HarborTurfDeck grainMap={grainMap} />
          <RiverbedStoneRing rx={2.65} rz={1.38} count={34} seed={1201} />
          <HarborWaterBody />
          <LogPathPier deckLift={0.02} />
          <HarborDreamStacks />
          <HarborMiniBridge />
          <HarborPalm position={[1.15, 0, 0.35]} scale={1.05} rotY={-0.4} />
          <HarborPalm position={[-0.55, 0, 1.05]} scale={0.92} rotY={2.1} />
          <HarborPalm position={[0.35, 0, -0.95]} scale={0.78} rotY={0.85} />
          <HarborBeachUmbrella position={[-0.35, 0, 0.55]} rotY={0.9} />
          <HarborBeachUmbrella position={[0.75, 0, -0.25]} rotY={-0.35} />
          <HarborBuoy position={[1.85, -0.08, 1.15]} />
          <HarborBuoy position={[2.35, -0.1, 0.35]} />
          <HarborBuoy position={[1.2, -0.09, 1.85]} />
          <HarborBuoy position={[2.65, -0.11, 0.95]} />
          <HarborSailboat />
          <HarborStringLights />
          <HarborLoungeSet />
          <HarborSecondGangway />
          <IslandWanderMascot
            seed={88017}
            speedMul={1.12}
            center={[0.04, 0.12]}
            maxRadius={0.94}
            yGround={0.1}
            scale={0.9}
            variant="harbor"
          />
          <PuddingRock position={[-0.95, 0.1, -0.65]} scale={[1.45, 0.82, 1.28]} color={SLATE} />
          <PuddingRock position={[0.75, 0.08, -0.45]} scale={[1.02, 0.65, 0.92]} color={HARBOR_DEEP} />
          <PuddingRock position={[-0.15, 0.12, 1.05]} scale={[1.25, 0.75, 1.12]} color={BLOB_MID} />
          <HarborMiniUrban />
          <ScatterMochiRocks seed={7711} count={34} maxRadius={2.25} innerRadius={0.25} tints={harborRockTints} />
          <ScatterFlowers seed={2201} count={36} maxRadius={2.12} innerRadius={0.2} feltBump={feltBump} />
        </group>
        <IslandMatchaGround radius={5.55} />
      </IslandFloat>

      {/* Island 2 — Anchor */}
      <IslandFloat x={3.15} y={0} z={-0.55} speed={0.34} phase={2.4} amplitude={0.034}>
        <group scale={1.12}>
          <IslandFloor radius={3.35} color={MATCHA} grainMap={grainMap} puckHeight={0.22} />
          <LogPlankPath />
          <TerracesCenter />
          <Windmill position={[-1.55, 0, -0.35]} />
          <Tree position={[-0.35, 0, 0.85]} scale={1} canopyGeo={canopyGeo} feltBump={feltBump} />
          <Tree position={[0.65, 0, 1.02]} scale={0.92} canopyGeo={canopyGeo} feltBump={feltBump} />
          <Tree position={[1.2, 0, 0.25]} scale={0.88} canopyGeo={canopyGeo} feltBump={feltBump} />
          <ScatterMochiRocks seed={3303} count={32} maxRadius={2.95} innerRadius={0.4} tints={anchorRockTints} />
          <ScatterFlowers seed={42} count={48} maxRadius={2.85} innerRadius={0.28} feltBump={feltBump} />
          <AnchorGardenFence />
          <AnchorStoneLantern />
          <AnchorHayStack />
          <AnchorLilyPads />
          <AnchorResortNook />
          <IslandWanderMascot
            seed={29104}
            speedMul={0.48}
            center={[-0.68, 0.32]}
            maxRadius={1.22}
            yGround={0.06}
            scale={1.26}
            variant="anchor"
          />
        </group>
        <IslandMatchaGround radius={6.85} />
      </IslandFloat>

      {/* Island 3 — Citadel */}
      <IslandFloat x={6.45} y={0.52} z={-5.85} speed={0.88} phase={3.9} amplitude={0.038}>
        <group scale={1.22} rotation={[0, -0.48, 0]}>
          <CitadelStrataBase />
          <CitadelStrataVines />
          <group position={[0, 0.7, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} castShadow receiveShadow>
              <circleGeometry args={[1.22, 64]} />
              <meshStandardMaterial
                color={CITADEL_SAND}
                roughness={ROUGH}
                metalness={0}
                map={grainMap ?? undefined}
                bumpMap={grainMap ?? undefined}
                bumpScale={0.02}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
          <GreatCitadelTree position={[0.12, 0.7, -0.08]} canopyGeo={canopyGeo} feltBump={feltBump} spiralGeo={spiralGeo} />
          <CitadelMiniGrove canopyGeo={canopyGeo} feltBump={feltBump} />
          <CitadelFestoon />
          <ScatterMochiRocks seed={9902} count={18} maxRadius={1.58} innerRadius={0.26} tints={citadelRockTints} />
          <ScatterFlowers seed={5505} count={22} maxRadius={1.45} innerRadius={0.28} feltBump={feltBump} />
          <IslandWanderMascot
            seed={77331}
            speedMul={1.38}
            center={[0.06, -0.2]}
            maxRadius={0.5}
            yGround={0.706}
            scale={0.68}
            variant="citadel"
          />
        </group>
        <IslandMatchaGround radius={5.35} />
      </IslandFloat>
    </>
  );
}
