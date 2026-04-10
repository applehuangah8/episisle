# Architecture Baseline



## Technical Director Decisions



1. Keep this prototype fully isolated from the current production tree.

2. Use layered architecture to reduce future change risk.

3. Preserve raw user input as source of truth.

4. Keep UI dependency-light for fast iterations.

5. Persist through a `PilotRepository` port; infrastructure swaps without touching UI.



## Layers



## Domain



- Owns business language only: `Project`, `World`, `DropItem`, `WakeNote`, `PilotEvent`.

- No React imports, no browser APIs.

- Provides deterministic policies:

  - wake note fallback

  - scope key generation

  - drop zone normalization



## Application



- Coordinates state transitions and use-cases.

- Depends on `PilotRepository` for load / save / clear.

- Persists `PilotPersistedSnapshot`: `schemaVersion`, `state`, `events`.

- `snapshotExchange.ts`: validated JSON import/export (`kind: spatial-salon-pilot-snapshot`).

- Current use-cases:

  - `switchProject` (appends `project.switched`)

  - `switchWorld` (appends `world.switched`)

  - `dropNow` (appends `drop.created`; never stores full text on the event)

  - `deriveWakeNote`

  - `resetPilot` (appends `pilot.reset`; then seed state)



## Infrastructure



- `localPilotRepository.ts`: `localStorage` implementation.

- `migratePilotSnapshot.ts`: maps legacy raw `PilotState` blobs and current schema to `PilotPersistedSnapshot`.

- Storage keys: `spatial-salon-pilot-v2` (current); `spatial-salon-pilot-v1` (legacy, migrated once then removed).



## UI



- Pure rendering and event wiring.

- No hidden write side-effects beyond calling hooks.

- Can be replaced by another visual system without rewriting domain rules.



## Extension Path (Low-Risk)



When step-1 is validated, extend in this order:



1. Add schema v3 migration when fields grow (keep migrate module central).

2. Add auto-summary pipeline as optional post-process, never overwrite raw input.

3. Add richer world metadata and tool charm activity history.

4. Add adapter layer for future integration into existing app shell.


