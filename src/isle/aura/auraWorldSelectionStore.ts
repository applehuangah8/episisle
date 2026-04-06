import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type * as THREE from "three";

import { writeAuraWorldSlugToUrl } from "@/isle/urlMode";

import type { AuraIslandId } from "./auraWorldIslandTypes";
import { worldSlugFromAuraIslandId } from "./auraWorldIslandTypes";
import { isValidAuraWorldId, seedDefaultWorldMeta } from "./auraWorldIdentity";
import type { AuraWorldMeta, AuraWorldSettlementStatus } from "./auraWorldIdentity";
import { computeWorldEntryResume, readPersistedAuraIdentityFromStorage } from "./auraWorldResume";
import { useEpisCodexStore } from "./codex/episCodexStore";

/** Delay before clearing hover after pointer leaves mesh/label — reduces label flicker. */
const HOVER_STICK_MS = 180;

let hoverStickTimer: ReturnType<typeof setTimeout> | null = null;

/** Layer 2 — inside an entered world: Focus UI vs 3D “aura” scene. */
export type AuraInWorldViewMode = "focus" | "aura";

/**
 * Post-cinematic entry: choose Aura/Focus → name → (Focus only) confirm → ready.
 * `null` / `'ready'` = normal in-world chrome.
 */
export type AuraEntryFlowStage = "chooseMode" | "naming" | "focusGate" | "ready" | null;

function cancelHoverStickTimer() {
  if (hoverStickTimer !== null) {
    clearTimeout(hoverStickTimer);
    hoverStickTimer = null;
  }
}

type State = {
  selectedId: AuraIslandId | null;
  hoveredId: AuraIslandId | null;
  floatRoots: Partial<Record<AuraIslandId, THREE.Group>>;
  selectedWorldId: string | null;
  isEntering: boolean;
  isEntered: boolean;
  enterGeneration: number;
  enterStartedAtMs: number | null;
  enterPhase: number;
  entryBloomBoost: number;
  viewMode: AuraInWorldViewMode;

  worldMetaById: Partial<Record<string, AuraWorldMeta>>;
  namingGateDoneByWorldId: Partial<Record<string, boolean>>;

  entryFlowStage: AuraEntryFlowStage;
  /** Set when picking Aura vs Focus; cleared after naming or cancel. */
  pendingPostNamingMode: AuraInWorldViewMode | null;

  showFocusEntryConfirm: boolean;
  showNamingModal: boolean;
  auraPanelCollapsed: boolean;
  focusChromeExpanded: boolean;
  namingEmissivePulse: number;

  setFloatRoot: (id: AuraIslandId, group: THREE.Group | null) => void;
  setSelected: (id: AuraIslandId | null) => void;
  setHovered: (id: AuraIslandId | null) => void;
  scheduleHoverClearFrom: (fromId: AuraIslandId) => void;
  clearSelection: () => void;
  resetInteraction: () => void;

  beginWorldEntry: (id: AuraIslandId) => void;
  finalizeWorldEntry: () => void;
  setEnterPhase: (phase: number) => void;
  tickBloomBoostDecay: (deltaSeconds: number) => void;
  resetWorldEntry: () => void;
  setInWorldViewMode: (mode: AuraInWorldViewMode) => void;

  chooseEntryMode: (mode: AuraInWorldViewMode) => void;
  afterNamingCommitted: () => void;
  completeFocusGateEntry: () => void;
  cancelFocusGateEntry: () => void;

  setShowFocusEntryConfirm: (v: boolean) => void;
  setShowNamingModal: (v: boolean) => void;
  setAuraPanelCollapsed: (v: boolean) => void;
  setFocusChromeExpanded: (v: boolean) => void;
  bumpNamingEmissivePulse: () => void;
  tickNamingEmissivePulseDecay: (deltaSeconds: number) => void;

  setWorldMeta: (worldId: string, meta: Partial<AuraWorldMeta>) => void;
  markNamingGateDone: (worldId: string) => void;
  /** From in-world Focus chrome — return to Aura and remember preference. */
  exitFocusToAura: () => void;
  /**
   * Wipe persisted data for the **currently entered** island only (identity, codex, Focus snapshot),
   * then return to post-entry mode pick + naming flow as if the island were untouched.
   */
  clearEnteredIslandUserData: () => void;
};

