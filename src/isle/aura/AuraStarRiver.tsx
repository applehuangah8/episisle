import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { createCitadelToyStarRiverCurve } from "./auraStarRiverCurve";

/** Cool blues + warm star — gradient + sparkle */
const PALETTE = ["#7E9CD9", "#CEDEF2", "#6F9ABF", "#F2E3B6", "#A9BFDC"] as const;

const STAR_RIVER_VS = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 color;
attribute vec3 aSide;
attribute vec3 aBinorm;
attribute float aWaveAmp;
attribute float aWaveFreq;
attribute float aAlong;
varying vec3 vColor;
varying float vTwinkle;
varying float vAlong;
uniform float uTime;
uniform float uPointScale;

void main() {
  vColor = color;
  vAlong = aAlong;
  vTwinkle = 0.5 + 0.5 * sin(uTime * 1.45 + aPhase * 1.25);
  float w1 = sin(uTime * aWaveFreq + aPhase) * aWaveAmp;
  float w2 = cos(uTime * aWaveFreq * 0.71 + aPhase * 1.83) * aWaveAmp * 0.68;
  float w3 = sin(uTime * aWaveFreq * 1.27 + aPhase * 0.41) * aWaveAmp * 0.42;
  vec3 posW = position + aSide * w1 + aBinorm * w2 + aSide * w3 * 0.35;
  vec4 mvPosition = modelViewMatrix * vec4(posW, 1.0);
  float dist = max(-mvPosition.z, 0.32);
  gl_PointSize = aSize * uPointScale * (320.0 / dist) * (0.82 + 0.18 * vTwinkle);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const STAR_RIVER_FS = /* glsl */ `
varying vec3 vColor;
varying float vTwinkle;
varying float vAlong;
uniform float uOpacity;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  if (d > 0.5) discard;
  float core = 1.0 - smoothstep(0.0, 0.2, d);
  float halo = 1.0 - smoothstep(0.1, 0.5, d);
  vec3 gradBoost = mix(vec3(0.92, 0.95, 1.04), vec3(1.06, 1.02, 0.96), vAlong);
  vec3 rgb = vColor * gradBoost * (0.82 + 0.18 * core);
  float a = uOpacity * halo * (0.42 + 0.58 * vTwinkle) * (0.72 + 0.28 * core);
  gl_FragColor = vec4(rgb, a);
}
`;

const DUST_VS = /* glsl */ `
attribute float aPhase;
attribute vec3 color;
attribute float aSpread;
attribute vec3 aSide;
attribute vec3 aBinorm;
attribute float aWaveAmp;
attribute float aWaveFreq;
varying vec3 vColor;
varying float vPulse;
uniform float uTime;

void main() {
  vColor = color;
  vPulse = 0.5 + 0.5 * sin(uTime * 1.9 + aPhase);
  vec3 p = position;
  float t = uTime * 0.065 + aPhase;
  p.x += sin(t * 1.6 + aSpread) * 0.09;
  p.y += cos(t * 1.05 + aSpread * 0.68) * 0.07;
  p.z += sin(t * 1.22 + aSpread * 1.05) * 0.08;
  float w1 = sin(uTime * aWaveFreq + aPhase) * aWaveAmp;
  float w2 = cos(uTime * aWaveFreq * 0.66 + aSpread) * aWaveAmp * 0.55;
  p += aSide * w1 + aBinorm * w2;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = 8.5 * (150.0 / max(-mvPosition.z, 0.35)) * (0.88 + 0.12 * vPulse);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const DUST_FS = /* glsl */ `
varying vec3 vColor;
varying float vPulse;
uniform float uOpacity;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  if (d > 0.5) discard;
  float soft = 1.0 - smoothstep(0.18, 0.5, d);
  gl_FragColor = vec4(vColor, uOpacity * soft * (0.32 + 0.45 * vPulse));
}
`;

/** Fluffy mist cloud — large soft puffs, slow billow (harbor-island scale) */
const CLOUD_PUFF_VS = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 color;
varying vec3 vColor;
varying float vPulse;
uniform float uTime;
uniform float uPointScale;

void main() {
  vColor = color;
  vPulse = 0.52 + 0.48 * sin(uTime * 0.82 + aPhase);
  float b = uTime * 0.1 + aPhase;
  vec3 wobble = vec3(
    sin(b * 1.05 + aPhase * 2.0) * 0.14,
    cos(b * 0.78 + aPhase * 0.9) * 0.1,
    sin(b * 0.92 + aPhase * 1.45) * 0.12
  );
  vec4 mvPosition = modelViewMatrix * vec4(position + wobble, 1.0);
  float dist = max(-mvPosition.z, 0.26);
  gl_PointSize = aSize * uPointScale * (280.0 / dist) * (0.86 + 0.14 * vPulse);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const CLOUD_PUFF_FS = /* glsl */ `
