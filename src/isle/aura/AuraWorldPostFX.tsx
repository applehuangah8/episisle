import { EffectComposer, Noise } from "@react-three/postprocessing";
import { Suspense } from "react";

/**
 * Subtle analog film grain — pairs with airy sky-mist shell (#E4EEF8).
 */
export function AuraWorldPostFX() {
  return (
    <Suspense fallback={null}>
      <EffectComposer multisampling={0} renderPriority={1}>
        <Noise premultiply opacity={0.052} />
      </EffectComposer>
    </Suspense>
  );
}
