import * as THREE from "three";

/** Full arc: west mist → Citadel flank → ring/petal toys (~[18.2, 1.48, -9.1]). */
export function createCitadelToyStarRiverCurve(): THREE.CatmullRomCurve3 {
  const west = new THREE.Vector3(3.0, -0.5, -4.78);
  const w2 = new THREE.Vector3(4.72, -0.1, -5.0);
  const w3 = new THREE.Vector3(7.02, 0.52, -5.32);
  const w4 = new THREE.Vector3(9.22, 1.02, -5.52);
  const start = new THREE.Vector3(10.85, 1.25, -5.65);
  const midA = new THREE.Vector3(13.2, 2.05, -6.85);
  const midB = new THREE.Vector3(15.35, 1.72, -7.65);
  const end = new THREE.Vector3(17.65, 1.42, -8.92);
  return new THREE.CatmullRomCurve3([west, w2, w3, w4, start, midA, midB, end], false, "chordal");
}
