export type ZoneId = "Pocket" | "Thread" | "Mirror" | "Spark";
export type DropMode = "QuickDrop" | "RawPour";
export type AmbientState = "glow" | "warm" | "frozen" | "mist" | "bloom";

/** Shelf + hero centerpiece identity (curated object). */
export type StudioArtifact =
  | "sea-glass"
  | "fluted-column"
  | "frosted-pyramid"
  | "brass-orrery"
  | "glass-cloche";

/** Material finish applied to studio artifact + its tint. */
export type ArtifactFinish = "opal" | "silk" | "brass" | "frost" | "crystal" | "sea-glass";

/** Visual / material voice for a clutter note — chosen before pour. */
export type SurfaceKind =
  | "frosted-plaque"
  | "etching-parchment"
  | "silk-ribbon"
  | "time-capsule"
  | "atelier-sketch"
  | "bouquet-spray";
export type ToolType = "Cursor" | "Claude" | "Gemini" | "Midjourney";
export type ToolActivity = "Active" | "Dormant";

export type ToolCharm = {
  id: string;
  tool: ToolType;
  activity: ToolActivity;
};

export type World = {
  id: string;
  projectId: string;
  name: string;
  symbol: string;
  tone: string;
  statusLine: string;
  toolCharms: ToolCharm[];
};

export type Project = {
  id: string;
  name: string;
  /** Legacy catalog tagline; kept for old snapshots only — not shown in UI. */
  objectName?: string;
  /** User-defined line under the title (e.g. 穿搭宇宙). */
  subtitle?: string;
  /** User-defined status (e.g. 暫緩中); editable anytime. */
  status?: string;
  ambientState: AmbientState;
  worldIds: string[];
  activeWorldId: string | null;
  /** Curated studio object; inferred from legacy ids when missing. */
  studioArtifact?: StudioArtifact;
  /**
   * Optional accent tint for the project's centerpiece/shelf object.
   * Used to keep the object feeling "owned" by this salon even when worlds change.
   */
  artifactTint?: string;
  /** Material finish for the curated studio object (works with artifactTint). */
  artifactFinish?: ArtifactFinish;
  /** Default surface for new drops when entering this project. */
  defaultSurface?: SurfaceKind;
};

export type DropItem = {
  id: string;
  projectId: string;
  worldId: string | null;
  zone: ZoneId;
  mode: DropMode;
  content: string;
  createdAt: number;
  /** Surface voice at capture time; defaulted to frosted-plaque if absent in old data. */
  surfaceKind?: SurfaceKind;
  /** Optional surface dye (e.g. silk ribbon color). */
  surfaceTint?: string;
  /** Optional surface variant (e.g. bouquet palette). */
  surfaceVariant?: string;
  /** Text ink color chosen at capture time. */
  textColor?: string;
  /** Text style chosen at capture time. */
  textFont?: "etching" | "serif" | "script";
};

export type WakeNote = {
  id: string;
  projectId: string;
  worldId: string | null;
  lastTouch: string;
  nextMotion: string;
  updatedAt: number;
  /** Surface form of the latest drop — for schematic wake chip. */
  lastSurfaceKind?: SurfaceKind;
};

/**
 * One logical "element" scope for particles (same project + world).
 * `elementId` = `particleElementKey(projectId, worldId)` — groups particles for future filters.
 */
export type ParticleElementId = string;

/** Draggable silk sphere in the particle field; links to 字條 (drops) for classification. */
export type SalonParticle = {
  id: string;
  elementId: ParticleElementId;
  /** User-chosen tint; drives mesh color. */
  color: string;
  position: [number, number, number];
  /** Linked DropItem ids in this project/world (字條). */
  linkedDropIds: string[];
  createdAt: number;
};

export type PilotState = {
  projects: Record<string, Project>;
  worlds: Record<string, World>;
  wakeNotes: Record<string, WakeNote>;
  drops: DropItem[];
  currentProjectId: string;
  /** All particles (filter by `elementId` for current scope). */
  particles: SalonParticle[];
  /**
   * `null` = show union of all linked 字條 under the current element’s particles.
   * Set = show only that particle’s linked strips.
   */
  selectedParticleId: string | null;
};

/** Append-only audit trail; content is never duplicated on events. */
export type PilotEvent =
  | {
      type: "project.switched";
      at: number;
      fromProjectId: string;
      toProjectId: string;
    }
  | {
      type: "world.switched";
      at: number;
      projectId: string;
      fromWorldId: string | null;
      toWorldId: string;
    }
  | {
      type: "drop.created";
      at: number;
      dropId: string;
      projectId: string;
      worldId: string | null;
      zone: ZoneId;
      mode: DropMode;
      contentLength: number;
    }
  | {
      type: "drop.updated";
      at: number;
      dropId: string;
    }
  | {
      type: "drop.deleted";
      at: number;
      dropId: string;
    }
  | {
      type: "pilot.reset";
      at: number;
    }
  | {
      type: "snapshot.imported";
      at: number;
    }
  | {
      type: "project.created";
      at: number;
      projectId: string;
    }
  | {
      type: "project.deleted";
      at: number;
      projectId: string;
    };
