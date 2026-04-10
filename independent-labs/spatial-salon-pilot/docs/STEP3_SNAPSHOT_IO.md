# Step 3 — Export / Import JSON Snapshot

## Purpose

- **Backup** before clearing browser data.
- **Move** pilot data between machines without touching the main app.
- **Future integration**: neutral interchange format if this lab merges elsewhere.

## File format

Exported files are JSON with a small envelope:

- `kind`: `"spatial-salon-pilot-snapshot"`
- `exportedAt`: ISO-8601 timestamp
- `schemaVersion`: `2` (must match pilot schema)
- `state`: full `PilotState` (includes drops with full text)
- `events`: event log array

**Import** also accepts:

- legacy raw `PilotState` JSON (no envelope), same as older localStorage payloads
- v2 `{ schemaVersion, state, events }` blobs

Parsing runs through `parseSnapshotJson` → `migrateUnknownToSnapshot` for validation.

## UI

- **Export JSON**: downloads `spatial-salon-pilot-snapshot-<timestamp>.json`.
- **Import JSON…**: replaces in-memory runtime and persists to `localStorage`; appends `snapshot.imported` event.

## Safety notes

- Import **replaces** the current session immediately.
- Invalid files show an error banner; nothing is partially applied.
