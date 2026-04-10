import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function BreathingPedestalLight({ targetColor }: { targetColor: string }) {
  const light = useRef<THREE.PointLight>(null);
  const current = useRef(new THREE.Color("#f2f6ff")); // cold white (initial)
  const next = useRef(new THREE.Color("#f2f6ff"));

  useEffect(() => {
    try {
      next.current.set(targetColor);
    } catch {
      next.current.set("#f2f6ff");
    }
  }, [targetColor]);

  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.getElapsedTime();

    // Breath: slow, rhythmic intensity
    const breath = 0.5 + 0.5 * Math.sin(t * 0.85);
    light.current.intensity = 0.75 + breath * 1.35;

    // Color glide: cold → project accent (smooth)
    current.current.lerp(next.current, 0.03);
    light.current.color.copy(current.current);
  });

  return (
    <pointLight
      ref={light}
      position={[0, -0.95, 0.6]}
      distance={6.5}
      decay={2}
      color={"#f2f6ff"}
      intensity={1.2}
    />
  );
}

function SpacemanModel({ url, yaw }: { url: string; yaw: number }) {
  const gltf = useLoader(GLTFLoader, url) as unknown as { scene: THREE.Object3D };
  const root = useRef<THREE.Group>(null);

  const scene = useMemo(() => {
    const s = gltf.scene.clone(true);
    s.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Heuristic: hide huge flat backdrop planes (often exported as a "paper/card" behind the model).
      // This prevents a large purple/flat rectangle from blocking the character.
      try {
        const b = new THREE.Box3().setFromObject(mesh);
        const sz = new THREE.Vector3();
        b.getSize(sz);
        const flat = Math.min(sz.x, sz.y, sz.z);
        const big = Math.max(sz.x, sz.y, sz.z);
        const mid = (sz.x + sz.y + sz.z - flat - big);
        if (big > 0.9 && mid > 0.9 && flat < 0.06) {
          mesh.visible = false;
          return;
        }
      } catch {
        // ignore
      }

      const mat = mesh.material as unknown;
      if (Array.isArray(mat)) {
        for (const m of mat) {
          const mm = m as THREE.Material;
          // Validation pass: render both sides so "front" doesn't disappear due to back-face culling.
          (mm as unknown as { side?: number }).side = THREE.DoubleSide;
          // Don't force everything to be transparent; it can wash out details and break depth sorting.
          if ((mm as unknown as { transparent?: boolean }).transparent) {
            (mm as unknown as { depthWrite?: boolean }).depthWrite = false;
          }
          mm.needsUpdate = true;
        }
      } else if (mat && typeof mat === "object") {
        const mm = mat as THREE.Material;
        (mm as unknown as { side?: number }).side = THREE.DoubleSide;
        if ((mm as unknown as { transparent?: boolean }).transparent) {
          (mm as unknown as { depthWrite?: boolean }).depthWrite = false;
        }
        mm.needsUpdate = true;
      }
    });

    // scale + center to fit the frame
    const box = new THREE.Box3().setFromObject(s);
    const size = new THREE.Vector3();
    box.getSize(size);
    const max = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.35 / max;
    s.scale.setScalar(scale);
    box.setFromObject(s);
    const center = new THREE.Vector3();
    box.getCenter(center);
    s.position.sub(center);
    return s;
  }, [gltf.scene]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!root.current) return;
    root.current.rotation.y = yaw;
    root.current.rotation.x = Math.sin(t * 0.18) * 0.06;
    root.current.position.y = Math.sin(t * 0.6) * 0.08;
  });

  return (
    <group ref={root}>
      <primitive object={scene} />
    </group>
  );
}

export function SpacemanGlbCanvas({
  className,
  accentColor,
  yaw,
}: {
  className?: string;
  /** Project element main color (target). Light starts cold-white and glides to this. */
  accentColor: string;
  /** Yaw in radians; controlled by UI. */
  yaw: number;
}) {
  const url = useMemo(() => new URL("../../../models/spaceman.glb", import.meta.url).toString(), []);
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0.25, 2.65], fov: 34 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      shadows
      onCreated={({ gl, scene }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.92;
        const pmrem = new THREE.PMREMGenerator(gl);
        const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = env;
        pmrem.dispose();
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.22} />
        <directionalLight position={[3.5, 5, 4]} intensity={0.72} color="#fff8f2" castShadow />
        <directionalLight position={[-4, -2, 3]} intensity={0.22} color="#c8d4f0" />
        <hemisphereLight args={["#f5f0ff", "#e8e4dc", 0.22]} />
        <BreathingPedestalLight targetColor={accentColor} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.05, 0]} receiveShadow>
          <circleGeometry args={[1.35, 48]} />
          <shadowMaterial transparent opacity={0.25} />
        </mesh>
        <SpacemanModel url={url} yaw={yaw} />
      </Suspense>
    </Canvas>
  );
}
