export type AuraIslandId = "harbor" | "anchor" | "citadel";

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
