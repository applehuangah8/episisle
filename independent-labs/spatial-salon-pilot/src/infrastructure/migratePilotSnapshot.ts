import { PILOT_SCHEMA_VERSION, type PilotPersistedSnapshot } from "../application/pilotRepository";
import type { PilotState } from "../domain/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPilotState(value: unknown): value is PilotState {
  if (!isRecord(value)) return false;
  if (typeof value.currentProjectId !== "string") return false;
  if (!isRecord(value.projects)) return false;
  if (!isRecord(value.worlds)) return false;
  if (!isRecord(value.wakeNotes)) return false;
  if (!Array.isArray(value.drops)) return false;
  if (!value.projects[value.currentProjectId]) return false;
  return true;
}

export function migrateUnknownToSnapshot(raw: unknown): PilotPersistedSnapshot | null {
  if (!isRecord(raw)) return null;

  const version = raw["schemaVersion"];
  /* v2 → v3: same state envelope; missing `particles` filled in normalizePilotState */
  if (version === PILOT_SCHEMA_VERSION || version === 2) {
    const st = raw["state"];
    const ev = raw["events"];
    if (!isPilotState(st)) return null;
    if (!Array.isArray(ev)) return null;
    return {
      schemaVersion: PILOT_SCHEMA_VERSION,
      state: st,
      events: ev as PilotPersistedSnapshot["events"],
    };
  }

  if (isPilotState(raw)) {
    return {
      schemaVersion: PILOT_SCHEMA_VERSION,
      state: raw,
      events: [],
    };
  }

  return null;
}
