import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { createCitadelToyStarRiverCurve } from "./auraStarRiverCurve";

/**
 * Reference: ant-view miniature world + painterly swatches — soft translucency, layered opacity,
 * teal/gold dust accents (~20%), procedural dry-brush grain + speckle (no external textures).
 */
const PALETTE = ["#7E9CD9", "#CEDEF2", "#6F9ABF", "#F2E3B6", "#A9BFDC"] as const;

/** Harmonious teals / golds / dusty violets — mixed in ~20% for “palette board” feel */
const PAINTERLY_ACCENTS = [
  "#4A8FA8",
  "#5CB0C4",
  "#3D7A8C",
  "#C9A86C",
  "#D8BC7A",
  "#A89BB8",
  "#8FA3B2",
  "#E8D4A8",
] as const;

/** XZ keep-out disks — islands + large dream toys (world space, not float offsets). */
const EXCLUSIONS: { x: number; z: number; r: number }[] = [
  { x: -5.05, z: 4.45, r: 5.4 },
  { x: 3.15, z: -0.55, r: 4.8 },
  { x: 6.45, z: -5.85, r: 5.5 },
  { x: -18.4, z: 5.4, r: 6.8 },
  { x: 18.2, z: -9.1, r: 6.5 },
];

type BlobSpec = {
  position: [number, number, number];
  scale: [number, number, number];
  /** Optional euler (rad); outer blobs use small tilt for shape variety */
  rotation?: [number, number, number];
  color: string;
  opacity: number;
  emissiveIntensity: number;
  seed: number;
  brush: number;
  /** 1 = rare brush-stroke read; only five instances in the whole scene use this */
  stripe: number;
};

const BLOB_VS = /* glsl */ `
attribute vec3 instanceColor;
attribute float instanceOpacity;
attribute float instanceSeed;
attribute float instanceEmissive;
attribute float instanceBrush;
attribute float instanceStripe;

varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec2 vUv;
varying vec3 vBaseCol;
varying float vOpacity;
varying float vSeed;
varying float vEmissive;
varying float vBrush;
varying float vStripe;

uniform float uTime;

void main() {
  vUv = uv;
  vBaseCol = instanceColor;
  vOpacity = instanceOpacity;
  vSeed = instanceSeed;
  vEmissive = instanceEmissive;
  vBrush = instanceBrush;
  vStripe = instanceStripe;

  mat4 mw = modelMatrix * instanceMatrix;
  vec4 wp = mw * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormalW = normalize(mat3(mw) * normal);

  vec3 p = position;
  float t = uTime * 0.35 + vSeed * 0.01;
  p += normal * sin(t + vBrush * 1.7) * 0.022 * step(0.5, instanceStripe);

  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0);
}
`;

const BLOB_FS = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vNormalW;
varying vec2 vUv;
varying vec3 vBaseCol;
varying float vOpacity;
varying float vSeed;
varying float vEmissive;
varying float vBrush;
varying float vStripe;

uniform float uTime;

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float hash13(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  float br = vBrush + 0.01;
  vec2 guv = vUv * (4.2 + br * 1.8) + vec2(vSeed * 0.027, vSeed * 0.016);
  guv += vec2(sin(uTime * 0.05 + vSeed * 0.02), cos(uTime * 0.04 + vBrush)) * 0.018;

  float grain = noise2(guv) * 0.5 + noise2(guv * 2.4 + br) * 0.26 + noise2(guv * 4.8) * 0.14;
  float lump = smoothstep(0.32, 0.9, grain);
  float impasto = lump * 0.48;

  float dryBrush = 1.0;
  float strokeMix = 0.0;
  if (vStripe > 0.5) {
    float strokeW = mix(2.4, 4.2, fract(vSeed * 0.17));
    float stroke = sin(guv.x * strokeW + guv.y * 1.15 + grain * 2.0) * 0.5 + 0.5;
    strokeMix = smoothstep(0.4, 0.76, stroke);
    dryBrush = mix(0.9, 1.08, strokeMix);
  } else {
    dryBrush = mix(0.96, 1.06, grain * 0.28 + noise2(guv * 9.0) * 0.12);
  }

  vec3 n = normalize(vNormalW);
  float ndl = max(dot(n, normalize(vec3(0.35, 0.88, 0.42))), 0.0);
  vec3 lit = vBaseCol * dryBrush * (0.38 + 0.62 * ndl) * (1.0 + impasto);

  vec3 wp = vWorldPos * (1.15 + fract(vSeed * 0.07));
  float speckAmt = vStripe > 0.5 ? 1.0 : 0.28;
  float speck = step(0.93, hash13(wp)) * 0.38 * speckAmt;
  speck += step(0.97, hash13(wp * 1.7 + vBrush)) * 0.48 * speckAmt;
  lit += vec3(speck * vOpacity);

  vec3 em = vBaseCol * vEmissive * (0.72 + grain * 0.4 + strokeMix * 0.12);

  float alpha = vOpacity * (0.7 + grain * 0.38);
  if (vStripe > 0.5) {
    alpha *= mix(0.88, 1.06, strokeMix);
  }
  alpha = clamp(alpha, 0.06, 0.92);

  gl_FragColor = vec4(lit + em * 0.24, alpha);
}
`;

const GLITTER_VS = /* glsl */ `
attribute vec3 instanceColor;
attribute float instanceOpacity;
attribute float instanceSeed;

