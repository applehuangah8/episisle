import type { PilotState, Project, SalonParticle, StudioArtifact, SurfaceKind } from "./types";

/** Curated studio objects — each maps to shelf + hero SVG language. */
export const STUDIO_ARTIFACTS: {
  id: StudioArtifact;
  title: string;
  objectName: string;
  blurb: string;
}[] = [
  {
    id: "sea-glass",
    title: "海玻璃糖塔",
    objectName: "清透 · 呼吸",
    blurb: "如海水凝住的弧面，適合氛圍與情緒的片斷。",
  },
  {
    id: "fluted-column",
    title: "凹槽柱礎",
    objectName: "秩序 · 序列",
    blurb: "垂直節奏，適合清楚的步驟與時間軸。",
  },
  {
    id: "frosted-pyramid",
    title: "霧面金字塔",
    objectName: "理性 · 轉折",
    blurb: "霧面切面，適合需要收斂的決策與選項。",
  },
  {
    id: "brass-orrery",
    title: "黃銅天象儀",
    objectName: "軌道 · 並行",
    blurb: "多重圓環，適合同時推進的計畫與分支。",
  },
  {
    id: "glass-cloche",
    title: "玻璃罩",
    objectName: "封存 · 細膩",
    blurb: "安靜的罩子，適合需要被小心擺放的想法。",
  },
];

/** Surfaces — how a clutter note *feels* when set down (not literal clip-art). */
export const SURFACE_KINDS: {
  id: SurfaceKind;
  label: string;
  hint: string;
}[] = [
  { id: "atelier-sketch", label: "畫室素描", hint: "炭筆與淡墨的筆觸" },
  { id: "frosted-plaque", label: "霧白紙膜", hint: "柔霧纖維的淡透層次" },
  { id: "etching-parchment", label: "朱伊古紙", hint: "法式蝕刻 · 朱伊紋樣的古典紙" },
  { id: "silk-ribbon", label: "絲緞緞帶", hint: "流動反光的絲緞 ribbon" },
  { id: "bouquet-spray", label: "花束（藍白）", hint: "馬蹄蓮與淡藍花束的冷霧香氣" },
];

const LEGACY_ID_ARTIFACT: Record<string, StudioArtifact> = {
  "project-a": "sea-glass",
  "project-b": "fluted-column",
  "project-c": "frosted-pyramid",
  "project-e": "brass-orrery",
};

export function inferStudioArtifact(projectId: string, p: Project): StudioArtifact {
  if (p.studioArtifact) return p.studioArtifact;
  return LEGACY_ID_ARTIFACT[projectId] ?? "glass-cloche";
}

export function normalizeProject(project: Project, projectId: string): Project {
  const knownSurfaces = new Set<SurfaceKind>(SURFACE_KINDS.map((s) => s.id));
  const defaultSurface =
    project.defaultSurface && knownSurfaces.has(project.defaultSurface) ? project.defaultSurface : "frosted-plaque";
  return {
    ...project,
    studioArtifact: inferStudioArtifact(projectId, project),
    defaultSurface,
    subtitle: project.subtitle?.trim() || undefined,
    status: project.status?.trim() || undefined,
    objectName: project.objectName?.trim() || undefined,
  };
}

/** Next surface in curated catalog (for ink-well / atelier gesture). */
export function nextSurfaceKind(current: SurfaceKind): SurfaceKind {
  const i = SURFACE_KINDS.findIndex((s) => s.id === current);
  const n = SURFACE_KINDS.length;
  return SURFACE_KINDS[((i < 0 ? 0 : i) + 1) % n].id;
}

export function normalizePilotState(state: PilotState): PilotState {
  const projects: PilotState["projects"] = {};
  for (const id of Object.keys(state.projects)) {
    projects[id] = normalizeProject(state.projects[id], id);
  }
  const knownSurfaces = new Set<SurfaceKind>(SURFACE_KINDS.map((s) => s.id));
  const drops = state.drops.map((d) => ({
    ...d,
    surfaceKind: d.surfaceKind && knownSurfaces.has(d.surfaceKind) ? d.surfaceKind : "frosted-plaque",
    surfaceTint: d.surfaceTint,
    surfaceVariant: d.surfaceVariant,
  }));

  const rawParticles = Array.isArray(state.particles) ? state.particles : [];
  const particles: SalonParticle[] = rawParticles
    .filter((p) => p && typeof p.id === "string" && typeof p.elementId === "string")
    .map((p) => ({
      id: p.id,
      elementId: p.elementId,
      color: typeof p.color === "string" && p.color ? p.color : "#c4a8d8",
      position: Array.isArray(p.position) && p.position.length >= 3
        ? [Number(p.position[0]) || 0, Number(p.position[1]) || 0, Number(p.position[2]) || 0]
        : [0, 0, 0],
      linkedDropIds: Array.isArray(p.linkedDropIds) ? p.linkedDropIds.filter((x): x is string => typeof x === "string") : [],
      createdAt: typeof p.createdAt === "number" ? p.createdAt : Date.now(),
    }));

  const selectedParticleId =
    state.selectedParticleId === undefined
      ? null
      : typeof state.selectedParticleId === "string" || state.selectedParticleId === null
        ? state.selectedParticleId
        : null;

  return { ...state, projects, drops, particles, selectedParticleId };
}
