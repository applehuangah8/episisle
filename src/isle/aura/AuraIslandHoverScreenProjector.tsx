import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import { useAuraIslandHoverOverlay } from "./auraIslandHoverOverlayStore";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

/**
 * Projects the hovered island anchor into 2D CSS pixels for {@link AuraIslandHoverScreenOverlay}.
 * Local Y offset places the point above the island mass (reference: label sits over the isle).
 */
export function AuraIslandHoverScreenProjector() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const hoveredId = useAuraWorldSelection((s) => s.hoveredId);
  const floatRoots = useAuraWorldSelection((s) => s.floatRoots);
  const setAnchor = useAuraIslandHoverOverlay((s) => s.setAnchor);
  const world = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!hoveredId) {
      setAnchor(null);
      return;
    }
    const root = floatRoots[hoveredId];
    if (!root) {
      setAnchor(null);
      return;
    }
    /* Lift kept moderate so plates stay on-screen and read nearer the isle mass */
    world.set(0, 2.35, 0);
    root.localToWorld(world);
    world.project(camera);
    const x = (world.x * 0.5 + 0.5) * size.width;
    const y = (-world.y * 0.5 + 0.5) * size.height;
    setAnchor({ id: hoveredId, x, y });
  });

  return null;
}
