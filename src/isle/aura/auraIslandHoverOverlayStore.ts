import { create } from "zustand";

import type { AuraIslandId } from "./auraWorldIslandTypes";

export type AuraIslandHoverScreenAnchor = {
  id: AuraIslandId;
  /** CSS pixels relative to the Canvas wrapper (same box as R3F `size`) */
  x: number;
  y: number;
};

type State = {
  anchor: AuraIslandHoverScreenAnchor | null;
  setAnchor: (a: AuraIslandHoverScreenAnchor | null) => void;
};

export const useAuraIslandHoverOverlay = create<State>((set) => ({
  anchor: null,
  setAnchor: (a) => set({ anchor: a }),
}));
