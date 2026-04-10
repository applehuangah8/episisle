import { useEffect, useMemo, useRef, useState } from "react";

import { PILOT_SCHEMA_VERSION, type PilotRepository } from "./pilotRepository";
import { ensureProjectEPresent } from "./restoreProjectE";
import { pilotSeed } from "./seed";
import { downloadSnapshotFile, parseSnapshotJson } from "./snapshotExchange";
import { particleElementKey } from "../domain/particleScope";
import {
  buildWakeFallback,
  createDropId,
  createParticleId,
  createProjectId,
  createWakeId,
  deriveWakeNote,
  normalizeZonePreference,
  resolveWakeKey,
} from "../domain/services";
import { normalizePilotState, STUDIO_ARTIFACTS } from "../domain/studio";
import type {
  ArtifactFinish,
  DropMode,
  PilotEvent,
  PilotState,
  Project,
  StudioArtifact,
  SurfaceKind,
  WakeNote,
  ZoneId,
} from "../domain/types";
import { createLocalPilotRepository } from "../infrastructure/localPilotRepository";

type Draft = {
  content: string;
  zone: ZoneId;
  mode: DropMode;
  surface: SurfaceKind;
  surfaceTint?: string;
  surfaceVariant?: string;
  textColor: string;
  textFont: "etching" | "serif" | "script";
};

type Runtime = {
  state: PilotState;
  events: PilotEvent[];
};

function wakeNoteAfterDropsChange(
  drops: PilotState["drops"],
  projectId: string,
  worldId: string | null,
  prevWakes: PilotState["wakeNotes"]
): WakeNote {
  const key = resolveWakeKey(projectId, worldId);
  const fb = buildWakeFallback(drops, projectId, worldId);
  const prev = prevWakes[key];
  const scoped = drops
    .filter((item) => item.projectId === projectId && item.worldId === worldId)
    .sort((a, b) => b.createdAt - a.createdAt);
  const latest = scoped[0];
  return {
    id: prev?.id ?? createWakeId(projectId, worldId),
    projectId,
    worldId,
    lastTouch: fb.lastTouch,
    nextMotion: fb.nextMotion,
    lastSurfaceKind: fb.lastSurfaceKind,
    updatedAt: latest?.createdAt ?? Date.now(),
  };
}

function cloneState(source: PilotState): PilotState {
  const raw: PilotState = {
    currentProjectId: source.currentProjectId,
    projects: structuredClone(source.projects),
    worlds: structuredClone(source.worlds),
    wakeNotes: structuredClone(source.wakeNotes),
    drops: structuredClone(source.drops),
    particles: structuredClone(source.particles ?? []),
    selectedParticleId: source.selectedParticleId ?? null,
  };
  return normalizePilotState(raw);
}

const defaultRepo: PilotRepository = createLocalPilotRepository();

function initialRuntime(repo: PilotRepository): Runtime {
  const snap = repo.load();
  if (snap) {
    const state = normalizePilotState(ensureProjectEPresent(cloneState(snap.state)));
    return { state, events: [...snap.events] };
  }
  return { state: cloneState(pilotSeed), events: [] };
}

