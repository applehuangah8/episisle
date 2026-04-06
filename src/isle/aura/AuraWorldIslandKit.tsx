import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { AuraIslandId } from "./auraWorldIslandTypes";
import {
  AURA_WORLD_ENTER_CAMERA_PULL,
  AURA_WORLD_ENTER_DURATION_MS,
  AURA_WORLD_ENTER_END_ZOOM,
  AURA_WORLD_ENTER_LOOK_OFFSET,
} from "./auraWorldIslandTypes";
import { playAuraWorldSelectSound } from "./auraWorldSelectSound";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

/** Match AuraWorldDiorama / Canvas defaults */
export const AURA_DEFAULT_CAMERA: [number, number, number] = [10.85, 8.32, 10.55];
export const AURA_DEFAULT_TARGET: [number, number, number] = [1.2, 0.32, -0.58];
export const AURA_DEFAULT_ZOOM = 40.6;
export const AURA_FOCUS_ZOOM = 48.5;

function easeInOutQuad(t: number): number {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

type CamSnap = {
  cam: THREE.Vector3;
  target: THREE.Vector3;
  zoom: number;
  generation: number;
};

export function AuraWorldCameraFocus({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;

  const selectedId = useAuraWorldSelection((s) => s.selectedId);
  const floatRoots = useAuraWorldSelection((s) => s.floatRoots);
  const isEntering = useAuraWorldSelection((s) => s.isEntering);
  const isEntered = useAuraWorldSelection((s) => s.isEntered);
  const enterStartedAtMs = useAuraWorldSelection((s) => s.enterStartedAtMs);
  const enterGeneration = useAuraWorldSelection((s) => s.enterGeneration);
  const setEnterPhase = useAuraWorldSelection((s) => s.setEnterPhase);
  const finalizeWorldEntry = useAuraWorldSelection((s) => s.finalizeWorldEntry);
  const tickBloomBoostDecay = useAuraWorldSelection((s) => s.tickBloomBoostDecay);
  const tickNamingPulseDecay = useAuraWorldSelection((s) => s.tickNamingEmissivePulseDecay);

  const islandWp = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const camDesiredEnd = useMemo(() => new THREE.Vector3(), []);
  const targetDesiredEnd = useMemo(() => new THREE.Vector3(), []);
  const offsetVec = useMemo(() => new THREE.Vector3(), []);
  const snapRef = useRef<CamSnap | null>(null);
  const frozenRef = useRef<{ cam: THREE.Vector3; target: THREE.Vector3; zoom: number } | null>(null);
  const finalizedDuringEnterRef = useRef(false);

  useFrame((_, dt) => {
    tickBloomBoostDecay(dt);
    tickNamingPulseDecay(dt);

    const controls = controlsRef.current;
    if (!controls) return;

    /* ─── Entered: locked pose (no large drift) ─── */
    if (isEntered && frozenRef.current) {
      const f = frozenRef.current;
      controls.target.copy(f.target);
      camera.position.copy(f.cam);
      camera.zoom = f.zoom;
      camera.updateProjectionMatrix();
      controls.update();
      return;
    }

    /* ─── Cinematic enter ─── */
    if (isEntering && selectedId && enterStartedAtMs != null) {
      const root = floatRoots[selectedId];
      if (!root) return;

      if (!snapRef.current || snapRef.current.generation !== enterGeneration) {
        snapRef.current = {
          cam: camera.position.clone(),
          target: controls.target.clone(),
          zoom: camera.zoom,
          generation: enterGeneration,
        };
        finalizedDuringEnterRef.current = false;
      }

      const snap = snapRef.current;
      const elapsed = performance.now() - enterStartedAtMs;
      const u = Math.min(1, elapsed / AURA_WORLD_ENTER_DURATION_MS);
      const p = easeInOutQuad(u);
      setEnterPhase(p);

      root.getWorldPosition(islandWp);
      const off = AURA_WORLD_ENTER_LOOK_OFFSET[selectedId];
      offsetVec.set(off[0], off[1], off[2]);
      targetDesiredEnd.copy(islandWp).add(offsetVec);

      camDir.subVectors(camera.position, islandWp);
      if (camDir.lengthSq() < 1e-6) camDir.set(-0.45, 0.35, -0.55);
      camDir.normalize();
      camDesiredEnd.copy(targetDesiredEnd).add(camDir.multiplyScalar(AURA_WORLD_ENTER_CAMERA_PULL));
      camDesiredEnd.y = Math.max(camDesiredEnd.y, islandWp.y + 3.55);

      camera.position.lerpVectors(snap.cam, camDesiredEnd, p);
      controls.target.lerpVectors(snap.target, targetDesiredEnd, p);
      camera.zoom = THREE.MathUtils.lerp(snap.zoom, AURA_WORLD_ENTER_END_ZOOM, p);
      camera.updateProjectionMatrix();
      controls.update();

      if (p >= 0.999 && !finalizedDuringEnterRef.current) {
        finalizedDuringEnterRef.current = true;
        frozenRef.current = {
          cam: camDesiredEnd.clone(),
          target: targetDesiredEnd.clone(),
          zoom: AURA_WORLD_ENTER_END_ZOOM,
        };
        finalizeWorldEntry();
      }
      return;
    }

    /* ─── Archipelago roam (idle): legacy smooth focus toward hovered / previous selection ─── */
    finalizedDuringEnterRef.current = false;
    frozenRef.current = null;
    snapRef.current = null;

    const sel = selectedId;
    const root = sel ? floatRoots[sel] : null;

    if (root) {
      root.getWorldPosition(islandWp);
      const off = AURA_WORLD_ENTER_LOOK_OFFSET[sel!];
      offsetVec.set(off[0] * 0.42, off[1] * 0.42, off[2] * 0.42);
      targetDesiredEnd.copy(islandWp).add(offsetVec);
      camDir.subVectors(camera.position, islandWp);
      if (camDir.lengthSq() < 1e-6) camDir.set(-0.45, 0.35, -0.55);
      camDir.normalize();
      const pull = THREE.MathUtils.clamp(12.2, 9.5, 22);
      camDesiredEnd.copy(islandWp).add(camDir.multiplyScalar(pull));
      camDesiredEnd.y = Math.max(camDesiredEnd.y, islandWp.y + 4.0);
    } else {
      targetDesiredEnd.set(AURA_DEFAULT_TARGET[0], AURA_DEFAULT_TARGET[1], AURA_DEFAULT_TARGET[2]);
      camDesiredEnd.set(AURA_DEFAULT_CAMERA[0], AURA_DEFAULT_CAMERA[1], AURA_DEFAULT_CAMERA[2]);
    }

    const smooth = 1 - Math.pow(0.022, dt * 60);
    controls.target.lerp(targetDesiredEnd, smooth);
    camera.position.lerp(camDesiredEnd, smooth);

    const zGoal = sel ? AURA_FOCUS_ZOOM : AURA_DEFAULT_ZOOM;
    camera.zoom += (zGoal - camera.zoom) * (1 - Math.pow(0.018, dt * 60));
    camera.updateProjectionMatrix();
    controls.update();
  });

  return null;
}

type SelectableProps = {
  id: AuraIslandId;
  floatRef: RefObject<THREE.Group>;
  children: ReactNode;
};

type MatEntry = { mats: THREE.Material[] };

/**
 * World pick: events on this group receive bubbled hits from island meshes only.
 * No extra geometry in front of the diorama (no sphere hitbox, labels, ripple, or dim pass).
 */
export function AuraSelectableIsland({ id, floatRef, children }: SelectableProps) {
  const setFloatRoot = useAuraWorldSelection((s) => s.setFloatRoot);
  const selectedWorldId = useAuraWorldSelection((s) => s.selectedWorldId);
  const hoveredId = useAuraWorldSelection((s) => s.hoveredId);
  const isEntering = useAuraWorldSelection((s) => s.isEntering);
  const isEntered = useAuraWorldSelection((s) => s.isEntered);
  const enterPhase = useAuraWorldSelection((s) => s.enterPhase);
  const showNamingModal = useAuraWorldSelection((s) => s.showNamingModal);
  const namingEmissivePulse = useAuraWorldSelection((s) => s.namingEmissivePulse);

  const contentRef = useRef<THREE.Group>(null);
  const hoverLift = useRef(0);
  const hoverScale = useRef(1);
  const selScaleRef = useRef(1);
  const retreatZ = useRef(0);
  const matListRef = useRef<MatEntry[]>([]);

  useLayoutEffect(() => {
    let cancelled = false;
    let raf = 0;
    const tryBind = () => {
      if (cancelled) return;
      const g = floatRef.current;
      if (g) {
        setFloatRoot(id, g);
        return;
      }
      raf = requestAnimationFrame(tryBind);
    };
    tryBind();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      setFloatRoot(id, null);
    };
  }, [id, floatRef, setFloatRoot]);

  useLayoutEffect(() => {
    const list: MatEntry[] = [];
    const root = contentRef.current;
    if (!root) {
      matListRef.current = [];
      return;
    }
    root.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material) {
        const mats = (Array.isArray(o.material) ? o.material : [o.material]) as THREE.Material[];
        list.push({ mats });
        for (const m of mats) {
          if ("opacity" in m) {
            const mm = m as THREE.MeshStandardMaterial;
            if (!mm.userData.auraBaseOpacityRecorded) {
              mm.userData.auraBaseOpacity = mm.opacity;
              mm.userData.auraBaseOpacityRecorded = true;
            }
          }
          if ("emissiveIntensity" in m) {
            const mm = m as THREE.MeshStandardMaterial;
            if (!mm.userData.auraBaseEmissiveIntensityRecorded) {
              mm.userData.auraBaseEmissiveIntensity = mm.emissiveIntensity;
              mm.userData.auraBaseEmissiveIntensityRecorded = true;
            }
          }
        }
      }
    });
    matListRef.current = list;
  }, [id]);

  const isHovered = hoveredId === id;
  const isWorldTarget = selectedWorldId === id;
  const fadeOthers =
    (isEntering || isEntered) && selectedWorldId != null && selectedWorldId !== "" && !isWorldTarget;
  const namingPulseBoost =
    isWorldTarget && showNamingModal ? 1 + namingEmissivePulse * 0.92 : 1;

  useFrame((_, dt) => {
    const hGoal = isHovered && !isEntered ? 0.055 : 0;
    hoverLift.current += (hGoal - hoverLift.current) * (1 - Math.pow(0.0015, dt * 60));
    const sGoal = isHovered && !isEntered ? 1.02 : 1;
    hoverScale.current += (sGoal - hoverScale.current) * (1 - Math.pow(0.0015, dt * 60));
    const selGoal = isWorldTarget && (isEntering || isEntered) ? 1.08 : 1;
    selScaleRef.current += (selGoal - selScaleRef.current) * (1 - Math.pow(0.0018, dt * 60));

    const zGoal = fadeOthers ? -0.72 * enterPhase : 0;
    retreatZ.current += (zGoal - retreatZ.current) * (1 - Math.pow(0.006, dt * 60));

    if (contentRef.current) {
      contentRef.current.position.y = hoverLift.current;
      contentRef.current.position.z = retreatZ.current;
      const hs = hoverScale.current * selScaleRef.current;
      if (Number.isFinite(hs) && hs > 0.01 && hs < 80) {
        contentRef.current.scale.setScalar(hs);
      }
    }

    let opacityFactor = 1;
    if (fadeOthers) {
      opacityFactor = 1 - easeInOutQuad(enterPhase);
      if (isEntered) opacityFactor = 0;
    }

    for (const { mats } of matListRef.current) {
      for (const m of mats) {
        if ("opacity" in m && m.userData.auraBaseOpacityRecorded) {
          const base = m.userData.auraBaseOpacity as number;
          const mat = m as THREE.MeshStandardMaterial;
          if (opacityFactor < 0.999) mat.transparent = true;
          mat.opacity = base * opacityFactor;
          mat.depthWrite = opacityFactor > 0.08;
        }
        if ("emissiveIntensity" in m && m.userData.auraBaseEmissiveIntensityRecorded) {
          const baseE = m.userData.auraBaseEmissiveIntensity as number;
          const mat = m as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = baseE * namingPulseBoost * opacityFactor;
        }
      }
    }
  });

  const onHitOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isEntered || isEntering) return;
    useAuraWorldSelection.getState().setHovered(id);
  };

  const onHitOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (useAuraWorldSelection.getState().hoveredId === id) {
      useAuraWorldSelection.getState().scheduleHoverClearFrom(id);
    }
  };

  const onHitClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isEntered || isEntering) return;
    useAuraWorldSelection.getState().beginWorldEntry(id);
    playAuraWorldSelectSound();
  };

  return (
    <group ref={contentRef} onPointerOver={onHitOver} onPointerOut={onHitOut} onClick={onHitClick}>
      {children}
    </group>
  );
}
