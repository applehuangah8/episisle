import type { PilotState } from "../domain/types";
import { createWakeId, resolveWakeKey } from "../domain/services";

const now = Date.now();

export const pilotSeed: PilotState = {
  currentProjectId: "project-e",
  projects: {
    "project-a": {
      id: "project-a",
      name: "海玻璃糖塔",
      subtitle: "潮間帶筆記",
      status: "暫緩中",
      ambientState: "warm",
      worldIds: [],
      activeWorldId: null,
      studioArtifact: "sea-glass",
      defaultSurface: "frosted-plaque",
    },
    "project-b": {
      id: "project-b",
      name: "凹槽柱礎",
      subtitle: "步驟與序列",
      ambientState: "warm",
      worldIds: [],
      activeWorldId: null,
      studioArtifact: "fluted-column",
      defaultSurface: "frosted-plaque",
    },
    "project-c": {
      id: "project-c",
      name: "霧面金字塔",
      subtitle: "收斂中的選項",
      ambientState: "warm",
      worldIds: [],
      activeWorldId: null,
      studioArtifact: "frosted-pyramid",
      defaultSurface: "frosted-plaque",
    },
    "project-e": {
      id: "project-e",
      name: "黃銅天象儀",
      subtitle: "多線並進實驗",
      status: "進行中",
      ambientState: "glow",
      worldIds: ["world-oceanus", "world-arid", "world-crystal"],
      activeWorldId: "world-arid",
      studioArtifact: "brass-orrery",
      defaultSurface: "atelier-sketch",
    },
  },
  worlds: {
    "world-oceanus": {
      id: "world-oceanus",
      projectId: "project-e",
      name: "World 1",
      symbol: "Oceanus",
      tone: "Pearl blue",
      statusLine: "Entry mood exploration",
      toolCharms: [
        { id: "tool-gemini", tool: "Gemini", activity: "Active" },
        { id: "tool-mj", tool: "Midjourney", activity: "Dormant" },
      ],
    },
    "world-arid": {
      id: "world-arid",
      projectId: "project-e",
      name: "World 2",
      symbol: "Arid Lands",
      tone: "Sage amber",
      statusLine: "Vegetation rule debugging",
      toolCharms: [
        { id: "tool-cursor", tool: "Cursor", activity: "Active" },
        { id: "tool-claude", tool: "Claude", activity: "Active" },
      ],
    },
    "world-crystal": {
      id: "world-crystal",
      projectId: "project-e",
      name: "World 3",
      symbol: "Crystal Caves",
      tone: "Smoke violet",
      statusLine: "Procedural cave pacing",
      toolCharms: [{ id: "tool-claude-c", tool: "Claude", activity: "Dormant" }],
    },
  },
  wakeNotes: {
    [resolveWakeKey("project-e", "world-arid")]: {
      id: createWakeId("project-e", "world-arid"),
      projectId: "project-e",
      worldId: "world-arid",
      lastTouch: "Vegetation growth trigger is still unstable after login refresh.",
      nextMotion: "Verify trigger order between hydration and world seed callbacks.",
      lastSurfaceKind: "atelier-sketch",
      updatedAt: now,
    },
  },
  drops: [
    {
      id: "drop_seed_1",
      projectId: "project-e",
      worldId: "world-arid",
      zone: "Pocket",
      mode: "RawPour",
      content:
        "Need to compare world 2 light rendering and vegetation state sync. Might be hydration timing.",
      createdAt: now - 1000 * 60 * 60,
      surfaceKind: "atelier-sketch",
    },
    {
      id: "drop_seed_2",
      projectId: "project-e",
      worldId: "world-crystal",
      zone: "Spark",
      mode: "QuickDrop",
      content: "Prototype crystal resonance path for new traversal hint.",
      createdAt: now - 1000 * 60 * 30,
      surfaceKind: "frosted-plaque",
    },
  ],
  particles: [],
  selectedParticleId: null,
};
