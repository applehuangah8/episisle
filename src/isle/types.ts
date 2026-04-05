/**
 * Experience orchestrator (multi-layer shell). Does not change Focus `App` internals.
 *
 * Layer 1 — Entry Path: choose how to enter (not picking a project / World).
 * Layer 2 — Aura World: spatial 3D diorama (future: pick a World).
 * Layer 3 — World: data unit; view modes focusView / auraView live inside a World.
 */
export type AppMode = "entry" | "worldFocus" | "auraWorld";
