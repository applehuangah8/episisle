import type { ArtifactFinish } from "../../domain/types";

export type FinishRecipe = {
  /** extra dispersion / rainbow-y glare strength */
  prismOpacity: number;
  /** soft specular highlight strength */
  sheenOpacity: number;
  /** rim highlight strength */
  rimOpacity: number;
  /** tinted volume strength (how much tint reads “inside” material) */
  tintOpacity: number;
  /** frosted diffusion blur (0 = none) */
  fogBlur: number;
  /** metal contrast boost (used by brass-like artifacts) */
  metalBoost: number;
  /** caustic / inner light strength (glass-like artifacts) */
  causticOpacity: number;
};

export function getFinishRecipe(finish: ArtifactFinish | undefined): FinishRecipe {
  switch (finish) {
    case "silk":
      // Ribbon-like anisotropic sheen: strong highlight sweep, not glassy prism.
      return {
        prismOpacity: 0.12,
        sheenOpacity: 0.78,
        rimOpacity: 0.44,
        tintOpacity: 0.3,
        fogBlur: 0,
        metalBoost: 0,
        causticOpacity: 0.14,
      };
    case "brass":
      return {
        prismOpacity: 0.22,
        sheenOpacity: 0.48,
        rimOpacity: 0.75,
        tintOpacity: 0.18,
        fogBlur: 0,
        metalBoost: 1,
        causticOpacity: 0.18,
      };
    case "frost":
      return {
        prismOpacity: 0.18,
        sheenOpacity: 0.42,
        rimOpacity: 0.5,
        tintOpacity: 0.24,
        fogBlur: 1.35,
        metalBoost: 0,
        causticOpacity: 0.22,
      };
    case "crystal":
      return {
        prismOpacity: 0.64,
        sheenOpacity: 0.62,
        rimOpacity: 0.66,
        tintOpacity: 0.42,
        fogBlur: 0,
        metalBoost: 0,
        causticOpacity: 0.36,
      };
    case "sea-glass":
      return {
        prismOpacity: 0.52,
        sheenOpacity: 0.58,
        rimOpacity: 0.58,
        tintOpacity: 0.48,
        fogBlur: 0.2,
        metalBoost: 0,
        causticOpacity: 0.34,
      };
    case "opal":
    default:
      return {
        prismOpacity: 0.38,
        sheenOpacity: 0.54,
        rimOpacity: 0.52,
        tintOpacity: 0.34,
        fogBlur: 0,
        metalBoost: 0,
        causticOpacity: 0.28,
      };
  }
}

