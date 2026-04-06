import type { AuraIslandId } from "./auraWorldIslandTypes";
import { AURA_ISLAND_DEFAULT_NAMES } from "./auraWorldIslandTypes";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

export type AuraIslandUiStatus = "floating" | "exploring";

/** Resolved label for Layer 2 UI / plates (includes persisted world name). */
export function getResolvedAuraIslandDisplayName(id: AuraIslandId): string {
  const row = useAuraWorldSelection.getState().worldMetaById[id];
  const n = row?.name?.trim();
  if (n) return n;
  return AURA_ISLAND_DEFAULT_NAMES[id];
}

/**
 * @deprecated Prefer {@link getResolvedAuraIslandDisplayName}.
 */
export function getAuraIslandCustomName(id: AuraIslandId): string | null {
  const row = useAuraWorldSelection.getState().worldMetaById[id];
  const n = row?.name?.trim();
  return n || null;
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
  return getResolvedAuraIslandDisplayName(id);
}

/** Uppercase plate line after the sparkle icon (no numeric prefix). */
export function getAuraIslandPlateNameUpper(id: AuraIslandId): string {
  return getResolvedAuraIslandDisplayName(id).toUpperCase();
}

/** Stable pick between two deep blues per island (no flicker on re-render). */
export function getAuraIslandStatusAccentColor(id: AuraIslandId): string {
  const pick = (id + "salt").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return pick % 2 === 0 ? "#153B78" : "#15425F";
}