const worldEntryIdleFixed = {
  selectedWorldId: null as string | null,
  isEntering: false,
  isEntered: false,
  enterGeneration: 0,
  enterStartedAtMs: null as number | null,
  enterPhase: 0,
  entryBloomBoost: 0,
  viewMode: "aura" as AuraInWorldViewMode,
  entryFlowStage: null as AuraEntryFlowStage,
  pendingPostNamingMode: null as AuraInWorldViewMode | null,
  showFocusEntryConfirm: false,
  showNamingModal: false,
  auraPanelCollapsed: false,
  focusChromeExpanded: false,
  namingEmissivePulse: 0,
};

export const useAuraWorldSelection = create<State>()(
  persist(
    (set, get) => ({
      selectedId: null,
      hoveredId: null,
      floatRoots: {},
      worldMetaById: {},
      namingGateDoneByWorldId: {},
      ...worldEntryIdleFixed,

      setFloatRoot: (id, group) =>
        set((s) => {
          const next = { ...s.floatRoots };
          if (group) next[id] = group;
          else delete next[id];
          return { floatRoots: next };
        }),
      setSelected: (id) => set({ selectedId: id }),
      setHovered: (id) => {
        cancelHoverStickTimer();
        set({ hoveredId: id });
      },
      scheduleHoverClearFrom: (fromId) => {
        cancelHoverStickTimer();
        hoverStickTimer = setTimeout(() => {
          hoverStickTimer = null;
          if (get().hoveredId === fromId) set({ hoveredId: null });
        }, HOVER_STICK_MS);
      },
      clearSelection: () => {
        const { isEntering, isEntered } = get();
        if (isEntering || isEntered) return;
        cancelHoverStickTimer();
        set({ selectedId: null });
      },
      resetInteraction: () => {
        cancelHoverStickTimer();
        set({
          selectedId: null,
          hoveredId: null,
          floatRoots: {},
          ...worldEntryIdleFixed,
        });
      },

      setInWorldViewMode: (mode) => set({ viewMode: mode }),
      setShowFocusEntryConfirm: (v) => set({ showFocusEntryConfirm: v }),
      setShowNamingModal: (v) => set({ showNamingModal: v }),
      setAuraPanelCollapsed: (v) => set({ auraPanelCollapsed: v }),
      setFocusChromeExpanded: (v) => set({ focusChromeExpanded: v }),

      chooseEntryMode: (mode) =>
        set({
          pendingPostNamingMode: mode,
          entryFlowStage: "naming",
          showNamingModal: true,
        }),

      afterNamingCommitted: () => {
        const pending = get().pendingPostNamingMode;
        const wid = get().selectedWorldId;
        if (wid && (pending === "aura" || pending === "focus")) {
          get().setWorldMeta(wid, { lastInWorldMode: pending });
        }
        if (pending === "aura") {
          set({
            pendingPostNamingMode: null,
            entryFlowStage: "ready",
            viewMode: "aura",
            showNamingModal: false,
          });
        } else if (pending === "focus") {
          set({
            pendingPostNamingMode: null,
            entryFlowStage: "focusGate",
            showNamingModal: false,
            showFocusEntryConfirm: true,
          });
        } else {
          set({ showNamingModal: false });
        }
      },

      completeFocusGateEntry: () => {
        const wid = get().selectedWorldId;
        if (wid) get().setWorldMeta(wid, { lastInWorldMode: "focus" });
        set({
          showFocusEntryConfirm: false,
          entryFlowStage: "ready",
          viewMode: "focus",
          focusChromeExpanded: false,
        });
      },

      cancelFocusGateEntry: () => {
        const wid = get().selectedWorldId;
        if (!wid) {
          set({ showFocusEntryConfirm: false, entryFlowStage: "chooseMode" });
          return;
        }
        const s = get();
        const disk = readPersistedAuraIdentityFromStorage();
        const mergedWorldMeta = { ...(disk?.worldMetaById ?? {}), ...s.worldMetaById };
        const mergedGate = { ...(disk?.namingGateDoneByWorldId ?? {}), ...s.namingGateDoneByWorldId };
        const resume = computeWorldEntryResume(wid, mergedWorldMeta, mergedGate);
        if (resume.skipModePick) {
          set({
            showFocusEntryConfirm: false,
            entryFlowStage: "ready",
            viewMode: "aura",
          });
        } else {
          set({
            showFocusEntryConfirm: false,
            entryFlowStage: "chooseMode",
          });
        }
      },

      exitFocusToAura: () => {
        const wid = get().selectedWorldId;
        if (wid) get().setWorldMeta(wid, { lastInWorldMode: "aura" });
        set({ viewMode: "aura", focusChromeExpanded: false, showFocusEntryConfirm: false });
      },

      clearEnteredIslandUserData: () => {
        const wid = get().selectedWorldId;
        if (!wid || !get().isEntered) return;

        useEpisCodexStore.getState().purgeWorldCodex(wid);

        try {
          if (typeof localStorage !== "undefined") {
            localStorage.removeItem(`epis-isle-world-${wid}`);
          }
        } catch {
          /* ignore */
        }

        set((s) => {
          const worldMetaById = { ...s.worldMetaById };
          delete worldMetaById[wid];
          const namingGateDoneByWorldId = { ...s.namingGateDoneByWorldId };
          delete namingGateDoneByWorldId[wid];
          return {
            worldMetaById,
            namingGateDoneByWorldId,
            entryFlowStage: "chooseMode",
            viewMode: "aura",
            showFocusEntryConfirm: false,
            showNamingModal: false,
            pendingPostNamingMode: null,
            focusChromeExpanded: false,
            auraPanelCollapsed: false,
          };
        });
      },

      bumpNamingEmissivePulse: () =>
        set((s) => ({ namingEmissivePulse: Math.min(1, s.namingEmissivePulse + 0.38) })),

      tickNamingEmissivePulseDecay: (deltaSeconds) => {
        const v = get().namingEmissivePulse;
        if (v < 1e-4) return;
        const next = v * Math.exp(-deltaSeconds * 5.2);
        set({ namingEmissivePulse: next <= 0.02 ? 0 : next });
      },

      setWorldMeta: (worldId, meta) =>
        set((s) => {
          const prev = s.worldMetaById[worldId];
          const base: AuraWorldMeta = isValidAuraWorldId(worldId)
            ? seedDefaultWorldMeta(worldId)
            : { name: "", isDefaultName: true, settlementStatus: "floating" };
          const merged = { ...base, ...prev, ...meta } satisfies AuraWorldMeta;
          return {
            worldMetaById: { ...s.worldMetaById, [worldId]: merged },
          };
        }),

      markNamingGateDone: (worldId) =>
        set((s) => ({
          namingGateDoneByWorldId: { ...s.namingGateDoneByWorldId, [worldId]: true },
        })),

      beginWorldEntry: (id) => {
        const { isEntered, isEntering } = get();
        if (isEntered) return;
        if (isEntering) return;
        const now = typeof performance !== "undefined" ? performance.now() : 0;
        set((s) => ({
          selectedWorldId: id,
          selectedId: id,
          isEntering: true,
          isEntered: false,
          enterStartedAtMs: now,
          enterGeneration: s.enterGeneration + 1,
          enterPhase: 0,
          entryBloomBoost: 0,
          viewMode: "aura",
          entryFlowStage: null,
          pendingPostNamingMode: null,
          showFocusEntryConfirm: false,
          showNamingModal: false,
          focusChromeExpanded: false,
          auraPanelCollapsed: false,
        }));
      },

      finalizeWorldEntry: () => {
        const id = get().selectedId;
        if (!id) {
          set({
            isEntering: false,
            isEntered: true,
            enterPhase: 1,
            entryBloomBoost: 1,
            entryFlowStage: "chooseMode",
          });
          return;
        }
        const wid = id as string;
        const s = get();
        const disk = readPersistedAuraIdentityFromStorage();
        const mergedWorldMeta = { ...(disk?.worldMetaById ?? {}), ...s.worldMetaById };
        const mergedGate = { ...(disk?.namingGateDoneByWorldId ?? {}), ...s.namingGateDoneByWorldId };

        const nextMeta = { ...mergedWorldMeta };
        if (!nextMeta[wid]) nextMeta[wid] = seedDefaultWorldMeta(id);

        const resume = computeWorldEntryResume(wid, nextMeta, mergedGate);
        if (resume.persistLastInWorldMode != null) {
          const r = nextMeta[wid]!;
          nextMeta[wid] = { ...r, lastInWorldMode: resume.persistLastInWorldMode };
        }

        const common = {
          worldMetaById: nextMeta,
          namingGateDoneByWorldId: mergedGate,
          isEntering: false,
          isEntered: true,
          enterPhase: 1,
          entryBloomBoost: 1,
          showNamingModal: false,
          pendingPostNamingMode: null,
        } as const;

        if (resume.skipModePick && resume.lastInWorldMode === "aura") {
          set({
            ...common,
            entryFlowStage: "ready",
            viewMode: "aura",
            showFocusEntryConfirm: false,
          });
          try {
            writeAuraWorldSlugToUrl(worldSlugFromAuraIslandId(id));
          } catch {
            /* ignore */
          }
          requestAnimationFrame(() => {
            useEpisCodexStore.getState().openCodexForWorld(wid);
          });
          return;
        }

        if (resume.skipModePick && resume.lastInWorldMode === "focus") {
          set({
            ...common,
            entryFlowStage: "focusGate",
            viewMode: "aura",
            showFocusEntryConfirm: true,
          });
          try {
            writeAuraWorldSlugToUrl(worldSlugFromAuraIslandId(id));
          } catch {
            /* ignore */
          }
          return;
        }

        set({
          ...common,
          entryFlowStage: "chooseMode",
          showFocusEntryConfirm: false,
        });
        try {
          writeAuraWorldSlugToUrl(worldSlugFromAuraIslandId(id));
        } catch {
          /* ignore URL issues */
        }
      },

      setEnterPhase: (phase) => set({ enterPhase: Math.max(0, Math.min(1, phase)) }),

      tickBloomBoostDecay: (deltaSeconds) => {
        const s = get();
        if (s.entryBloomBoost < 1e-5) return;
        const next = s.entryBloomBoost * Math.exp(-deltaSeconds * 2.4);
        set({ entryBloomBoost: next <= 0.015 ? 0 : next });
      },

      resetWorldEntry: () =>
        set(() => {
          try {
            writeAuraWorldSlugToUrl(null);
          } catch {
            /* ignore */
          }
          return {
            ...worldEntryIdleFixed,
            selectedId: null,
          };
        }),
    }),
    {
      name: "epis-aura-world-identity-v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        worldMetaById: s.worldMetaById,
        namingGateDoneByWorldId: s.namingGateDoneByWorldId,
      }),
      migrate: (persisted, fromVersion) => {
        const p = persisted as {
          worldMetaById?: Partial<Record<string, AuraWorldMeta>>;
          namingGateDoneByWorldId?: Partial<Record<string, boolean>>;
        };
        if (fromVersion < 2) {
          const worldMetaById = { ...p.worldMetaById };
          const gate = p.namingGateDoneByWorldId ?? {};
          for (const [wid, done] of Object.entries(gate)) {
            if (!done) continue;
            const row = worldMetaById[wid];
            if (!row || row.settlementStatus) continue;
            worldMetaById[wid] = { ...row, settlementStatus: "settled" };
          }
          return {
            worldMetaById,
            namingGateDoneByWorldId: p.namingGateDoneByWorldId ?? {},
          };
        }
        return p as {
          worldMetaById: Partial<Record<string, AuraWorldMeta>>;
          namingGateDoneByWorldId: Partial<Record<string, boolean>>;
        };
      },
    }
  )
);

/** Snapshot of `worldMeta` for the currently entered world (UX / bindings). */
export type AuraEnteredWorldMetaUx = {
  id: string;
  name: string;
  isDefaultName: boolean;
  settlementStatus?: AuraWorldSettlementStatus;
  lastInWorldMode?: "aura" | "focus";
};

export function readEnteredWorldMetaForUx(): AuraEnteredWorldMetaUx | null {
  const s = useAuraWorldSelection.getState();
  if (!s.isEntered || !s.selectedWorldId) return null;
  const id = s.selectedWorldId;
  const row = s.worldMetaById[id];
  if (row)
    return {
      id,
      name: row.name,
      isDefaultName: row.isDefaultName,
      settlementStatus: row.settlementStatus,
      lastInWorldMode: row.lastInWorldMode,
    };
  const seeded = seedDefaultWorldMeta(id as AuraIslandId);
  return { id, ...seeded };
}
