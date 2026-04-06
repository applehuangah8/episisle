import type { AuraIslandId } from "./auraWorldIslandTypes";
import { AURA_ISLAND_DEFAULT_NAMES } from "./auraWorldIslandTypes";

export type AuraWorldMeta = {
  name: string;
  isDefaultName: boolean;
};

/** Single-world shape (id included for clarity). */
export type AuraWorldMetaWithId = AuraWorldMeta & { id: string };

const POETIC_A = [
  "Verdant",
  "Ivory",
  "Mint",
  "Pale",
  "Lucent",
  "Hushed",
  "Gilded",
  "Soft",
  "Drift",
  "Ember",
] as const;

const POETIC_B = [
  "Breath",
  "Stillness",
  "Horizon",
  "Haven",
  "Lull",
  "Shoal",
  "Hush",
  "Fold",
  "Grove",
  "Loom",
] as const;

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seedDefaultWorldMeta(id: AuraIslandId): AuraWorldMeta {
  return {
    name: AURA_ISLAND_DEFAULT_NAMES[id],
    isDefaultName: true,
  };
}

const POETIC_CN = ["霧光小泊", "靜隅", "青川之上", "聽風的島", "淺春島語", "眠雲一隅"] as const;

/** Two English + one Chinese suggestion; uses island id + salt for variety. */
export function generatePoeticWorldNames(worldId: string, salt: number): string[] {
  const base = hash32(`${worldId}:${salt}:${Date.now()}`);
  const used = new Set<string>();
  const out: string[] = [];

  const h0 = hash32(`${worldId}:${salt}:0:${base}`);
  const cn = POETIC_CN[h0 % POETIC_CN.length];
  out.push(cn);
  used.add(cn);

  for (let k = 1; k < 20 && out.length < 3; k++) {
    const h = hash32(`${worldId}:${salt}:${k}:${base}`);
    const a = POETIC_A[h % POETIC_A.length];
    const b = POETIC_B[(h >>> 8) % POETIC_B.length];
    const pair = `${a} ${b}`;
    if (!used.has(pair)) {
      used.add(pair);
      out.push(pair);
    }
  }
  while (out.length < 3) out.push("Soft Horizon");
  return out;
}

export function normalizeMetaName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 64);
}

export function isValidAuraWorldId(id: string): id is AuraIslandId {
  return id === "harbor" || id === "anchor" || id === "citadel";
}
