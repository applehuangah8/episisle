import { useMemo } from "react";
import * as THREE from "three";

function makeIslandShape() {
  const shape = new THREE.Shape();
  const points: THREE.Vector2[] = [];
  const R = 3.9;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const wobble =
      0.16 * Math.sin(a * 3) +
      0.10 * Math.sin(a * 7 + 0.8) +
      0.05 * Math.sin(a * 13 + 2.1);
    const r = R * (1 + wobble);
    points.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, points[i].y);
  shape.closePath();
  return shape;
}

export function IslandStage() {
  const geom = useMemo(() => {
    const shape = makeIslandShape();
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.62,
      bevelEnabled: true,
      bevelSize: 0.22,
      bevelThickness: 0.14,
      bevelSegments: 4,
      curveSegments: 16,
    });
    g.rotateX(-Math.PI / 2);
    // depth=0.62 → top face at y = 0.62 - 1.06 = -0.44
    g.translate(0, -1.06, 0);
    g.computeVertexNormals();
    return g;
  }, []);

  // Warm golden sand — more saturated than ivory for sun-baked look
  const sand = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#f5ddb0"),
        roughness: 0.95,
        metalness: 0,
      }),
    []
  );

  // Vivid terracotta cliff — painterly toy-world look
  const cliff = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#cc6840"),
        roughness: 0.82,
        metalness: 0,
      }),
    []
  );

  // Wet shoreline — slightly blue-green tinted wet sand at water edge
  const shore = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#c8d4b8"),
        roughness: 0.96,
        metalness: 0,
      }),
    []
  );

  // Foam edge — bright cream with slight emissive glow for water foam
  const foam = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#e8f0e8"),
        roughness: 0.88,
        emissive: new THREE.Color("#c8dcc8"),
        emissiveIntensity: 0.18,
        transparent: true,
        opacity: 0.82,
      }),
    []
  );

  return (
    <group>
      {/* Cliff body */}
      <mesh geometry={geom} material={cliff} receiveShadow castShadow />

      {/* Full sand top plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.44, 0]} receiveShadow>
        <circleGeometry args={[4.45, 128]} />
        <primitive object={sand} attach="material" />
      </mesh>

      {/* Shore ring — wet/mossy sand at water's edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.438, 0]} receiveShadow>
        <ringGeometry args={[3.35, 4.45, 128]} />
        <primitive object={shore} attach="material" />
      </mesh>

      {/* Foam ring — bright water-edge foam just outside island */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.96, 0]}>
        <ringGeometry args={[4.42, 5.10, 128]} />
        <primitive object={foam} attach="material" />
      </mesh>
    </group>
  );
}
