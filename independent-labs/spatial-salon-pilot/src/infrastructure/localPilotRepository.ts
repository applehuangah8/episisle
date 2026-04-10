import {
  PILOT_SCHEMA_VERSION,
  type PilotPersistedSnapshot,
  type PilotRepository,
} from "../application/pilotRepository";
import type { PilotEvent } from "../domain/types";
import { migrateUnknownToSnapshot } from "./migratePilotSnapshot";

const STORAGE_KEY_V2 = "spatial-salon-pilot-v2";
const LEGACY_KEY_V1 = "spatial-salon-pilot-v1";
const MAX_EVENTS = 200;

function capEvents(events: PilotEvent[]): PilotEvent[] {
  if (events.length <= MAX_EVENTS) return events;
  return events.slice(events.length - MAX_EVENTS);
}

export function createLocalPilotRepository(): PilotRepository {
  return {
    load(): PilotPersistedSnapshot | null {
      if (typeof window === "undefined") return null;
      try {
        const rawV2 = window.localStorage.getItem(STORAGE_KEY_V2);
        if (rawV2) {
          const parsed = JSON.parse(rawV2) as unknown;
          return migrateUnknownToSnapshot(parsed);
        }

        const rawLegacy = window.localStorage.getItem(LEGACY_KEY_V1);
        if (rawLegacy) {
          const parsed = JSON.parse(rawLegacy) as unknown;
          const migrated = migrateUnknownToSnapshot(parsed);
          if (migrated) {
            try {
              window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
              window.localStorage.removeItem(LEGACY_KEY_V1);
            } catch {
              // keep legacy if write fails
            }
          }
          return migrated;
        }
      } catch {
        return null;
      }
      return null;
    },

    save(snapshot: PilotPersistedSnapshot): void {
      if (typeof window === "undefined") return;
      const toWrite: PilotPersistedSnapshot = {
        schemaVersion: PILOT_SCHEMA_VERSION,
        state: snapshot.state,
        events: capEvents(snapshot.events),
      };
      try {
        window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(toWrite));
      } catch {
        // Quota or privacy mode
      }
    },

    clear(): void {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(STORAGE_KEY_V2);
      window.localStorage.removeItem(LEGACY_KEY_V1);
    },
  };
}
