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

  // Warm ivory sand — Image 2 cream/ivory
  const sand = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#f0e5d4"),
        roughness: 0.97,
        metalness: 0,
      }),
    []
  );

  // Terracotta cliff sides — Image 2 brick-red
  const cliff = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#c06845"),
        roughness: 0.86,
        metalness: 0,
      }),
    []
  );

  // Wet shoreline — slightly darker, cooler sand at water's edge
  const shore = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#d4c5b0"),
        roughness: 0.98,
        metalness: 0,
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

      {/* Shore ring — wet sand 0.8 units wide around edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.438, 0]} receiveShadow>
        <ringGeometry args={[3.35, 4.45, 128]} />
        <primitive object={shore} attach="material" />
      </mesh>
    </group>
  );
}
