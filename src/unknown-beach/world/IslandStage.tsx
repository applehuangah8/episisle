import { useMemo } from "react";
import * as THREE from "three";

// A small helper to create an irregular island outline (deterministic).
function makeIslandShape() {
  const shape = new THREE.Shape();
  const points: THREE.Vector2[] = [];
  const R = 3.9;
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const wobble = 0.18 * Math.sin(a * 3) + 0.12 * Math.sin(a * 7 + 0.8);
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
      depth: 0.55,
      bevelEnabled: true,
      bevelSize: 0.18,
      bevelThickness: 0.12,
      bevelSegments: 3,
      curveSegments: 12,
    });
    // orient so “top” faces up
    g.rotateX(-Math.PI / 2);
    g.translate(0, -1.0, 0);
    g.computeVertexNormals();
    return g;
  }, []);

  const sand = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#f2ede4"),
        roughness: 0.96,
        metalness: 0,
      }),
    []
  );

  const side = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#e7dfd4"),
        roughness: 0.92,
        metalness: 0,
      }),
    []
  );

  // ExtrudeGeometry uses a single material index for all faces by default.
  // We simulate a “different side” by layering a slightly smaller top plate.
  return (
    <group>
      <mesh geometry={geom} material={side} receiveShadow castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]} receiveShadow>
        <circleGeometry args={[4.35, 128]} />
        <primitive object={sand} attach="material" />
      </mesh>
    </group>
  );
}

