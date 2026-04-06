import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type * as THREE from "three";

import { writeAuraWorldSlugToUrl } from "@/isle/urlMode";

import type { AuraIslandId } from "./auraWorldIslandTypes";
import { worldSlugFromAuraIslandId } from "./auraWorldIslandTypes";
import { seedDefaultWorldMeta } from "./auraWorldIdentity";
import type { AuraWorldMeta } from "./auraWorldIdentity";

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

  setWorldMeta: (worldId: string, meta: AuraWorldMeta) => void;
  markNamingGateDone: (worldId: string) => void;
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

      completeFocusGateEntry: () =>
        set({
          showFocusEntryConfirm: false,
          entryFlowStage: "ready",
          viewMode: "focus",
          focusChromeExpanded: false,
        }),

      cancelFocusGateEntry: () =>
        set({
          showFocusEntryConfirm: false,
          entryFlowStage: "chooseMode",
        }),

      bumpNamingEmissivePulse: () =>
        set((s) => ({ namingEmissivePulse: Math.min(1, s.namingEmissivePulse + 0.38) })),

      tickNamingEmissivePulseDecay: (deltaSeconds) => {
        const v = get().namingEmissivePulse;
        if (v < 1e-4) return;
        const next = v * Math.exp(-deltaSeconds * 5.2);
        set({ namingEmissivePulse: next <= 0.02 ? 0 : next });
      },

      setWorldMeta: (worldId, meta) =>
        set((s) => ({
          worldMetaById: { ...s.worldMetaById, [worldId]: meta },
        })),

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
        set((s) => {
          const nextMeta = { ...s.worldMetaById };
          if (!nextMeta[wid]) nextMeta[wid] = seedDefaultWorldMeta(id);
          return {
            worldMetaById: nextMeta,
            isEntering: false,
            isEntered: true,
            enterPhase: 1,
            entryBloomBoost: 1,
            entryFlowStage: "chooseMode",
            showNamingModal: false,
            showFocusEntryConfirm: false,
          };
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
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        worldMetaById: s.worldMetaById,
        namingGateDoneByWorldId: s.namingGateDoneByWorldId,
      }),
    }
  )
);

/** Snapshot of `worldMeta` for the currently entered world (UX / bindings). */
export type AuraEnteredWorldMetaUx = { id: string; name: string; isDefaultName: boolean };

export function readEnteredWorldMetaForUx(): AuraEnteredWorldMetaUx | null {
  const s = useAuraWorldSelection.getState();
  if (!s.isEntered || !s.selectedWorldId) return null;
  const id = s.selectedWorldId;
  const row = s.worldMetaById[id];
  if (row) return { id, name: row.name, isDefaultName: row.isDefaultName };
  return { id, ...seedDefaultWorldMeta(id as AuraIslandId) };
}
