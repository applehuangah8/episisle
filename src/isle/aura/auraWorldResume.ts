import type { AuraWorldMeta } from "./auraWorldIdentity";

const IDENTITY_LS_KEY = "epis-aura-world-identity-v1";

type IdentityBlob = {
  state?: {
    worldMetaById?: Partial<Record<string, AuraWorldMeta>>;
    namingGateDoneByWorldId?: Partial<Record<string, boolean>>;
  };
};

/**
 * Read identity slice from localStorage (Zustand persist) before in-memory rehydrate completes,
 * so resume logic sees `lastInWorldMode` and naming flags on re-entry.
 */
export function readPersistedAuraIdentityFromStorage(): {
  worldMetaById: Partial<Record<string, AuraWorldMeta>>;
  namingGateDoneByWorldId: Partial<Record<string, boolean>>;
} | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(IDENTITY_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IdentityBlob;
    const st = parsed.state;
    if (!st) return null;
    return {
      worldMetaById: st.worldMetaById ?? {},
      namingGateDoneByWorldId: st.namingGateDoneByWorldId ?? {},
    };
  } catch {
    return null;
  }
}

/** When meta has no `lastInWorldMode`, use per-world Focus snapshot presence as a hint. */
function inferLastInWorldModeFromFocusStorage(worldId: string): "aura" | "focus" {
  if (typeof localStorage === "undefined") return "aura";
  try {
    const raw = localStorage.getItem(`epis-isle-world-${worldId}`);
    if (raw == null || raw.trim() === "") return "aura";
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null) return "aura";
    if (typeof parsed === "object") {
      const p = parsed as Record<string, unknown>;
      if ("state" in p && p.state != null && typeof p.state === "object") {
        return Object.keys(p.state as object).length > 0 ? "focus" : "aura";
      }
      if (!("state" in p) && Object.keys(p).length > 0) return "focus";
    }
    return "aura";
  } catch {
    return "aura";
  }
}

/**
 * Same notion of “settled” as {@link getAuraIslandUiStatus} (floating vs settled labels):
 * uses settlementStatus, naming gate, or custom name — all read from persisted `worldMetaById`.
 */
export function computeWorldEntryResume(
  worldId: string,
  worldMetaById: Partial<Record<string, AuraWorldMeta>>,
  namingGateDoneByWorldId: Partial<Record<string, boolean>>,
): {
  skipModePick: boolean;
  lastInWorldMode: "aura" | "focus" | null;
  /** Merge into `worldMetaById[worldId]` so the choice persists (legacy / inference). */
  persistLastInWorldMode?: "aura" | "focus";
} {
  const row = worldMetaById[worldId];
  const settled =
    row?.settlementStatus === "settled" ||
    namingGateDoneByWorldId[worldId] === true ||
    (row != null && !row.isDefaultName);

  let last = row?.lastInWorldMode ?? null;
  let persistLastInWorldMode: "aura" | "focus" | undefined;
  if (settled && last === null) {
    last = inferLastInWorldModeFromFocusStorage(worldId);
    persistLastInWorldMode = last;
  }

  const skipModePick =
    settled && last !== null && (last === "aura" || last === "focus");

  return { skipModePick, lastInWorldMode: last, persistLastInWorldMode };
}
