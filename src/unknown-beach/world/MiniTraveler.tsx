import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Scholar-Traveler — chibi redesign.
 *
 * Proportions (local space, scale = 2.1):
 *   shoe bottom  y = -0.28  →  world y = 0.15 + (-0.28 × 2.1) = -0.44  (sand surface ✓)
 *   legs         y = -0.20 → -0.06
 *   body         y = -0.04 →  0.34   (h=0.38)
 *   neck         y =  0.38 →  0.46
 *   head         y =  0.56          (r=0.185)
 *   hat top      y ≈  0.78
 *
 * Color palette from Image 2:
 *   coat/shirt: ivory #ede5d6   hat: wheat #d4a85c   band: terracotta #b85840
 *   pack: navy #2e404e          scarf: dusty rose #c08890
 *   skin: warm peach #f2d4b4   shorts: linen #d8cfc0  shoes: warm brown #7a4828
 */
export function MiniTraveler() {
  const rootRef  = useRef<THREE.Group>(null);
  const headRef  = useRef<THREE.Group>(null);
  const armLRef  = useRef<THREE.Group>(null);
  const eyeLRef  = useRef<THREE.Mesh>(null);
  const eyeRRef  = useRef<THREE.Mesh>(null);
  const blinkRef = useRef({ t: 0, next: 2.5 + Math.random() * 3, closing: false });

  // ─── materials ────────────────────────────────────────────────────────────

  const skin = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#f2d4b4"),
    roughness: 0.30,
    clearcoat: 0.80,
    clearcoatRoughness: 0.35,
  }), []);

  const coat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ede5d6"),
    roughness: 0.86,
    sheen: 0.55,
    sheenColor: new THREE.Color("#f8f3ec"),
    sheenRoughness: 0.80,
  }), []);

  const shorts = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#d8cfc0"),
    roughness: 0.90,
  }), []);

  const shoes = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#7a4828"),
    roughness: 0.78,
    clearcoat: 0.20,
    clearcoatRoughness: 0.65,
  }), []);

  const hatStraw = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#d4a85c"),
    roughness: 0.80,
    clearcoat: 0.10,
    clearcoatRoughness: 0.92,
  }), []);

  const hatBand = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#b85840"),
    roughness: 0.76,
  }), []);

  const pack = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#2e404e"),
    roughness: 0.80,
    clearcoat: 0.15,
    clearcoatRoughness: 0.78,
  }), []);

  const scarf = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#c08890"),
    roughness: 0.90,
    sheen: 0.45,
    sheenColor: new THREE.Color("#f0e0e4"),
    sheenRoughness: 0.88,
  }), []);

  const ink = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#1e2636"), roughness: 0.95,
  }), []);

  const inkHL = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#ffffff"), roughness: 0.5,
  }), []);

  const blush = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#e89080"), roughness: 0.95,
    transparent: true, opacity: 0.55,
  }), []);

  const brow = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color("#7a4e30"), roughness: 0.90,
  }), []);

  // ─── animation ────────────────────────────────────────────────────────────

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();

    // Gentle body bob + slow turn
    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(t * 0.80) * 0.012;
      rootRef.current.rotation.y = Math.sin(t * 0.18) * 0.032;
    }

    // Head nod + slight tilt — looking out at ocean
    if (headRef.current) {
      headRef.current.rotation.x = -0.08 + Math.sin(t * 0.45) * 0.030;
      headRef.current.rotation.y = 0.12 + Math.sin(t * 0.22) * 0.025;
      headRef.current.rotation.z = Math.sin(t * 0.35) * 0.022;
    }

    // Left arm gentle sway (holding journal)
    if (armLRef.current) {
      armLRef.current.rotation.z = -0.30 + Math.sin(t * 0.60) * 0.025;
    }

    // Blink
    const b = blinkRef.current;
    b.t += dt;
    if (!b.closing && b.t >= b.next) { b.closing = true; b.t = 0; }
    const closeDur = 0.07, openDur = 0.12;
    let blinkY = 1;
    if (b.closing) {
      if (b.t < closeDur) {
        blinkY = THREE.MathUtils.lerp(1, 0.05, b.t / closeDur);
      } else if (b.t < closeDur + openDur) {
        blinkY = THREE.MathUtils.lerp(0.05, 1, (b.t - closeDur) / openDur);
      } else {
        b.closing = false; b.t = 0; b.next = 2.8 + Math.random() * 3.5;
        blinkY = 1;
      }
    }
    if (eyeLRef.current) eyeLRef.current.scale.y = blinkY;
    if (eyeRRef.current) eyeRRef.current.scale.y = blinkY;
  });

  // ─── render ───────────────────────────────────────────────────────────────
  //
  // group at world [3.1, 0.15, 2.4], scale=2.1
  // shoe bottom world_y = 0.15 + (-0.28 × 2.1) = 0.15 - 0.588 = -0.438 ≈ sand ✓

  return (
    <group
      ref={rootRef}
      position={[3.1, 0.15, 2.4]}
      rotation={[0, -1.1, 0]}   // facing roughly toward camera / ocean
      scale={2.1}
    >
      {/* ── Shoes ─────────────────────────────────────────────── */}
      {/* Left shoe */}
      <mesh position={[-0.068, -0.245, 0.018]} castShadow>
        <boxGeometry args={[0.085, 0.062, 0.135]} />
        <primitive object={shoes} attach="material" />
      </mesh>
      {/* Shoe toe cap (rounded front) */}
      <mesh position={[-0.068, -0.244, 0.078]} castShadow>
        <sphereGeometry args={[0.044, 10, 8]} />
        <primitive object={shoes} attach="material" />
      </mesh>

      {/* Right shoe */}
      <mesh position={[0.068, -0.245, 0.018]} castShadow>
        <boxGeometry args={[0.085, 0.062, 0.135]} />
        <primitive object={shoes} attach="material" />
      </mesh>
      <mesh position={[0.068, -0.244, 0.078]} castShadow>
        <sphereGeometry args={[0.044, 10, 8]} />
        <primitive object={shoes} attach="material" />
      </mesh>

      {/* ── Legs (shorts visible below coat) ─────────────────── */}
      {/* Left leg */}
      <mesh position={[-0.068, -0.145, 0]} castShadow>
        <cylinderGeometry args={[0.058, 0.065, 0.175, 12]} />
        <primitive object={shorts} attach="material" />
      </mesh>
      {/* Right leg */}
      <mesh position={[0.068, -0.145, 0]} castShadow>
        <cylinderGeometry args={[0.058, 0.065, 0.175, 12]} />
        <primitive object={shorts} attach="material" />
      </mesh>

      {/* ── Body (ivory travel coat) ──────────────────────────── */}
      <RoundedBox
        args={[0.34, 0.38, 0.24]}
        radius={0.10}
        smoothness={8}
        position={[0, 0.15, 0]}
        material={coat}
        castShadow
      />

      {/* Coat lapel / front detail */}
      <mesh position={[0, 0.20, 0.122]} castShadow>
        <boxGeometry args={[0.08, 0.14, 0.012]} />
        <primitive object={scarf} attach="material" />
      </mesh>

      {/* ── Backpack ──────────────────────────────────────────── */}
      <group position={[0, 0.13, -0.145]}>
        <RoundedBox
          args={[0.20, 0.22, 0.10]}
          radius={0.05}
          smoothness={6}
          material={pack}
          castShadow
        />
        {/* Pack buckle strap */}
        <mesh position={[0, 0.12, 0.04]} castShadow>
          <boxGeometry args={[0.14, 0.022, 0.022]} />
          <primitive object={pack} attach="material" />
        </mesh>
        {/* Small outer pocket */}
        <mesh position={[0, -0.04, 0.055]} castShadow>
          <boxGeometry args={[0.11, 0.10, 0.028]} />
          <primitive object={pack} attach="material" />
        </mesh>
      </group>

      {/* ── Left arm — relaxed, hand holding a journal ────────── */}
      <group ref={armLRef} position={[-0.21, 0.17, 0.02]} rotation={[0.15, 0, -0.30]}>
        {/* Upper arm */}
        <mesh castShadow>
          <cylinderGeometry args={[0.048, 0.044, 0.22, 10]} />
          <primitive object={coat} attach="material" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.135, 0]} castShadow>
          <sphereGeometry args={[0.048, 12, 12]} />
          <primitive object={skin} attach="material" />
        </mesh>
        {/* Small journal in hand */}
        <mesh position={[0.028, -0.175, 0.012]} rotation={[0.2, 0.1, 0.1]} castShadow>
          <boxGeometry args={[0.065, 0.082, 0.014]} />
          <primitive object={pack} attach="material" />
        </mesh>
      </group>

      {/* ── Right arm — raised slightly, shading eyes / enjoying breeze ── */}
      <group position={[0.21, 0.20, 0.02]} rotation={[-0.35, 0.15, 0.42]}>
        {/* Upper arm */}
        <mesh castShadow>
          <cylinderGeometry args={[0.048, 0.044, 0.22, 10]} />
          <primitive object={coat} attach="material" />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.18, 0.02]} rotation={[-0.55, 0, 0]} castShadow>
          <cylinderGeometry args={[0.040, 0.044, 0.16, 10]} />
          <primitive object={coat} attach="material" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.145, 0.075]} castShadow>
          <sphereGeometry args={[0.046, 12, 12]} />
          <primitive object={skin} attach="material" />
        </mesh>
      </group>

      {/* ── Scarf — soft loop at collar ───────────────────────── */}
      <mesh position={[0, 0.335, 0.075]} rotation={[0.20, 0, 0]} castShadow>
        <torusGeometry args={[0.098, 0.028, 12, 28]} />
        <primitive object={scarf} attach="material" />
      </mesh>

      {/* ── Neck ──────────────────────────────────────────────── */}
      <mesh position={[0, 0.375, 0.010]} castShadow>
        <cylinderGeometry args={[0.055, 0.062, 0.070, 14]} />
        <primitive object={skin} attach="material" />
      </mesh>

      {/* ── Head group (animated) ─────────────────────────────── */}
      <group ref={headRef} position={[0, 0.490, 0.010]}>

        {/* Head sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.185, 32, 32]} />
          <primitive object={skin} attach="material" />
        </mesh>

        {/* ── Eyes ──────────────────────────────────────────── */}
        {/* Left eye */}
        <mesh ref={eyeLRef} position={[-0.078, 0.030, 0.165]} castShadow>
          <sphereGeometry args={[0.026, 18, 18]} />
          <primitive object={ink} attach="material" />
        </mesh>
        <mesh position={[-0.072, 0.043, 0.178]}>
          <sphereGeometry args={[0.009, 10, 10]} />
          <primitive object={inkHL} attach="material" />
        </mesh>
        {/* Right eye */}
        <mesh ref={eyeRRef} position={[0.078, 0.030, 0.165]} castShadow>
          <sphereGeometry args={[0.026, 18, 18]} />
          <primitive object={ink} attach="material" />
        </mesh>
        <mesh position={[0.084, 0.043, 0.178]}>
          <sphereGeometry args={[0.009, 10, 10]} />
          <primitive object={inkHL} attach="material" />
        </mesh>

        {/* ── Eyebrows — gentle arched ──────────────────────── */}
        <mesh position={[-0.078, 0.068, 0.158]} rotation={[0.22, 0, 0.14]}>
          <boxGeometry args={[0.050, 0.010, 0.008]} />
          <primitive object={brow} attach="material" />
        </mesh>
        <mesh position={[0.078, 0.068, 0.158]} rotation={[0.22, 0, -0.14]}>
          <boxGeometry args={[0.050, 0.010, 0.008]} />
          <primitive object={brow} attach="material" />
        </mesh>

        {/* ── Nose ──────────────────────────────────────────── */}
        <mesh position={[0, 0.008, 0.184]}>
          <sphereGeometry args={[0.015, 12, 12]} />
          <primitive object={skin} attach="material" />
        </mesh>

        {/* ── Mouth — U-smile arc facing camera ────────────────── */}
        <mesh position={[0, -0.030, 0.177]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.030, 0.008, 10, 28, Math.PI * 0.72]} />
          <primitive object={ink} attach="material" />
        </mesh>

        {/* ── Cheek blush ───────────────────────────────────── */}
        <mesh position={[-0.104, 0.012, 0.158]} rotation={[0.15, 0.20, 0]}>
          <circleGeometry args={[0.030, 20]} />
          <primitive object={blush} attach="material" />
        </mesh>
        <mesh position={[0.104, 0.012, 0.158]} rotation={[0.15, -0.20, 0]}>
          <circleGeometry args={[0.030, 20]} />
          <primitive object={blush} attach="material" />
        </mesh>

        {/* ── Ear nubbins ───────────────────────────────────── */}
        <mesh position={[-0.186, 0.010, 0.010]}>
          <sphereGeometry args={[0.030, 10, 10]} />
          <primitive object={skin} attach="material" />
        </mesh>
        <mesh position={[0.186, 0.010, 0.010]}>
          <sphereGeometry args={[0.030, 10, 10]} />
          <primitive object={skin} attach="material" />
        </mesh>

        {/* ── Wide-brim straw hat ────────────────────────────── */}
        {/* Brim disc */}
        <mesh position={[0, 0.155, 0.010]} rotation={[0.08, 0, 0]} castShadow>
          <cylinderGeometry args={[0.285, 0.285, 0.036, 36]} />
          <primitive object={hatStraw} attach="material" />
        </mesh>
        {/* Crown */}
        <mesh position={[0, 0.248, 0.010]} rotation={[0.08, 0, 0]} castShadow>
          <cylinderGeometry args={[0.148, 0.170, 0.110, 28]} />
          <primitive object={hatStraw} attach="material" />
        </mesh>
        {/* Hat band — terracotta stripe */}
        <mesh position={[0, 0.196, 0.010]} rotation={[Math.PI / 2 + 0.08, 0, 0]} castShadow>
          <torusGeometry args={[0.168, 0.019, 10, 32]} />
          <primitive object={hatBand} attach="material" />
        </mesh>
        {/* Small hatband bow detail */}
        <mesh position={[-0.12, 0.198, 0.118]} rotation={[0.08, -0.4, 0.1]}>
          <boxGeometry args={[0.040, 0.018, 0.010]} />
          <primitive object={hatBand} attach="material" />
        </mesh>
      </group>
    </group>
  );
}
