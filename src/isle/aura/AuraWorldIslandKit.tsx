import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { AuraIslandId } from "./auraWorldIslandTypes";
import { playAuraWorldSelectSound } from "./auraWorldSelectSound";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

/** Match AuraWorldDiorama / Canvas defaults */
export const AURA_DEFAULT_CAMERA: [number, number, number] = [10.85, 8.32, 10.55];
export const AURA_DEFAULT_TARGET: [number, number, number] = [1.2, 0.32, -0.58];
export const AURA_DEFAULT_ZOOM = 40.6;
export const AURA_FOCUS_ZOOM = 48.5;

export function AuraWorldCameraFocus({ controlsRef }: { controlsRef: RefObject<OrbitControlsImpl | null> }) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const selectedId = useAuraWorldSelection((s) => s.selectedId);
  const floatRoots = useAuraWorldSelection((s) => s.floatRoots);

  const islandWp = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);
  const camDesired = useMemo(() => new THREE.Vector3(), []);
  const targetDesired = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, dt) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const sel = selectedId;
    const root = sel ? floatRoots[sel] : null;

    if (root) {
      root.getWorldPosition(islandWp);
      targetDesired.copy(islandWp).add(new THREE.Vector3(0, 0.48, 0));
      camDir.subVectors(camera.position, islandWp);
      if (camDir.lengthSq() < 1e-6) camDir.set(-0.45, 0.35, -0.55);
      camDir.normalize();
      const pull = THREE.MathUtils.clamp(12.2, 9.5, 22);
      camDesired.copy(islandWp).add(camDir.multiplyScalar(pull));
      camDesired.y = Math.max(camDesired.y, islandWp.y + 4.0);
    } else {
      targetDesired.set(AURA_DEFAULT_TARGET[0], AURA_DEFAULT_TARGET[1], AURA_DEFAULT_TARGET[2]);
      camDesired.set(AURA_DEFAULT_CAMERA[0], AURA_DEFAULT_CAMERA[1], AURA_DEFAULT_CAMERA[2]);
    }

    const smooth = 1 - Math.pow(0.022, dt * 60);
    controls.target.lerp(targetDesired, smooth);
    camera.position.lerp(camDesired, smooth);

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

/**
 * World pick: events on this group receive bubbled hits from island meshes only.
 * No extra geometry in front of the diorama (no sphere hitbox, labels, ripple, or dim pass).
 */
export function AuraSelectableIsland({ id, floatRef, children }: SelectableProps) {
  const setFloatRoot = useAuraWorldSelection((s) => s.setFloatRoot);
  const selectedId = useAuraWorldSelection((s) => s.selectedId);
  const hoveredId = useAuraWorldSelection((s) => s.hoveredId);
  const contentRef = useRef<THREE.Group>(null);
  const hoverLift = useRef(0);
  const hoverScale = useRef(1);
  const selScaleRef = useRef(1);

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

  const isHovered = hoveredId === id;
  const isSelected = selectedId === id;

  useFrame((_, dt) => {
    const hGoal = isHovered ? 0.055 : 0;
    hoverLift.current += (hGoal - hoverLift.current) * (1 - Math.pow(0.0015, dt * 60));
    const sGoal = isHovered ? 1.02 : 1;
    hoverScale.current += (sGoal - hoverScale.current) * (1 - Math.pow(0.0015, dt * 60));
    const selGoal = isSelected ? 1.065 : 1;
    selScaleRef.current += (selGoal - selScaleRef.current) * (1 - Math.pow(0.0018, dt * 60));

    if (contentRef.current) {
      contentRef.current.position.y = hoverLift.current;
      const hs = hoverScale.current * selScaleRef.current;
      if (Number.isFinite(hs) && hs > 0.01 && hs < 80) {
        contentRef.current.scale.setScalar(hs);
      }
    }
  });

  const onHitOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
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
    const cur = useAuraWorldSelection.getState().selectedId;
    const next = cur === id ? null : id;
    useAuraWorldSelection.getState().setSelected(next);
    if (next === id) playAuraWorldSelectSound();
  };

  return (
    <group
      ref={contentRef}
      onPointerOver={onHitOver}
      onPointerOut={onHitOut}
      onClick={onHitClick}
    >
      {children}
    </group>
  );
}
