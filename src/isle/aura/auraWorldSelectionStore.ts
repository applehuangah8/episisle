import { create } from "zustand";
import type * as THREE from "three";

import type { AuraIslandId } from "./auraWorldIslandTypes";

/** Delay before clearing hover after pointer leaves mesh/label — reduces label flicker. */
const HOVER_STICK_MS = 180;

let hoverStickTimer: ReturnType<typeof setTimeout> | null = null;

function cancelHoverStickTimer() {
  if (hoverStickTimer !== null) {
    clearTimeout(hoverStickTimer);
    hoverStickTimer = null;
  }
}

type State = {
  selectedId: AuraIslandId | null;
  hoveredId: AuraIslandId | null;
  /** World-animated root per island (IslandFloat group) for camera focus */
  floatRoots: Partial<Record<AuraIslandId, THREE.Group>>;
  setFloatRoot: (id: AuraIslandId, group: THREE.Group | null) => void;
  setSelected: (id: AuraIslandId | null) => void;
  setHovered: (id: AuraIslandId | null) => void;
  /** If pointer left an island (or its label), clear hover only after delay if still that id. */
  scheduleHoverClearFrom: (fromId: AuraIslandId) => void;
  clearSelection: () => void;
  /** Clear selection, hover, and float roots (call when Aura diorama mounts / HMR). */
  resetInteraction: () => void;
};

export const useAuraWorldSelection = create<State>((set, get) => ({
  selectedId: null,
  hoveredId: null,
  floatRoots: {},
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
    cancelHoverStickTimer();
    set({ selectedId: null });
  },
  resetInteraction: () => {
    cancelHoverStickTimer();
    set({ selectedId: null, hoveredId: null, floatRoots: {} });
  },
}));