export function useSalonPilot(repo: PilotRepository = defaultRepo) {
  const repoRef = useRef(repo);
  repoRef.current = repo;

  const [runtime, setRuntime] = useState<Runtime>(() => initialRuntime(repo));
  const [draft, setDraft] = useState<Draft>({
    content: "",
    zone: "Pocket",
    mode: "RawPour",
    surface: "frosted-plaque",
    surfaceTint: "#c4a574",
    surfaceVariant: "bouquet-porcelain-pastel",
    textColor: "#26344e",
    textFont: "etching",
  });
  const [ioFeedback, setIoFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const { state, events } = runtime;
  const currentProject = state.projects[state.currentProjectId];
  const activeWorldId = currentProject.activeWorldId;
  const activeWorld = activeWorldId ? state.worlds[activeWorldId] : null;
  const wake = deriveWakeNote(state, currentProject.id, activeWorldId);

  const recentEvents = useMemo(() => events.slice(-12).reverse(), [events]);

  useEffect(() => {
    const s = currentProject.defaultSurface ?? "frosted-plaque";
    setDraft((d) => ({ ...d, surface: s, surfaceTint: d.surfaceTint ?? currentProject.artifactTint ?? "#c4a574" }));
  }, [currentProject.id]);

  useEffect(() => {
    repoRef.current.save({
      schemaVersion: PILOT_SCHEMA_VERSION,
      state: runtime.state,
      events: runtime.events,
    });
  }, [runtime]);

  function switchProject(projectId: string) {
    setRuntime((prev) => {
      if (!prev.state.projects[projectId]) return prev;
      if (prev.state.currentProjectId === projectId) return prev;
      const ev: PilotEvent = {
        type: "project.switched",
        at: Date.now(),
        fromProjectId: prev.state.currentProjectId,
        toProjectId: projectId,
      };
      return {
        state: { ...prev.state, currentProjectId: projectId, selectedParticleId: null },
        events: [...prev.events, ev],
      };
    });
  }

  function addProjectWithStudio(opts: {
    name: string;
    subtitle?: string;
    status?: string;
    studioArtifact: StudioArtifact;
    defaultSurface: SurfaceKind;
    artifactTint?: string;
    artifactFinish?: ArtifactFinish;
  }) {
    const meta = STUDIO_ARTIFACTS.find((a) => a.id === opts.studioArtifact);
    if (!meta) return;
    const name = opts.name.trim();
    if (!name) return;
    const subtitle = opts.subtitle?.trim() || undefined;
    const status = opts.status?.trim() || undefined;
    setRuntime((prev) => {
      const projectId = createProjectId();
      const next: Project = {
        id: projectId,
        name,
        subtitle,
        status,
        studioArtifact: opts.studioArtifact,
        artifactTint: opts.artifactTint,
        artifactFinish: opts.artifactFinish,
        defaultSurface: opts.defaultSurface,
        ambientState: "warm",
        worldIds: [],
        activeWorldId: null,
      };
      const ev: PilotEvent = { type: "project.created", at: Date.now(), projectId };
      return {
        state: {
          ...prev.state,
          projects: { ...prev.state.projects, [projectId]: next },
          currentProjectId: projectId,
        },
        events: [...prev.events, ev],
      };
    });
    setDraft((d) => ({ ...d, surface: opts.defaultSurface }));
  }

  function updateProjectMeta(projectId: string, patch: { name: string; subtitle: string; status: string }) {
    setRuntime((prev) => {
      const p = prev.state.projects[projectId];
      if (!p) return prev;
      const name = patch.name.trim();
      if (!name) return prev;
      const next: Project = {
        ...p,
        name,
        subtitle: patch.subtitle.trim() || undefined,
        status: patch.status.trim() || undefined,
      };
      return {
        state: {
          ...prev.state,
          projects: { ...prev.state.projects, [projectId]: next },
        },
        events: prev.events,
      };
    });
  }

  function removeProject(projectId: string) {
    setRuntime((prev) => {
      const projKeys = Object.keys(prev.state.projects);
      if (projKeys.length <= 1) return prev;
      if (!prev.state.projects[projectId]) return prev;

      const nextProjects = { ...prev.state.projects };
      delete nextProjects[projectId];

      const nextWorlds = { ...prev.state.worlds };
      for (const wid of Object.keys(nextWorlds)) {
        if (nextWorlds[wid].projectId === projectId) delete nextWorlds[wid];
      }

      const nextDrops = prev.state.drops.filter((d) => d.projectId !== projectId);

      const nextWakeNotes: PilotState["wakeNotes"] = {};
      for (const [key, note] of Object.entries(prev.state.wakeNotes)) {
        if (note.projectId === projectId || key.startsWith(`${projectId}::`)) continue;
        nextWakeNotes[key] = note;
      }

      const nextParticles = prev.state.particles.filter((p) => !p.elementId.startsWith(`${projectId}::`));

      let nextCurrentId = prev.state.currentProjectId;
      if (nextCurrentId === projectId) {
        nextCurrentId = Object.keys(nextProjects)[0];
      }

      const ev: PilotEvent = { type: "project.deleted", at: Date.now(), projectId };
      return {
        state: {
          ...prev.state,
          projects: nextProjects,
          worlds: nextWorlds,
          drops: nextDrops,
          wakeNotes: nextWakeNotes,
          particles: nextParticles,
          selectedParticleId: nextParticles.some((p) => p.id === prev.state.selectedParticleId)
            ? prev.state.selectedParticleId
            : null,
          currentProjectId: nextCurrentId,
        },
        events: [...prev.events, ev],
      };
    });
  }

  /** Universal studio gesture: cycle room ambiance (all projects; persists). Project A cabochon uses the same hook in UI. */
  const AMBIENT_CYCLE: Project["ambientState"][] = ["warm", "bloom", "glow"];

  function cycleAmbient() {
    setRuntime((prev) => {
      const p = prev.state.projects[prev.state.currentProjectId];
      const i = AMBIENT_CYCLE.indexOf(p.ambientState);
      const next = AMBIENT_CYCLE[(i < 0 ? 0 : i + 1) % AMBIENT_CYCLE.length];
      return {
        state: {
          ...prev.state,
          projects: {
            ...prev.state.projects,
            [p.id]: { ...p, ambientState: next },
          },
        },
        events: prev.events,
      };
    });
  }

  function switchWorld(worldId: string) {
    setRuntime((prev) => {
      const project = prev.state.projects[prev.state.currentProjectId];
      if (!project.worldIds.includes(worldId)) return prev;
      if (project.activeWorldId === worldId) return prev;
      const ev: PilotEvent = {
        type: "world.switched",
        at: Date.now(),
        projectId: project.id,
        fromWorldId: project.activeWorldId,
        toWorldId: worldId,
      };
      return {
        state: {
          ...prev.state,
          projects: {
            ...prev.state.projects,
            [project.id]: { ...project, activeWorldId: worldId },
          },
          selectedParticleId: null,
        },
        events: [...prev.events, ev],
      };
    });
  }

  function addParticle(color: string) {
    const projectId = currentProject.id;
    const worldId = currentProject.activeWorldId;
    const elementId = particleElementKey(projectId, worldId);
    const id = createParticleId();
    const c = color.trim() || "#c4a8d8";
    const jitter = () => (Math.random() - 0.5) * 1.6;
    const pos: [number, number, number] = [jitter(), jitter() * 0.9, 0];
    const now = Date.now();
    setRuntime((prev) => ({
      state: {
        ...prev.state,
        particles: [
          ...prev.state.particles,
          {
            id,
            elementId,
            color: c,
            position: pos,
            linkedDropIds: [],
            createdAt: now,
          },
        ],
      },
      events: prev.events,
    }));
  }

  function moveParticle(particleId: string, position: [number, number, number]) {
    const max = 2.55;
    const clamp = (n: number) => Math.max(-max, Math.min(max, n));
    const next: [number, number, number] = [clamp(position[0]), clamp(position[1]), 0];
    setRuntime((prev) => {
      const idx = prev.state.particles.findIndex((p) => p.id === particleId);
      if (idx < 0) return prev;
      const copy = [...prev.state.particles];
      copy[idx] = { ...copy[idx]!, position: next };
      return { state: { ...prev.state, particles: copy }, events: prev.events };
    });
  }

  function setSelectedParticleId(id: string | null) {
    setRuntime((prev) => ({
      state: { ...prev.state, selectedParticleId: id },
      events: prev.events,
    }));
  }

  function toggleParticleDropLink(particleId: string, dropId: string) {
    setRuntime((prev) => {
      const idx = prev.state.particles.findIndex((p) => p.id === particleId);
      if (idx < 0) return prev;
      const p = prev.state.particles[idx]!;
      const has = p.linkedDropIds.includes(dropId);
      const linkedDropIds = has
        ? p.linkedDropIds.filter((x) => x !== dropId)
        : [...p.linkedDropIds, dropId];
      const copy = [...prev.state.particles];
      copy[idx] = { ...p, linkedDropIds };
      return { state: { ...prev.state, particles: copy }, events: prev.events };
    });
  }

  function dropNow() {
    const text = draft.content.trim();
    if (!text) return;
    const zone = normalizeZonePreference(draft.zone);
    const projectId = currentProject.id;
    const worldId = currentProject.activeWorldId;
    const now = Date.now();

    setRuntime((prev) => {
      const dropId = createDropId();
      const nextDrop = {
        id: dropId,
        projectId,
        worldId,
        zone,
        mode: draft.mode,
        content: text,
        createdAt: now,
        surfaceKind: draft.surface,
        surfaceTint: draft.surface === "silk-ribbon" ? draft.surfaceTint : undefined,
        surfaceVariant: draft.surface === "bouquet-spray" ? draft.surfaceVariant : undefined,
        textColor: draft.textColor,
        textFont: draft.textFont,
      };

      const key = resolveWakeKey(projectId, worldId);
      const nextWake = {
        id: createWakeId(projectId, worldId),
        projectId,
        worldId,
        lastTouch: text.length > 72 ? `${text.slice(0, 69)}…` : text,
        nextMotion: draft.mode === "RawPour" ? "可抽一句到 Thread。" : "推進為具體動作。",
        lastSurfaceKind: draft.surface,
        updatedAt: now,
      };

      const dropEvent: PilotEvent = {
        type: "drop.created",
        at: now,
        dropId,
        projectId,
        worldId,
        zone,
        mode: draft.mode,
        contentLength: text.length,
      };

      return {
        state: {
          ...prev.state,
          drops: [nextDrop, ...prev.state.drops],
          wakeNotes: { ...prev.state.wakeNotes, [key]: nextWake },
        },
        events: [...prev.events, dropEvent],
      };
    });

    setDraft((prev) => ({ ...prev, content: "" }));
  }

  function updateDropContent(dropId: string, content: string) {
    const text = content.trim();
    if (!text) return;
    const at = Date.now();
    setRuntime((prev) => {
      const idx = prev.state.drops.findIndex((d) => d.id === dropId);
      if (idx < 0) return prev;
      const drop = prev.state.drops[idx]!;
      const newDrops = [...prev.state.drops];
      newDrops[idx] = { ...drop, content: text };
      const key = resolveWakeKey(drop.projectId, drop.worldId);
      const nextWake = wakeNoteAfterDropsChange(newDrops, drop.projectId, drop.worldId, prev.state.wakeNotes);
      const ev: PilotEvent = { type: "drop.updated", at, dropId };
      return {
        state: {
          ...prev.state,
          drops: newDrops,
          wakeNotes: { ...prev.state.wakeNotes, [key]: nextWake },
        },
        events: [...prev.events, ev],
      };
    });
  }

  function deleteDrop(dropId: string) {
    const at = Date.now();
    setRuntime((prev) => {
      const drop = prev.state.drops.find((d) => d.id === dropId);
      if (!drop) return prev;
      const newDrops = prev.state.drops.filter((d) => d.id !== dropId);
      const key = resolveWakeKey(drop.projectId, drop.worldId);
      const nextWake = wakeNoteAfterDropsChange(newDrops, drop.projectId, drop.worldId, prev.state.wakeNotes);
      const ev: PilotEvent = { type: "drop.deleted", at, dropId };
      const particlesCleaned = prev.state.particles.map((p) => ({
        ...p,
        linkedDropIds: p.linkedDropIds.filter((id) => id !== dropId),
      }));
      return {
        state: {
          ...prev.state,
          drops: newDrops,
          wakeNotes: { ...prev.state.wakeNotes, [key]: nextWake },
          particles: particlesCleaned,
        },
        events: [...prev.events, ev],
      };
    });
  }

  function resetPilot() {
    const at = Date.now();
    repoRef.current.clear();
    setRuntime({
      state: cloneState(pilotSeed),
      events: [{ type: "pilot.reset", at }],
    });
    setDraft({
      content: "",
      zone: "Pocket",
      mode: "RawPour",
      surface: "frosted-plaque",
      surfaceTint: "#c4a574",
      surfaceVariant: "bouquet-porcelain-pastel",
      textColor: "#26344e",
      textFont: "etching",
    });
    setIoFeedback(null);
  }

  function exportSnapshot() {
    downloadSnapshotFile({
      schemaVersion: PILOT_SCHEMA_VERSION,
      state: runtime.state,
      events: runtime.events,
    });
    setIoFeedback({ tone: "ok", text: "Exported snapshot file." });
  }

  function importSnapshotText(text: string) {
    const r = parseSnapshotJson(text);
    if (!r.ok) {
      setIoFeedback({ tone: "err", text: r.error });
      return false;
    }
    const at = Date.now();
    setRuntime({
      state: cloneState(r.snapshot.state),
      events: [...r.snapshot.events, { type: "snapshot.imported", at }],
    });
    setIoFeedback({ tone: "ok", text: "Import successful. Current session replaced." });
    return true;
  }

  function clearIoFeedback() {
    setIoFeedback(null);
  }

  const checklist = {
    projectSwitchReady: Object.keys(state.projects).length >= 2,
    worldSwitchReady: currentProject.worldIds.length > 0,
    rawPourReady: state.drops.some((item) => item.mode === "RawPour"),
    wakeReentryReady: Boolean(wake.lastTouch && wake.nextMotion),
    persistenceReady: true,
    eventLogReady: events.length > 0,
  };

  return {
    state,
    events,
    recentEvents,
    draft,
    setDraft,
    currentProject,
    activeWorld,
    wake,
    switchProject,
    addProjectWithStudio,
    updateProjectMeta,
    removeProject,
    cycleAmbient,
    switchWorld,
    dropNow,
    updateDropContent,
    deleteDrop,
    addParticle,
    moveParticle,
    setSelectedParticleId,
    toggleParticleDropLink,
    resetPilot,
    exportSnapshot,
    importSnapshotText,
    ioFeedback,
    clearIoFeedback,
    checklist,
  };
}
