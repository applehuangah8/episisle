import type { PilotEvent, PilotState } from "../domain/types";

/** Bump when persisted shape changes; migrations live in infrastructure. */
export const PILOT_SCHEMA_VERSION = 3 as const;

export type PilotPersistedSnapshot = {
  schemaVersion: typeof PILOT_SCHEMA_VERSION;
  state: PilotState;
  events: PilotEvent[];
};

export type PilotRepository = {
  load(): PilotPersistedSnapshot | null;
  save(snapshot: PilotPersistedSnapshot): void;
  clear(): void;
};
