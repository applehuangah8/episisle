# Step 2 — Repository, Versioning, Event Log

## What shipped

1. **`PilotRepository`** (`src/application/pilotRepository.ts`): port for load / save / clear.
2. **`PilotPersistedSnapshot`**: `{ schemaVersion: 2, state, events }`.
3. **`localPilotRepository`**: `localStorage` backend, caps events at **200** entries (FIFO by truncation).
4. **Migration**: legacy `spatial-salon-pilot-v1` (raw `PilotState` JSON) → v2 snapshot on first load.
5. **Events**: `project.switched`, `world.switched`, `drop.created` (metadata only), `pilot.reset`.

## Why events omit content

Drop text stays in `state.drops` only. Events record `contentLength`, ids, scope — enough for audit and future sync without duplicating large blobs.

## Manual checks

1. Fresh load: perform a project switch → confirm **Recent events** lists `project.switched`.
2. Drop a RawPour → confirm `drop.created` shows length, zone, mode.
3. Refresh → events and state still present.
4. Optional: seed `localStorage` with old v1-only payload → reload → data in v2 key (legacy key removed after successful write).

## Next steps (not in this lab yet)

- IndexedDB backend implementing the same `PilotRepository`.
- Export / import snapshot JSON for backup.
- Optional event replay for debugging (dev-only).