varying vec3 vColor;
varying float vPulse;
uniform float uOpacity;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float d = length(c);
  if (d > 0.5) discard;
  float soft = 1.0 - smoothstep(0.06, 0.49, d);
  gl_FragColor = vec4(vColor, uOpacity * soft * (0.22 + 0.48 * vPulse));
}
`;

function hexToRgb(hex: string, out: THREE.Color) {
  return out.set(hex);
}

function colorAlongGradient(t: number, stops: THREE.Color[], out: THREE.Color) {
  const n = stops.length - 1;
  const x = THREE.MathUtils.clamp(t, 0, 1) * n;
  const i = Math.min(Math.floor(x), n - 1);
  const f = x - i;
  return out.copy(stops[i]!).lerp(stops[i + 1]!, f);
}

type CloudLobe = {
  cx: number;
  cy: number;
  cz: number;
  rx: number;
  ry: number;
  rz: number;
};

function gauss01(rnd: () => number) {
  return (rnd() + rnd() + rnd() + rnd() - 2) * 0.5;
}

function sampleInLobe(lobe: CloudLobe, rnd: () => number, out: THREE.Vector3) {
  out.set(lobe.cx + gauss01(rnd) * lobe.rx, lobe.cy + gauss01(rnd) * lobe.ry, lobe.cz + gauss01(rnd) * lobe.rz);
  return out;
}

function ribbonLinePoints(
  curve: THREE.CatmullRomCurve3,
  segments: number,
  lateral: number,
  up: THREE.Vector3,
  tan: THREE.Vector3,
  side: THREE.Vector3,
  tmp: THREE.Vector3,
): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const p = curve.getPoint(u);
    curve.getTangentAt(u, tan).normalize();
    side.crossVectors(tan, up);
    if (side.lengthSq() < 1e-8) side.crossVectors(tan, new THREE.Vector3(1, 0, 0));
    side.normalize();
    tmp.copy(side).multiplyScalar(lateral);
    p.add(tmp);
    pts.push([p.x, p.y, p.z]);
  }
  return pts;
}

/**
 * Thick multi-ribbon star river: west mist-cloud (low, harbor-scale) → Citadel flank → toy cluster
 * (~[18.2, 1.48, -9.1]).
 */
export function CitadelToyStarRiver() {
  const pointsRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const cloudRef = useRef<THREE.Points>(null);
  const mainMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const dustMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const cloudMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const camera = useThree((s) => s.camera);

  /** Base ~[-5,0,4.5] harbor is ~6m organic spread; cloud matches that footprint, biased below deck height */
  const curve = useMemo(() => createCitadelToyStarRiverCurve(), []);

  const ribbonLines = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const tan = new THREE.Vector3();
    const side = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    const rnd = mulberry32(77102);
    const count = 9;
    const spread = 2.35;
    const lines: { points: [number, number, number][]; color: string; opacity: number }[] = [];
    for (let r = 0; r < count; r++) {
      const lane = (r / (count - 1) - 0.5) * spread + (rnd() - 0.5) * 0.12;
      lines.push({
        points: ribbonLinePoints(curve, 64, lane, up, tan, side, tmp),
        color: PALETTE[r % PALETTE.length]!,
        opacity: 0.14 + rnd() * 0.1,
      });
    }
    return lines;
  }, [curve]);

  const cloudGeo = useMemo(() => {
    const tmpC = new THREE.Color();
    const mixC = new THREE.Color();
    const stops = PALETTE.map((h) => hexToRgb(h, tmpC.clone()));
    const cols = PALETTE.map((h) => hexToRgb(h, tmpC.clone()));
    const rnd = mulberry32(55133);
    const p = new THREE.Vector3();

    const lobes: CloudLobe[] = [
      { cx: 3.95, cy: -0.22, cz: -4.88, rx: 2.85, ry: 0.92, rz: 2.35 },
      { cx: 5.55, cy: -0.08, cz: -5.35, rx: 1.75, ry: 0.72, rz: 1.55 },
      { cx: 2.65, cy: -0.35, cz: -5.15, rx: 1.55, ry: 0.62, rz: 1.45 },
      { cx: 4.35, cy: 0.18, cz: -4.25, rx: 1.45, ry: 0.58, rz: 1.35 },
      { cx: 3.2, cy: -0.42, cz: -3.95, rx: 1.35, ry: 0.52, rz: 1.25 },
      { cx: 5.1, cy: 0.05, cz: -4.05, rx: 1.25, ry: 0.55, rz: 1.15 },
      { cx: 4.05, cy: -0.38, cz: -5.85, rx: 1.4, ry: 0.48, rz: 1.2 },
    ];
    const weights = lobes.map((L) => L.rx * L.ry * L.rz);
    const wSum = weights.reduce((a, b) => a + b, 0);

    const nCloud = 520;
    const pos = new Float32Array(nCloud * 3);
    const col = new Float32Array(nCloud * 3);
    const size = new Float32Array(nCloud);
    const phase = new Float32Array(nCloud);

    for (let i = 0; i < nCloud; i++) {
      let pick = rnd() * wSum;
      let li = 0;
      for (let j = 0; j < lobes.length; j++) {
        pick -= weights[j]!;
        if (pick <= 0) {
          li = j;
          break;
        }
      }
      sampleInLobe(lobes[li]!, rnd, p);
      p.x += (rnd() - 0.5) * 0.22;
      p.y += (rnd() - 0.5) * 0.16;
      p.z += (rnd() - 0.5) * 0.2;
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;

      const radial = THREE.MathUtils.clamp((p.x - 3.2) / 4.2 + (p.z + 5.1) * 0.08 + 0.35, 0, 1);
      colorAlongGradient(radial, stops, mixC);
      mixC.lerp(cols[Math.floor(rnd() * cols.length)]!, 0.2 + rnd() * 0.18);
      col[i * 3] = mixC.r;
      col[i * 3 + 1] = mixC.g;
      col[i * 3 + 2] = mixC.b;
      size[i] = 0.48 + rnd() * 1.05;
      phase[i] = rnd() * Math.PI * 2;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    return g;
  }, []);

  const { mainGeo, dustGeo } = useMemo(() => {
    const tmpC = new THREE.Color();
    const mixC = new THREE.Color();
    const stops = PALETTE.map((h) => hexToRgb(h, tmpC.clone()));
    const cols = PALETTE.map((h) => hexToRgb(h, tmpC.clone()));

    const up = new THREE.Vector3(0, 1, 0);
    const tan = new THREE.Vector3();
    const side = new THREE.Vector3();
    const binorm = new THREE.Vector3();

    const ribbons = 9;
    const perRibbon = 185;
    const nMain = ribbons * perRibbon;
    const posM = new Float32Array(nMain * 3);
    const colM = new Float32Array(nMain * 3);
    const sizeM = new Float32Array(nMain);
    const phaseM = new Float32Array(nMain);
    const sideM = new Float32Array(nMain * 3);
    const binM = new Float32Array(nMain * 3);
    const waveAmpM = new Float32Array(nMain);
    const waveFreqM = new Float32Array(nMain);
    const alongM = new Float32Array(nMain);

    const rnd = mulberry32(902451);

    let idx = 0;
    for (let r = 0; r < ribbons; r++) {
      const laneCenter = (r / (ribbons - 1) - 0.5) * 2.45 + (rnd() - 0.5) * 0.18;
      for (let k = 0; k < perRibbon; k++) {
        const t = THREE.MathUtils.clamp(k / perRibbon + (rnd() - 0.5) * 0.14 + rnd() * 0.04, 0, 1);
        const p = curve.getPoint(t);
        curve.getTangentAt(t, tan).normalize();
        side.crossVectors(tan, up);
        if (side.lengthSq() < 1e-8) side.crossVectors(tan, new THREE.Vector3(1, 0, 0));
        side.normalize();
        binorm.crossVectors(side, tan).normalize();

        const lateral = laneCenter + (rnd() - 0.5) * 0.62;
        const vertical = (rnd() - 0.5) * 0.48;
        p.addScaledVector(side, lateral);
        p.addScaledVector(binorm, vertical);
        p.addScaledVector(tan, (rnd() - 0.5) * 0.14);

        posM[idx * 3] = p.x;
        posM[idx * 3 + 1] = p.y;
        posM[idx * 3 + 2] = p.z;

        colorAlongGradient(t, stops, mixC);
        const accent = cols[Math.floor(rnd() * cols.length)]!;
        mixC.lerp(accent, 0.22 + rnd() * 0.2);
        colM[idx * 3] = mixC.r;
        colM[idx * 3 + 1] = mixC.g;
        colM[idx * 3 + 2] = mixC.b;

        sideM[idx * 3] = side.x;
        sideM[idx * 3 + 1] = side.y;
        sideM[idx * 3 + 2] = side.z;
        binM[idx * 3] = binorm.x;
        binM[idx * 3 + 1] = binorm.y;
        binM[idx * 3 + 2] = binorm.z;

        alongM[idx] = t;
        phaseM[idx] = rnd() * Math.PI * 2;
        waveAmpM[idx] = 0.07 + rnd() * 0.16;
        waveFreqM[idx] = 1.15 + rnd() * 1.85;
        sizeM[idx] = 0.32 + rnd() * 0.78;

        idx++;
      }
    }

    const gMain = new THREE.BufferGeometry();
    gMain.setAttribute("position", new THREE.BufferAttribute(posM, 3));
    gMain.setAttribute("color", new THREE.BufferAttribute(colM, 3));
    gMain.setAttribute("aSize", new THREE.BufferAttribute(sizeM, 1));
    gMain.setAttribute("aPhase", new THREE.BufferAttribute(phaseM, 1));
    gMain.setAttribute("aSide", new THREE.BufferAttribute(sideM, 3));
    gMain.setAttribute("aBinorm", new THREE.BufferAttribute(binM, 3));
    gMain.setAttribute("aWaveAmp", new THREE.BufferAttribute(waveAmpM, 1));
    gMain.setAttribute("aWaveFreq", new THREE.BufferAttribute(waveFreqM, 1));
    gMain.setAttribute("aAlong", new THREE.BufferAttribute(alongM, 1));

    const nDust = 700;
    const posD = new Float32Array(nDust * 3);
    const colD = new Float32Array(nDust * 3);
    const phaseD = new Float32Array(nDust);
    const spreadD = new Float32Array(nDust);
    const sideD = new Float32Array(nDust * 3);
    const binD = new Float32Array(nDust * 3);
    const waveAmpD = new Float32Array(nDust);
    const waveFreqD = new Float32Array(nDust);

    for (let i = 0; i < nDust; i++) {
      const t = THREE.MathUtils.clamp(i / nDust + (rnd() - 0.5) * 0.22, 0, 1);
      const p = curve.getPoint(t);
      curve.getTangentAt(t, tan).normalize();
      side.crossVectors(tan, up);
      if (side.lengthSq() < 1e-8) side.crossVectors(tan, new THREE.Vector3(1, 0, 0));
      side.normalize();
      binorm.crossVectors(side, tan).normalize();

      p.addScaledVector(side, (rnd() - 0.5) * 2.85);
      p.addScaledVector(binorm, (rnd() - 0.5) * 1.05);
      p.addScaledVector(tan, (rnd() - 0.5) * 0.35);

      posD[i * 3] = p.x;
      posD[i * 3 + 1] = p.y;
      posD[i * 3 + 2] = p.z;

      colorAlongGradient(t, stops, mixC);
      mixC.lerp(cols[(i + 2) % cols.length]!, 0.18);
      colD[i * 3] = mixC.r;
      colD[i * 3 + 1] = mixC.g;
      colD[i * 3 + 2] = mixC.b;

      sideD[i * 3] = side.x;
      sideD[i * 3 + 1] = side.y;
      sideD[i * 3 + 2] = side.z;
      binD[i * 3] = binorm.x;
      binD[i * 3 + 1] = binorm.y;
      binD[i * 3 + 2] = binorm.z;

      phaseD[i] = rnd() * Math.PI * 2;
      spreadD[i] = rnd() * 12.56;
      waveAmpD[i] = 0.05 + rnd() * 0.12;
      waveFreqD[i] = 0.85 + rnd() * 1.4;
    }

    const gDust = new THREE.BufferGeometry();
    gDust.setAttribute("position", new THREE.BufferAttribute(posD, 3));
    gDust.setAttribute("color", new THREE.BufferAttribute(colD, 3));
    gDust.setAttribute("aPhase", new THREE.BufferAttribute(phaseD, 1));
    gDust.setAttribute("aSpread", new THREE.BufferAttribute(spreadD, 1));
    gDust.setAttribute("aSide", new THREE.BufferAttribute(sideD, 3));
    gDust.setAttribute("aBinorm", new THREE.BufferAttribute(binD, 3));
    gDust.setAttribute("aWaveAmp", new THREE.BufferAttribute(waveAmpD, 1));
    gDust.setAttribute("aWaveFreq", new THREE.BufferAttribute(waveFreqD, 1));

    return { mainGeo: gMain, dustGeo: gDust };
  }, [curve]);

  const mainMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0.52 },
          uPointScale: { value: 1 },
        },
        vertexShader: STAR_RIVER_VS,
        fragmentShader: STAR_RIVER_FS,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
      }),
    [],
  );

  const dustMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0.24 },
        },
        vertexShader: DUST_VS,
        fragmentShader: DUST_FS,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
      }),
    [],
  );

  const cloudMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0.2 },
          uPointScale: { value: 1 },
        },
        vertexShader: CLOUD_PUFF_VS,
        fragmentShader: CLOUD_PUFF_FS,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
      }),
    [],
  );

  useEffect(() => {
    mainMatRef.current = mainMat;
    dustMatRef.current = dustMat;
    cloudMatRef.current = cloudMat;
    return () => {
      mainGeo.dispose();
      dustGeo.dispose();
      cloudGeo.dispose();
      mainMat.dispose();
      dustMat.dispose();
      cloudMat.dispose();
    };
  }, [mainGeo, dustGeo, cloudGeo, mainMat, dustMat, cloudMat]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const zoom = (camera as THREE.OrthographicCamera).isOrthographicCamera ? (camera as THREE.OrthographicCamera).zoom : 40.6;
    const z = THREE.MathUtils.clamp(zoom / 40.6, 0.72, 1.42);
    if (mainMatRef.current) {
      mainMatRef.current.uniforms.uTime.value = t;
      mainMatRef.current.uniforms.uPointScale.value = z;
    }
    if (dustMatRef.current) {
      dustMatRef.current.uniforms.uTime.value = t;
    }
    if (cloudMatRef.current) {
      cloudMatRef.current.uniforms.uTime.value = t;
      cloudMatRef.current.uniforms.uPointScale.value = z;
    }
    if (dustRef.current) {
      dustRef.current.rotation.y = Math.sin(t * 0.09) * 0.035;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y = Math.sin(t * 0.065 + 1.2) * 0.028;
    }
  });

  return (
    <group name="citadel-toy-star-river" renderOrder={4}>
      {ribbonLines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color={line.color}
          lineWidth={2}
          transparent
          opacity={line.opacity}
          depthWrite={false}
          renderOrder={3 + (i % 3)}
        />
      ))}
      <points ref={cloudRef} geometry={cloudGeo} material={cloudMat} frustumCulled={false} />
      <points ref={pointsRef} geometry={mainGeo} material={mainMat} frustumCulled={false} />
      <points ref={dustRef} geometry={dustGeo} material={dustMat} frustumCulled={false} />
    </group>
  );
}

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
