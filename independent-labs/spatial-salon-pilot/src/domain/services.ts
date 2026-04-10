import type { DropItem, PilotState, SurfaceKind, WakeNote, ZoneId } from "./types";

export function createDropId(): string {
  return `drop_${Math.random().toString(36).slice(2, 10)}`;
}

export function createParticleId(): string {
  return `part_${Math.random().toString(36).slice(2, 11)}`;
}

export function createProjectId(): string {
  return `project_${Math.random().toString(36).slice(2, 11)}`;
}

export function resolveWakeKey(projectId: string, worldId: string | null): string {
  return `${projectId}::${worldId ?? "project"}`;
}

export function createWakeId(projectId: string, worldId: string | null): string {
  return `wake_${projectId}_${worldId ?? "project"}`;
}

export function normalizeZonePreference(zone: ZoneId | null): ZoneId {
  return zone ?? "Pocket";
}

export function buildWakeFallback(
  drops: DropItem[],
  projectId: string,
  worldId: string | null
): Pick<WakeNote, "lastTouch" | "nextMotion" | "lastSurfaceKind"> {
  const scoped = drops.filter((item) => item.projectId === projectId && item.worldId === worldId);
  const latest = scoped[0];
  if (!latest) {
    return {
      lastTouch: "尚無紀錄。在托盤寫一行即可。",
      nextMotion: "下一步：落於 Pocket 區。",
      lastSurfaceKind: undefined,
    };
  }

  const compact = latest.content.trim().replace(/\s+/g, " ");
  const clipped = compact.length > 72 ? `${compact.slice(0, 69)}…` : compact;
  return {
    lastTouch: clipped,
    nextMotion: latest.mode === "RawPour" ? "可抽一句到 Thread。" : "推進為具體動作。",
    lastSurfaceKind: latest.surfaceKind ?? "frosted-plaque",
  };
}

export function deriveWakeNote(state: PilotState, projectId: string, worldId: string | null): WakeNote {
  const key = resolveWakeKey(projectId, worldId);
  const scoped = state.drops.filter((item) => item.projectId === projectId && item.worldId === worldId);
  const latest = scoped[0];
  const surfaceFromLatest: SurfaceKind | undefined = latest?.surfaceKind ?? "frosted-plaque";

  const saved = state.wakeNotes[key];
  if (saved) {
    if (saved.lastSurfaceKind == null && surfaceFromLatest) {
      return { ...saved, lastSurfaceKind: surfaceFromLatest };
    }
    return saved;
  }

  const fallback = buildWakeFallback(state.drops, projectId, worldId);
  return {
    id: createWakeId(projectId, worldId),
    projectId,
    worldId,
    lastTouch: fallback.lastTouch,
    nextMotion: fallback.nextMotion,
    lastSurfaceKind: fallback.lastSurfaceKind,
    updatedAt: latest?.createdAt ?? 0,
  };
}
