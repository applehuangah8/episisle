import { PILOT_SCHEMA_VERSION, type PilotPersistedSnapshot } from "./pilotRepository";
import { migrateUnknownToSnapshot } from "../infrastructure/migratePilotSnapshot";

export const SNAPSHOT_FILE_KIND = "spatial-salon-pilot-snapshot" as const;

export type PilotSnapshotFileV1 = {
  kind: typeof SNAPSHOT_FILE_KIND;
  exportedAt: string;
  schemaVersion: typeof PILOT_SCHEMA_VERSION;
  state: PilotPersistedSnapshot["state"];
  events: PilotPersistedSnapshot["events"];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** File envelope for backup / machine transfer; inner payload matches persisted snapshot. */
export function buildExportFile(snapshot: PilotPersistedSnapshot): PilotSnapshotFileV1 {
  return {
    kind: SNAPSHOT_FILE_KIND,
    exportedAt: new Date().toISOString(),
    schemaVersion: snapshot.schemaVersion,
    state: snapshot.state,
    events: snapshot.events,
  };
}

function unwrapFileEnvelope(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  if (raw.kind !== SNAPSHOT_FILE_KIND) return raw;
  const v = raw.schemaVersion;
  if (v !== PILOT_SCHEMA_VERSION && v !== 2) return raw;
  return {
    schemaVersion: raw.schemaVersion,
    state: raw.state,
    events: raw.events,
  };
}

export type ParseSnapshotResult =
  | { ok: true; snapshot: PilotPersistedSnapshot }
  | { ok: false; error: string };

export function parseSnapshotJson(text: string): ParseSnapshotResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: "Invalid JSON." };
  }

  if (isRecord(parsed) && parsed.kind === SNAPSHOT_FILE_KIND) {
    const sv = parsed.schemaVersion;
    if (sv !== PILOT_SCHEMA_VERSION && sv !== 2) {
      return { ok: false, error: `Unsupported export schemaVersion: ${String(parsed.schemaVersion)}` };
    }
  }

  const normalized = unwrapFileEnvelope(parsed);
  const snapshot = migrateUnknownToSnapshot(normalized);
  if (!snapshot) {
    return { ok: false, error: "Snapshot failed validation; unknown or corrupted shape." };
  }
  return { ok: true, snapshot };
}

export function snapshotToPrettyJson(snapshot: PilotPersistedSnapshot): string {
  return JSON.stringify(buildExportFile(snapshot), null, 2);
}

export function downloadSnapshotFile(snapshot: PilotPersistedSnapshot): void {
  if (typeof document === "undefined") return;
  const json = snapshotToPrettyJson(snapshot);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().replace(/[:]/g, "-").slice(0, 19);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spatial-salon-pilot-snapshot-${stamp}.json`;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}
