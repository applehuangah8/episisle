import type { AuraIslandId } from "./auraWorldIslandTypes";
import { AURA_ISLAND_DEFAULT_NAMES } from "./auraWorldIslandTypes";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

export type AuraIslandUiStatus = "floating" | "settled";

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
 * Islands the player has claimed via naming (or renamed later): plate shows `settled`.
 * Source: `worldMetaById[id].settlementStatus` (persisted with name) and legacy `namingGateDoneByWorldId`.
 */
export function getAuraIslandUiStatus(id: AuraIslandId): AuraIslandUiStatus {
  const s = useAuraWorldSelection.getState();
  const row = s.worldMetaById[id];
  if (row?.settlementStatus === "settled") return "settled";
  if (row?.settlementStatus === "floating") return "floating";
  if (s.namingGateDoneByWorldId[id] === true) return "settled";
  if (row && !row.isDefaultName) return "settled";
  return "floating";
}

/**
 * Suffix after the `settled` status line on the archipelago hover plate:
 * last immersive layer chosen (from persisted `lastInWorldMode`).
 */
export function getAuraIslandSettledModeSuffix(id: AuraIslandId): string {
  if (getAuraIslandUiStatus(id) !== "settled") return "";
  const last = useAuraWorldSelection.getState().worldMetaById[id]?.lastInWorldMode;
  if (last === "focus") return " 📓 F";
  if (last === "aura") return " 🪽 A";
  return "";
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
