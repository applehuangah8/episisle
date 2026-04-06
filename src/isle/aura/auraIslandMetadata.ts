import type { AuraIslandId } from "./auraWorldIslandTypes";

/** Canonical English names (bracketed in UI when no user override). */
export const AURA_ISLAND_DEFAULT_NAMES: Record<AuraIslandId, string> = {
  harbor: "Isle Aube",
  anchor: "Isle Brume",
  citadel: "Isle Ciel",
};

export type AuraIslandUiStatus = "floating" | "exploring";

/**
 * User-defined display name for an island slot (e.g. from save metadata).
 * Return null / empty → UI uses {@link AURA_ISLAND_DEFAULT_NAMES}.
 */
export function getAuraIslandCustomName(_id: AuraIslandId): string | null {
  // TODO: read from save / profile store when persistence exists
  return null;
}

/**
 * Whether the player has an active save / session on this island.
 * `exploring` → overlay shows `status: exploring`; else `status: floating` (lowercase in UI).
 */
export function getAuraIslandHasSave(_id: AuraIslandId): boolean {
  // TODO: wire to save slot or island visit state
  return false;
}

export function getAuraIslandUiStatus(id: AuraIslandId): AuraIslandUiStatus {
  return getAuraIslandHasSave(id) ? "exploring" : "floating";
}

export function getAuraIslandTitleLine(id: AuraIslandId): string {
  const custom = getAuraIslandCustomName(id)?.trim();
  if (custom) return custom;
  return `[${AURA_ISLAND_DEFAULT_NAMES[id]}]`;
}

/** Uppercase plate line after the sparkle icon (no numeric prefix). */
export function getAuraIslandPlateNameUpper(id: AuraIslandId): string {
  const custom = getAuraIslandCustomName(id)?.trim();
  if (custom) return custom.toUpperCase();
  return AURA_ISLAND_DEFAULT_NAMES[id].toUpperCase();
}

/** Stable pick between two deep blues per island (no flicker on re-render). */
export function getAuraIslandStatusAccentColor(id: AuraIslandId): string {
  const pick = (id + "salt").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return pick % 2 === 0 ? "#153B78" : "#15425F";
}
