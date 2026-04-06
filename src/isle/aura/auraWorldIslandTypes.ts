export type AuraIslandId = "harbor" | "anchor" | "citadel";

/** Canonical seed names before the player names a world. */
export const AURA_ISLAND_DEFAULT_NAMES: Record<AuraIslandId, string> = {
  harbor: "Isle Aube",
  anchor: "Isle Brume",
  citadel: "Isle Ciel",
};

export type AuraIslandDef = {
  id: AuraIslandId;
  /** Stable archipelago placement (matches IslandFloat x,y,z) */
  position: [number, number, number];
  float: { speed: number; phase: number; amplitude: number };
};

export const AURA_WORLD_ISLANDS: AuraIslandDef[] = [
  {
    id: "harbor",
    position: [-5.05, 0.04, 4.45],
    float: { speed: 0.42, phase: 0.65, amplitude: 0.032 },
  },
  {
    id: "anchor",
    position: [3.15, 0, -0.55],
    float: { speed: 0.34, phase: 2.4, amplitude: 0.034 },
  },
  {
    id: "citadel",
    position: [6.45, 0.52, -5.85],
    float: { speed: 0.88, phase: 3.9, amplitude: 0.038 },
  },
];

export function auraIslandById(id: AuraIslandId): AuraIslandDef {
  const d = AURA_WORLD_ISLANDS.find((i) => i.id === id);
  if (!d) throw new Error(`Unknown island: ${id}`);
  return d;
}

/** Cinematic “enter world” — duration ms (slow ease). */
export const AURA_WORLD_ENTER_DURATION_MS = 2750;

/** Orthographic zoom at end of enter (slightly closer than archipelago roam). */
export const AURA_WORLD_ENTER_END_ZOOM = 53.2;

/**
 * Look-at offset from island float root (world axes): raise tall landmarks / great tree
 * for a more majestic framing than island geometric center.
 */
export const AURA_WORLD_ENTER_LOOK_OFFSET: Record<AuraIslandId, [number, number, number]> = {
  harbor: [0.35, 1.12, 0.2],
  anchor: [-0.15, 0.92, 0.08],
  citadel: [0.12, 1.42, -0.12],
};

/** Camera pull distance from look target along view dir (orthographic — stays readable). */
export const AURA_WORLD_ENTER_CAMERA_PULL = 10.35;

export function auraIslandIdFromWorldSlug(slug: string): AuraIslandId | null {
  if (slug === "lagoon") return "harbor";
  if (slug === "anchor" || slug === "citadel") return slug;
  return null;
}

export function worldSlugFromAuraIslandId(id: AuraIslandId): string {
  if (id === "harbor") return "lagoon";
  return id;
}