varying vec3 vWorldPos;
varying vec3 vBaseCol;
varying float vOpacity;
varying float vSeed;
varying vec2 vUv;

uniform float uTime;

void main() {
  vUv = uv;
  vBaseCol = instanceColor;
  vOpacity = instanceOpacity;
  vSeed = instanceSeed;
  mat4 mw = modelMatrix * instanceMatrix;
  vec4 wp = mw * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
`;

const GLITTER_FS = /* glsl */ `
varying vec3 vWorldPos;
varying vec3 vBaseCol;
varying float vOpacity;
varying float vSeed;
varying vec2 vUv;

uniform float uTime;

float h(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

void main() {
  vec3 q = vWorldPos * (3.5 + fract(vSeed * 0.09)) + vec3(vSeed * 0.02);
  float g = h(q) * 0.45 + h(q * 2.1 + uTime * 0.08) * 0.3 + h(q * 4.6) * 0.2;
  float speck = step(0.88, h(vWorldPos * 4.0 + vSeed)) * 0.85;
  speck += step(0.94, h(vWorldPos * 9.0)) * 0.65;

  vec3 c = vBaseCol * (0.86 + g * 0.16);
  c += vec3(speck * 0.35);
  float alpha = vOpacity * (0.58 + g * 0.32 + speck * 0.25);
  alpha = clamp(alpha, 0.12, 0.92);
  gl_FragColor = vec4(c, alpha);
}
`;

function distXZ(ax: number, az: number, bx: number, bz: number) {
  return Math.hypot(ax - bx, az - bz);
}

function isExcludedXZ(x: number, z: number) {
  return EXCLUSIONS.some((e) => distXZ(x, z, e.x, e.z) < e.r);
}

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickColor(rnd: () => number) {
  if (rnd() < 0.2) {
    return PAINTERLY_ACCENTS[Math.floor(rnd() * PAINTERLY_ACCENTS.length)]!;
  }
  return PALETTE[Math.floor(rnd() * PALETTE.length)]!;
}

function pickOpacity(rnd: () => number) {
  const roll = rnd();
  if (roll < 0.32) return 0.09 + rnd() * 0.16;
  if (roll < 0.72) return 0.2 + rnd() * 0.28;
  return 0.42 + rnd() * 0.28;
}

function buildUnderRiverBlobs(curve: THREE.CatmullRomCurve3, rnd: () => number): BlobSpec[] {
  const up = new THREE.Vector3(0, 1, 0);
  const tan = new THREE.Vector3();
  const side = new THREE.Vector3();
  const binorm = new THREE.Vector3();
  const p = new THREE.Vector3();
  const out: BlobSpec[] = [];
  const n = 56;

  for (let i = 0; i < n; i++) {
    const t = THREE.MathUtils.clamp(0.02 + rnd() * 0.96, 0, 1);
    curve.getPoint(t, p);
    curve.getTangentAt(t, tan).normalize();
    side.crossVectors(tan, up);
    if (side.lengthSq() < 1e-8) side.crossVectors(tan, new THREE.Vector3(1, 0, 0));
    side.normalize();
    binorm.crossVectors(side, tan).normalize();

    p.addScaledVector(side, (rnd() - 0.5) * 2.85);
    p.addScaledVector(binorm, (rnd() - 0.5) * 1.25);
    p.addScaledVector(tan, (rnd() - 0.5) * 0.55);
    p.y -= 0.38 + rnd() * 1.55;

    const squash = 0.55 + rnd() * 0.95;
    const sx = (0.42 + rnd() * 1.55) * squash;
    const sy = (0.32 + rnd() * 0.95) * squash * (0.75 + rnd() * 0.55);
    const sz = (0.38 + rnd() * 1.35) * squash;

    out.push({
      position: [p.x, p.y, p.z],
      scale: [sx, sy, sz],
      color: pickColor(rnd),
      opacity: pickOpacity(rnd),
      emissiveIntensity: 0.06 + rnd() * 0.16,
      seed: rnd() * 1000,
      brush: Math.floor(rnd() * 5),
      stripe: 0,
    });
  }
  return out;
}

function buildScatteredFamilies(rnd: () => number): BlobSpec[] {
  const out: BlobSpec[] = [];
  const xMin = -20;
  const xMax = 21;
  const zMin = -15.5;
  const zMax = 11;
  /** Outer scatter: prior chain × −30% × −50% × −30% × −20% */
  const familyCount = Math.floor(17 * 0.8 * 0.7 * 0.5 * 0.7 * 0.8);

  for (let f = 0; f < familyCount; f++) {
    let cx = 0;
    let cz = 0;
    let placed = false;
    for (let attempt = 0; attempt < 140; attempt++) {
      cx = xMin + rnd() * (xMax - xMin);
      cz = zMin + rnd() * (zMax - zMin);
      if (!isExcludedXZ(cx, cz)) {
        placed = true;
        break;
      }
    }
    if (!placed) continue;

    const children = 2 + Math.floor(rnd() * 6);
    const bigFirst = rnd() > 0.35;

    for (let b = 0; b < children; b++) {
      const isBig = bigFirst && b === 0 && rnd() > 0.2;
      const mul = isBig ? 1.15 + rnd() * 0.55 : 0.35 + rnd() * 0.75;
      const ox = (rnd() - 0.5) * (isBig ? 2.1 : 3.2);
      const oz = (rnd() - 0.5) * (isBig ? 1.85 : 2.9);
      const oy = -0.72 + rnd() * 1.05;

      let sx = (0.28 + rnd() * (isBig ? 1.05 : 0.65)) * mul * 1.1;
      let sy = (0.22 + rnd() * (isBig ? 0.78 : 0.52)) * mul * (0.7 + rnd() * 0.45) * 1.1;
      let sz = (0.26 + rnd() * (isBig ? 0.95 : 0.58)) * mul * 1.1;
      const j = 0.14;
      sx *= 1 + (rnd() - 0.5) * j;
      sy *= 1 + (rnd() - 0.5) * j;
      sz *= 1 + (rnd() - 0.5) * j;
      const squashTilt = 0.92 + rnd() * 0.16;
      if (rnd() > 0.5) sx *= squashTilt;
      else sy *= squashTilt;

      const baseA = pickOpacity(rnd) * (0.88 + rnd() * 0.2);
      const T = THREE.MathUtils.clamp(1 - baseA, 0.03, 0.97);
      const T_lo = T * 0.8;
      const T_hi = Math.min(1, T * 1.2);
      const span = Math.max(T_hi - T_lo, 1e-5);
      const T_pick = T_lo + rnd() * span;
      const opacity = THREE.MathUtils.clamp(1 - T_pick, 0.06, 0.95);

      out.push({
        position: [cx + ox, oy, cz + oz],
        scale: [sx, sy, sz],
        rotation: [(rnd() - 0.5) * 0.38, (rnd() - 0.5) * 0.52, (rnd() - 0.5) * 0.38],
        color: pickColor(rnd),
        opacity,
        emissiveIntensity: 0.05 + rnd() * 0.14,
        seed: rnd() * 1000,
        brush: Math.floor(rnd() * 5),
        stripe: 0,
      });
    }
  }
  return out;
}

function buildMagicThreads(rnd: () => number): [number, number, number][][] {
  const threads: [number, number, number][][] = [];
  const xMin = -19;
  const xMax = 20;
  const zMin = -14;
  const zMax = 10;

  for (let k = 0; k < 15; k++) {
    let sx = 0;
    let sz = 0;
    let ok = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      sx = xMin + rnd() * (xMax - xMin);
      sz = zMin + rnd() * (zMax - zMin);
      if (!isExcludedXZ(sx, sz)) {
        ok = true;
        break;
      }
    }
    if (!ok) continue;

    const segs = 3 + Math.floor(rnd() * 4);
    const pts: [number, number, number][] = [];
    let x = sx;
    let y = -0.15 + rnd() * 0.95;
    let z = sz;
    for (let s = 0; s < segs; s++) {
      pts.push([x, y, z]);
      x += (rnd() - 0.5) * 1.85;
      y += (rnd() - 0.5) * 0.42;
      z += (rnd() - 0.5) * 1.65;
    }
    threads.push(pts);
  }
  return threads;
}

function stampFiveStripes(under: BlobSpec[], scattered: BlobSpec[], rnd: () => number): [BlobSpec[], BlobSpec[]] {
  const total = under.length + scattered.length;
  const k = Math.min(5, total);
  const chosen = new Set<number>();
  while (chosen.size < k) {
    chosen.add(Math.floor(rnd() * total));
  }
  const stripeAt = (globalIdx: number) => (chosen.has(globalIdx) ? 1 : 0);
  const u2 = under.map((b, i) => ({ ...b, stripe: stripeAt(i) }));
  const s2 = scattered.map((b, i) => ({ ...b, stripe: stripeAt(i + under.length) }));
  return [u2, s2];
}

function fillBlobInstanceAttributes(geometry: THREE.BufferGeometry, specs: BlobSpec[]) {
  const n = specs.length;
  const col = new Float32Array(n * 3);
  const opa = new Float32Array(n);
  const seed = new Float32Array(n);
  const emit = new Float32Array(n);
  const brush = new Float32Array(n);
  const stripe = new Float32Array(n);
  const tmp = new THREE.Color();

  for (let i = 0; i < n; i++) {
    const s = specs[i]!;
    hexToRgb(s.color, tmp).toArray(col, i * 3);
    opa[i] = s.opacity;
    seed[i] = s.seed;
    emit[i] = s.emissiveIntensity;
    brush[i] = s.brush;
    stripe[i] = s.stripe;
  }

  geometry.setAttribute("instanceColor", new THREE.InstancedBufferAttribute(col, 3));
  geometry.setAttribute("instanceOpacity", new THREE.InstancedBufferAttribute(opa, 1));
  geometry.setAttribute("instanceSeed", new THREE.InstancedBufferAttribute(seed, 1));
  geometry.setAttribute("instanceEmissive", new THREE.InstancedBufferAttribute(emit, 1));
  geometry.setAttribute("instanceBrush", new THREE.InstancedBufferAttribute(brush, 1));
  geometry.setAttribute("instanceStripe", new THREE.InstancedBufferAttribute(stripe, 1));
}

function hexToRgb(hex: string, out: THREE.Color) {
  return out.set(hex);
}

function PainterlyBlobInstanced({ specs }: { specs: BlobSpec[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = specs.length;

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.5, 22, 18);
    fillBlobInstanceAttributes(geo, specs);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: BLOB_VS,
      fragmentShader: BLOB_FS,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return { geometry: geo, material: mat };
  }, [specs]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      const s = specs[i]!;
      dummy.position.set(...s.position);
      dummy.scale.set(...s.scale);
      const r = s.rotation ?? [0, 0, 0];
      dummy.rotation.set(r[0]!, r[1]!, r[2]!);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, dummy, specs]);

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  if (count === 0) return null;

  return (
    <instancedMesh ref={ref} args={[geometry, material, count]} renderOrder={2} frustumCulled={false} />
  );
}

function MicroGlitterField({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { geometry, material, instances } = useMemo(() => {
    const rnd = mulberry32(77221);
    const geo = new THREE.SphereGeometry(1, 10, 8);
    const col = new Float32Array(count * 3);
    const opa = new Float32Array(count);
    const seed = new Float32Array(count);
    const tmp = new THREE.Color();

    const xMin = -20;
    const xMax = 20;
    const zMin = -15;
    const zMax = 10.5;
    const xArr = new Float32Array(count);
    const y0 = new Float32Array(count);
    const zArr = new Float32Array(count);
    const scale = new Float32Array(count);
    const phase = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      let x = 0;
      let z = 0;
      let placed = false;
      for (let attempt = 0; attempt < 140; attempt++) {
        x = xMin + rnd() * (xMax - xMin);
        z = zMin + rnd() * (zMax - zMin);
        if (!isExcludedXZ(x, z)) {
          placed = true;
          break;
        }
      }
      if (!placed) {
        x = 10.5 + (rnd() - 0.5) * 9;
        z = -4.2 + (rnd() - 0.5) * 7;
      }
      xArr[i] = x;
      zArr[i] = z;
      y0[i] = -0.55 + rnd() * 1.38;
      scale[i] = 0.035 + rnd() * 0.095;
      phase[i] = rnd() * Math.PI * 2;

      hexToRgb(pickColor(rnd), tmp).toArray(col, i * 3);
      opa[i] = 0.25 + rnd() * 0.55;
      seed[i] = rnd() * 1000;
    }

    geo.setAttribute("instanceColor", new THREE.InstancedBufferAttribute(col, 3));
    geo.setAttribute("instanceOpacity", new THREE.InstancedBufferAttribute(opa, 1));
    geo.setAttribute("instanceSeed", new THREE.InstancedBufferAttribute(seed, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: GLITTER_VS,
      fragmentShader: GLITTER_FS,
      transparent: true,
      depthWrite: false,
    });

    return { geometry: geo, material: mat, instances: { xArr, y0, zArr, scale, phase } };
  }, [count]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const { xArr, y0, zArr, scale, phase } = instances;
    for (let i = 0; i < count; i++) {
      dummy.position.set(xArr[i]!, y0[i]!, zArr[i]!);
      dummy.scale.setScalar(scale[i]!);
      dummy.rotation.set(phase[i]! * 0.8, phase[i]! * 1.1, phase[i]! * 0.6);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, dummy, instances]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = clock.elapsedTime;
    material.uniforms.uTime.value = t;
    const { xArr, y0, zArr, scale, phase } = instances;
    for (let i = 0; i < count; i++) {
      const y = y0[i]! + Math.sin(t * 1.05 + phase[i]!) * 0.028;
      dummy.position.set(xArr[i]!, y, zArr[i]!);
      dummy.scale.setScalar(scale[i]!);
      dummy.rotation.set(phase[i]! * 0.8, phase[i]! * 1.1, phase[i]! * 0.6);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <instancedMesh ref={ref} args={[geometry, material, count]} renderOrder={3} frustumCulled={false} />
  );
}

const GLITTER_COUNT = Math.round(168 * 0.7);

export function AuraMagicalMistScenery() {
  const underRef = useRef<THREE.Group>(null);
  const curve = useMemo(() => createCitadelToyStarRiverCurve(), []);

  const rawUnderRiver = useMemo(() => buildUnderRiverBlobs(curve, mulberry32(884201)), [curve]);
  const rawScattered = useMemo(() => buildScatteredFamilies(mulberry32(884202)), []);
  const [underRiver, scattered] = useMemo(
    () => stampFiveStripes(rawUnderRiver, rawScattered, mulberry32(99177)),
    [rawUnderRiver, rawScattered],
  );
  const threads = useMemo(() => buildMagicThreads(mulberry32(884203)), []);

  useFrame(({ clock }) => {
    if (!underRef.current) return;
    const t = clock.elapsedTime;
    underRef.current.position.y = Math.sin(t * 0.38) * 0.045;
  });

  return (
    <group name="aura-magical-mist-scenery" renderOrder={2}>
      <group ref={underRef}>
        <PainterlyBlobInstanced specs={underRiver} />
      </group>
      <PainterlyBlobInstanced specs={scattered} />

      {threads.map((pts, i) => (
        <Line
          key={`th-${i}`}
          points={pts}
          color="#CEDEF2"
          lineWidth={1}
          transparent
          opacity={0.12 + (i % 5) * 0.02}
          depthWrite={false}
          renderOrder={2}
        />
      ))}

      <MicroGlitterField count={GLITTER_COUNT} />
    </group>
  );
}
