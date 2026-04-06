import { useFrame } from "@react-three/fiber";
import {
  forwardRef,
  useCallback,
  useRef,
  type ForwardedRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import * as THREE from "three";

export type AuraIslandFloatProps = {
  x: number;
  y: number;
  z: number;
  speed: number;
  phase: number;
  amplitude: number;
  children: ReactNode;
};

function assignForwardedRef(ref: ForwardedRef<THREE.Group> | undefined, node: THREE.Group | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(node);
  else (ref as MutableRefObject<THREE.Group | null>).current = node;
}

/**
 * Archipelago island root — sin(Y) drift; ref = this group (for camera / hover projection).
 *
 * Important: do not use `useImperativeHandle(() => innerRef.current!, [])` — on first layout
 * `innerRef` is often still null, so the parent ref stays null forever and floatRoots never register.
 */
export const IslandFloat = forwardRef<THREE.Group, AuraIslandFloatProps>(function IslandFloat(
  { x, y, z, speed, phase, amplitude, children },
  forwardedRef,
) {
  const innerRef = useRef<THREE.Group | null>(null);
  const setRef = useCallback(
    (node: THREE.Group | null) => {
      innerRef.current = node;
      assignForwardedRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  useFrame(({ clock }) => {
    const g = innerRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.position.x = x;
    g.position.z = z;
    g.position.y = y + Math.sin(t * speed + phase) * amplitude;
  });

  return (
    <group ref={setRef} position={[x, y, z]}>
      {children}
    </group>
  );
});
