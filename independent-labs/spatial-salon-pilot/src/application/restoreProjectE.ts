import type { PilotState } from "../domain/types";
import { pilotSeed } from "./seed";

/**
 * If project-e was removed from persisted state, merge it back from seed
 * (project, its worlds, wake notes, and seed drops) so the brass-orrery demo stays available.
 */
export function ensureProjectEPresent(state: PilotState): PilotState {
  if (state.projects["project-e"]) return state;

  const project = structuredClone(pilotSeed.projects["project-e"]);
  const worlds: PilotState["worlds"] = { ...state.worlds };
  for (const wid of project.worldIds) {
    const w = pilotSeed.worlds[wid];
    if (w) worlds[wid] = structuredClone(w);
  }

  const wakeNotes = { ...state.wakeNotes };
  for (const [key, note] of Object.entries(pilotSeed.wakeNotes)) {
    if (note.projectId === "project-e") {
      wakeNotes[key] = structuredClone(note);
    }
  }

  const existingDropIds = new Set(state.drops.map((d) => d.id));
  const extraDrops = pilotSeed.drops
    .filter((d) => d.projectId === "project-e" && !existingDropIds.has(d.id))
    .map((d) => structuredClone(d));

  return {
    ...state,
    projects: { ...state.projects, "project-e": project },
    worlds,
    wakeNotes,
    drops: [...state.drops, ...extraDrops],
  };
}
