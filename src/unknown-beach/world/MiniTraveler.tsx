import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Scholar-Traveler — redesigned character.
 *
 * Design language from Image 2 color palette:
 *   coat: warm ivory #ede5d6 (like the white robe)
 *   hat:  wheat straw #d4a85c
 *   band: terracotta  #b85840
 *   pack: deep navy   #2e404e
 *   scarf: dusty rose #c08890
 *   skin:  warm peach #f2d4b4
 *   eyes:  dark navy  #1e2636
 *   cheeks: warm rosy #e89080
 *
 * group at y = 0, scale = 2.25 → body bottom sits exactly at sand surface y = -0.45
 */
export function MiniTraveler() {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);
  const blinkRef = useRef({ t: 0, next: 2.0 + Math.random() * 2.8, closing: false });

  // ─── materials ────────────────────────────────────────────────────────────

  /** Porcelain skin — clearcoat gives a fine figurine feel */
  const skin = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#f2d4b4"),
        roughness: 0.28,
        clearcoat: 0.85,
        clearcoatRoughness: 0.32,
      }),
    []
  );

  /** Ivory coat — fabric sheen like a linen travel jacket */
  const coat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#ede5d6"),
        roughness: 0.88,
        sheen: 0.65,
        sheenColor: new THREE.Color("#f8f3ec"),
        sheenRoughness: 0.78,
      }),
    []
  );

  /** Wheat straw hat */
  const hatStraw = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#d4a85c"),
        roughness: 0.82,
        clearcoat: 0.12,
        clearcoatRoughness: 0.9,
      }),
    []
  );

  /** Terracotta hat band — Image 2 brick-red accent */
  const hatBand = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#b85840"),
        roughness: 0.78,
      }),
    []
  );

  /** Deep navy backpack — Image 2 navy blue */
  const pack = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#2e404e"),
        roughness: 0.82,
        clearcoat: 0.18,
        clearcoatRoughness: 0.75,
        sheen: 0.3,
        sheenColor: new THREE.Color("#d8e8f0"),
        sheenRoughness: 0.9,
      }),
    []
  );

  /** Dusty rose scarf — Image 2 muted rose */
  const scarf = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#c08890"),
        roughness: 0.92,
        sheen: 0.42,
        sheenColor: new THREE.Color("#f0e0e4"),
        sheenRoughness: 0.88,
      }),
    []
  );

  const ink = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#1e2636"), roughness: 0.95 }),
    []
  );

  const inkHighlight = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#ffffff"), roughness: 0.5 }),
    []
  );

  const blush = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#e89080"),
        roughness: 0.95,
        transparent: true,
        opacity: 0.58,
      }),
    []
  );

  const brow = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#7a4e30"), roughness: 0.9 }),
    []
  );

  // ─── animation ────────────────────────────────────────────────────────────

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();
    const root = rootRef.current;
    if (root) {
      root.position.y = Math.sin(t * 0.85) * 0.013; // gentle breathing
      root.rotation.y = -0.58 + Math.sin(t * 0.20) * 0.038; // slow sway
    }
    const head = headRef.current;
    if (head) {
      head.rotation.x = -0.06 + Math.sin(t * 0.48) * 0.035; // slight downward gaze
      head.rotation.z = Math.sin(t * 0.32) * 0.028;
    }

    // Blink
    const b = blinkRef.current;
    b.t += dt;
    if (!b.closing && b.t >= b.next) { b.closing = true; b.t = 0; }
    const closeDur = 0.07;
    const openDur = 0.13;
    let blinkY = 1;
    if (b.closing) {
      if (b.t < closeDur) {
        blinkY = THREE.MathUtils.lerp(1, 0.06, b.t / closeDur);
      } else if (b.t < closeDur + openDur) {
        blinkY = THREE.MathUtils.lerp(0.06, 1, (b.t - closeDur) / openDur);
      } else {
        b.closing = false;
        b.t = 0;
        b.next = 2.4 + Math.random() * 3.6;
        blinkY = 1;
      }
    }
    if (eyeLRef.current) eyeLRef.current.scale.y = blinkY;
    if (eyeRRef.current) eyeRRef.current.scale.y = blinkY;
  });

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    /**
     * y=0, scale=2.25 → body bottom at world y = 0 + (-0.20 × 2.25) = -0.45
     * Exactly at the sand surface.
     */
    <group ref={rootRef} position={[2.2, 0, 1.2]} rotation={[0, -0.58, 0]} scale={2.25}>

      {/* ── Body / jacket (ivory coat) ─────────────────── */}
      <RoundedBox args={[0.36, 0.40, 0.25]} radius={0.12} smoothness={8} material={coat} castShadow />

      {/* ── Left arm ──────────────────────────────────────── */}
      <group position={[-0.22, 0.07, 0.03]} rotation={[0.15, 0, -0.32]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.052, 0.048, 0.26, 12]} />
          <primitive object={coat} attach="material" />
        </mesh>
        {/* Left hand */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <sphereGeometry args={[0.052, 12, 12]} />
          <primitive object={skin} attach="material" />
        </mesh>
      </group>

      {/* ── Right arm (slightly more forward — reaching toward ocean) ── */}
      <group position={[0.22, 0.07, 0.04]} rotation={[-0.12, 0.15, 0.28]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.052, 0.048, 0.26, 12]} />
          <primitive object={coat} attach="material" />
        </mesh>
        {/* Right hand */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <sphereGeometry args={[0.052, 12, 12]} />
          <primitive object={skin} attach="material" />
        </mesh>
      </group>

      {/* ── Scarf ──────────────────────────────────────────── */}
      <mesh position={[0, 0.19, 0.08]} rotation={[0.16, 0, 0]} castShadow>
        <torusGeometry args={[0.115, 0.034, 14, 32]} />
        <primitive object={scarf} attach="material" />
      </mesh>

      {/* ── Backpack ───────────────────────────────────────── */}
      <group position={[0, 0.08, -0.145]}>
        <RoundedBox args={[0.23, 0.25, 0.11]} radius={0.058} smoothness={7} material={pack} castShadow />
        {/* Backpack top strap */}
        <mesh position={[0, 0.14, 0.04]} castShadow>
          <boxGeometry args={[0.18, 0.025, 0.04]} />
          <primitive object={pack} attach="material" />
        </mesh>
      </group>

      {/* ── Neck ───────────────────────────────────────────── */}
      <mesh position={[0, 0.245, 0.01]} castShadow>
        <cylinderGeometry args={[0.062, 0.068, 0.075, 14]} />
        <primitive object={skin} attach="material" />
      </mesh>

      {/* ── Head ───────────────────────────────────────────── */}
      <mesh ref={headRef} position={[0, 0.365, 0.01]} castShadow>
        <sphereGeometry args={[0.195, 32, 32]} />
        <primitive object={skin} attach="material" />
      </mesh>

      {/* ── Face features (relative to head center at [0, 0.365, 0.01]) ── */}

      {/* Left eye */}
      <mesh ref={eyeLRef} position={[-0.082, 0.395, 0.178]} castShadow>
        <sphereGeometry args={[0.024, 18, 18]} />
        <primitive object={ink} attach="material" />
      </mesh>
      {/* Left eye highlight */}
      <mesh position={[-0.076, 0.408, 0.189]}>
        <sphereGeometry args={[0.009, 10, 10]} />
        <primitive object={inkHighlight} attach="material" />
      </mesh>

      {/* Right eye */}
      <mesh ref={eyeRRef} position={[0.082, 0.395, 0.178]} castShadow>
        <sphereGeometry args={[0.024, 18, 18]} />
        <primitive object={ink} attach="material" />
      </mesh>
      {/* Right eye highlight */}
      <mesh position={[0.088, 0.408, 0.189]}>
        <sphereGeometry args={[0.009, 10, 10]} />
        <primitive object={inkHighlight} attach="material" />
      </mesh>

      {/* Left eyebrow — slight downward inward angle (thoughtful expression) */}
      <mesh position={[-0.082, 0.432, 0.172]} rotation={[0.2, 0, 0.18]}>
        <boxGeometry args={[0.048, 0.010, 0.008]} />
        <primitive object={brow} attach="material" />
      </mesh>
      {/* Right eyebrow */}
      <mesh position={[0.082, 0.432, 0.172]} rotation={[0.2, 0, -0.18]}>
        <boxGeometry args={[0.048, 0.010, 0.008]} />
        <primitive object={brow} attach="material" />
      </mesh>

      {/* Nose — subtle bump */}
      <mesh position={[0, 0.370, 0.192]}>
        <sphereGeometry args={[0.014, 12, 12]} />
        <primitive object={skin} attach="material" />
      </mesh>

      {/* Mouth — relaxed smile */}
      <mesh position={[0, 0.338, 0.183]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.026, 0.0055, 10, 28, Math.PI * 0.8]} />
        <primitive object={ink} attach="material" />
      </mesh>

      {/* Left cheek blush */}
      <mesh position={[-0.108, 0.370, 0.167]} rotation={[0.15, 0.18, 0]}>
        <circleGeometry args={[0.032, 20]} />
        <primitive object={blush} attach="material" />
      </mesh>
      {/* Right cheek blush */}
      <mesh position={[0.108, 0.370, 0.167]} rotation={[0.15, -0.18, 0]}>
        <circleGeometry args={[0.032, 20]} />
        <primitive object={blush} attach="material" />
      </mesh>

      {/* ── Hat — wide flat-brim straw hat ─────────────────── */}
      {/* Crown */}
      <mesh position={[0, 0.546, 0.01]} castShadow>
        <cylinderGeometry args={[0.155, 0.175, 0.115, 28]} />
        <primitive object={hatStraw} attach="material" />
      </mesh>
      {/* Flat brim disc */}
      <mesh position={[0, 0.490, 0.01]} castShadow>
        <cylinderGeometry args={[0.295, 0.295, 0.038, 36]} />
        <primitive object={hatStraw} attach="material" />
      </mesh>
      {/* Hat band — terracotta ribbon at base of crown */}
      <mesh position={[0, 0.493, 0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.176, 0.020, 10, 32]} />
        <primitive object={hatBand} attach="material" />
      </mesh>
    </group>
  );
}
