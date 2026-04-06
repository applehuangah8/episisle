import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, type RefObject } from "react";
import * as THREE from "three";

import { useAuraWorldSelection } from "./auraWorldSelectionStore";

function easeInOutQuad(t: number): number {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

const FOG_COLOR_A = "#F1F8E8";
const FOG_COLOR_B = "#EDE6D8";
const FOG_DENSITY_BASE = 0.00825;
const BG_COLOR_A = "#EAF4EB";
const BG_COLOR_B = "#E6E2DA";

/**
 * Layer 2 only — fog / background / sun drift + backdrop mesh fade during world enter.
 * No new meshes; mutates existing scene fog and materials under `backdropGroupRef`.
 */
export function AuraWorldEnterAtmosphere({
  backdropGroupRef,
  sunRef,
}: {
  backdropGroupRef: RefObject<THREE.Group>;
  sunRef: RefObject<THREE.DirectionalLight | null>;
}) {
  const scene = useThree((s) => s.scene);
  const enterPhase = useAuraWorldSelection((s) => s.enterPhase);
  const isEntered = useAuraWorldSelection((s) => s.isEntered);
  const w = isEntered ? 1 : enterPhase;
  const p = easeInOutQuad(w);

  const cFogA = useMemo(() => new THREE.Color(FOG_COLOR_A), []);
  const cFogB = useMemo(() => new THREE.Color(FOG_COLOR_B), []);
  const cBgA = useMemo(() => new THREE.Color(BG_COLOR_A), []);
  const cBgB = useMemo(() => new THREE.Color(BG_COLOR_B), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const fog = scene.fog;
    if (fog instanceof THREE.FogExp2) {
      tmp.copy(cFogA).lerp(cFogB, p);
      fog.color.copy(tmp);
      fog.density = THREE.MathUtils.lerp(FOG_DENSITY_BASE, FOG_DENSITY_BASE * 0.46, p);
    }
    if (scene.background instanceof THREE.Color) {
      tmp.copy(cBgA).lerp(cBgB, p * 0.42);
      scene.background.copy(tmp);
    }

    const sun = sunRef.current;
    if (sun) {
      sun.intensity = THREE.MathUtils.lerp(1.896, 2.06, p);
    }

    const fade = p * 0.58;
    const g = backdropGroupRef.current;
    if (!g) return;
    g.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material) {
        const mats = (Array.isArray(o.material) ? o.material : [o.material]) as THREE.Material[];
        for (const m of mats) {
          if ("opacity" in m) {
            const mat = m as THREE.MeshStandardMaterial;
            if (mat.userData.auraBackdropBaseOpacity == null) {
              mat.userData.auraBackdropBaseOpacity = mat.opacity;
            }
            const base = mat.userData.auraBackdropBaseOpacity as number;
            if (fade > 0.015) mat.transparent = true;
            mat.opacity = base * (1 - fade);
            mat.depthWrite = mat.opacity > 0.12;
          }
        }
      }
    });
  });

  return null;
}
