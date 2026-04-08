import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function MiniTraveler() {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const eyeLRef = useRef<THREE.Mesh>(null);
  const eyeRRef = useRef<THREE.Mesh>(null);
  const blinkRef = useRef({ t: 0, next: 1.8 + Math.random() * 2.4, closing: false });

  const porcelain = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#e7dfd4"),
        roughness: 0.32,
        clearcoat: 0.9,
        clearcoatRoughness: 0.28,
      }),
    []
  );
  const felt = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#4f7f8c"),
        roughness: 0.92,
        sheen: 0.55,
        sheenColor: new THREE.Color("#e7dfd4"),
        sheenRoughness: 0.85,
      }),
    []
  );
  const straw = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#f1b39b"),
        roughness: 0.88,
        metalness: 0,
        clearcoat: 0.15,
        clearcoatRoughness: 0.85,
      }),
    []
  );
  const scarf = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#c99a54"),
        roughness: 0.9,
        sheen: 0.35,
        sheenColor: new THREE.Color("#f2ede4"),
        sheenRoughness: 0.9,
      }),
    []
  );
  const ink = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color("#1a2026"), roughness: 0.95 }), []);
  const blush = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color("#f1b39b"), roughness: 0.95, transparent: true, opacity: 0.65 }),
    []
  );
  const backpack = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#2f6f7a"),
        roughness: 0.86,
        clearcoat: 0.2,
        clearcoatRoughness: 0.7,
        sheen: 0.35,
        sheenColor: new THREE.Color("#e7dfd4"),
        sheenRoughness: 0.9,
      }),
    []
  );
  const shell = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#f2ede4"),
        roughness: 0.55,
        clearcoat: 0.65,
        clearcoatRoughness: 0.35,
      }),
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.getElapsedTime();
    const root = rootRef.current;
    if (root) {
      // slow breathing + subtle sway (adult, calming)
      // NOTE: island sand plane is around y=-0.45; keep traveler above it.
      root.position.y = -0.24 + Math.sin(t * 0.9) * 0.012;
      root.rotation.y = -0.62 + Math.sin(t * 0.22) * 0.04;
    }
    const head = headRef.current;
    if (head) {
      head.rotation.x = Math.sin(t * 0.55) * 0.04;
      head.rotation.z = Math.sin(t * 0.35) * 0.03;
    }

    // blink (random, soft)
    const b = blinkRef.current;
    b.t += dt;
    if (!b.closing && b.t >= b.next) {
      b.closing = true;
      b.t = 0;
    }
    const closeDur = 0.08;
    const openDur = 0.12;
    let blinkY = 1;
    if (b.closing) {
      if (b.t < closeDur) blinkY = THREE.MathUtils.lerp(1, 0.08, b.t / closeDur);
      else if (b.t < closeDur + openDur) blinkY = THREE.MathUtils.lerp(0.08, 1, (b.t - closeDur) / openDur);
      else {
        b.closing = false;
        b.t = 0;
        b.next = 2.2 + Math.random() * 3.4;
        blinkY = 1;
      }
    }
    const eL = eyeLRef.current;
    const eR = eyeRRef.current;
    if (eL) eL.scale.y = blinkY;
    if (eR) eR.scale.y = blinkY;
  });

  return (
    <group ref={rootRef} position={[2.35, -0.24, 1.35]} rotation={[0, -0.62, 0]} scale={2.25}>
      {/* body (rounder, warmer) */}
      <RoundedBox args={[0.34, 0.32, 0.26]} radius={0.13} smoothness={7} material={felt} castShadow />

      {/* head */}
      <mesh ref={headRef} position={[0, 0.33, 0.01]} castShadow>
        <sphereGeometry args={[0.17, 28, 28]} />
        <primitive object={porcelain} attach="material" />
      </mesh>

      {/* eyes */}
      <mesh ref={eyeLRef} position={[-0.06, 0.34, 0.16]} castShadow>
        <sphereGeometry args={[0.016, 16, 16]} />
        <primitive object={ink} attach="material" />
      </mesh>
      <mesh ref={eyeRRef} position={[0.06, 0.34, 0.16]} castShadow>
        <sphereGeometry args={[0.016, 16, 16]} />
        <primitive object={ink} attach="material" />
      </mesh>

      {/* mouth (tiny smile) */}
      <mesh position={[0, 0.305, 0.165]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.022, 0.004, 10, 28, Math.PI]} />
        <primitive object={ink} attach="material" />
      </mesh>

      {/* cheeks */}
      <mesh position={[-0.075, 0.312, 0.158]} rotation={[0.12, 0, 0]}>
        <circleGeometry args={[0.028, 18]} />
        <primitive object={blush} attach="material" />
      </mesh>
      <mesh position={[0.075, 0.312, 0.158]} rotation={[0.12, 0, 0]}>
        <circleGeometry args={[0.028, 18]} />
        <primitive object={blush} attach="material" />
      </mesh>

      {/* cozy scarf */}
      <mesh position={[0, 0.21, 0.09]} rotation={[0.18, 0, 0]} castShadow>
        <torusGeometry args={[0.11, 0.03, 14, 28]} />
        <primitive object={scarf} attach="material" />
      </mesh>

      {/* backpack (vacation traveler cue) */}
      <mesh position={[0, 0.18, -0.14]} castShadow>
        <RoundedBox args={[0.22, 0.22, 0.12]} radius={0.06} smoothness={6} material={backpack} />
      </mesh>

      {/* shell charm */}
      <mesh position={[0.16, 0.18, 0.12]} rotation={[0.2, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.028, 16, 16]} />
        <primitive object={shell} attach="material" />
      </mesh>

      {/* straw-ish beach hat (warm, friendly) */}
      <mesh position={[0, 0.49, 0.02]} castShadow>
        <cylinderGeometry args={[0.17, 0.19, 0.08, 24]} />
        <primitive object={straw} attach="material" />
      </mesh>
      <mesh position={[0, 0.46, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.23, 0.028, 10, 28]} />
        <primitive object={straw} attach="material" />
      </mesh>
    </group>
  );
}

