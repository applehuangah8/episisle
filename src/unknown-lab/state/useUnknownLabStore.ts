import { nanoid } from "nanoid";
import { create } from "zustand";

import type { IdeaOre, RefinedGem, VacationSceneId } from "@/unknown-lab/state/types";

export type WanderJot = {
  id: string;
  text: string;
  createdAt: number;
};

type UnknownLabState = {
  vacationScene: VacationSceneId;
  setVacationScene: (id: VacationSceneId) => void;
  worldPickerOpen: boolean;
  openWorldPicker: () => void;
  closeWorldPicker: () => void;

  ores: IdeaOre[];
  gems: RefinedGem[];
  kits: Record<string, { need: string; materials: string; next: string }>;
  openGemId: string | null;
  hoveredOreId: string | null;
  selectedOreIds: string[];
  jots: WanderJot[];

  setHoveredOreId: (id: string | null) => void;
  setSelectedOreId: (id: string | null, opts?: { additive?: boolean }) => void;
  clearSelection: () => void;

  spawnOre: (input: { text: string; x: number; z: number }) => void;
  moveOresBy: (ids: string[], delta: { dx: number; dz: number }) => void;
  tryRefineAtCrucible: (ids: string[]) => void;
  openKitForGem: (gemId: string) => void;
  closeKit: () => void;
  updateKit: (gemId: string, patch: Partial<{ need: string; materials: string; next: string }>) => void;

  addJot: (text: string) => void;
  removeJot: (id: string) => void;
  sprinkleJotAsOre: (id: string) => void;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export const useUnknownLabStore = create<UnknownLabState>((set) => ({
  vacationScene: "v1",
  setVacationScene: (id) => set({ vacationScene: id }),
  worldPickerOpen: true,
  openWorldPicker: () => set({ worldPickerOpen: true }),
  closeWorldPicker: () => set({ worldPickerOpen: false }),

  ores: [],
  gems: [],
  kits: {},
  openGemId: null,
  hoveredOreId: null,
  selectedOreIds: [],
  jots: [],

  setHoveredOreId: (id) => set({ hoveredOreId: id }),
  setSelectedOreId: (id, opts) =>
    set((s) => {
      const additive = opts?.additive ?? false;
      if (id == null) return { selectedOreIds: [] };
      if (!additive) return { selectedOreIds: [id] };
      const has = s.selectedOreIds.includes(id);
      return { selectedOreIds: has ? s.selectedOreIds.filter((x) => x !== id) : [...s.selectedOreIds, id] };
    }),
  clearSelection: () => set({ selectedOreIds: [] }),

  spawnOre: ({ text, x, z }) =>
    set((s) => {
      const ore: IdeaOre = {
        id: nanoid(),
        seed: Math.floor(Math.random() * 1_000_000),
        text: text.trim(),
        x: clamp(x, -4.9, 4.9),
        z: clamp(z, -4.9, 4.9),
      };
      return { ores: [...s.ores, ore], selectedOreIds: [ore.id] };
    }),

  moveOresBy: (ids, { dx, dz }) =>
    set((s) => ({
      ores: s.ores.map((o) =>
        ids.includes(o.id)
          ? { ...o, x: clamp(o.x + dx, -4.9, 4.9), z: clamp(o.z + dz, -4.9, 4.9) }
          : o
      ),
    })),

  tryRefineAtCrucible: (ids) =>
    set((s) => {
      const unique = Array.from(new Set(ids)).filter((id) => s.ores.some((o) => o.id === id));
      if (unique.length < 2) return s;
      // Crucible is centered at (0,0). If the average position is near center, refine.
      const selected = s.ores.filter((o) => unique.includes(o.id));
      const cx = selected.reduce((a, b) => a + b.x, 0) / selected.length;
      const cz = selected.reduce((a, b) => a + b.z, 0) / selected.length;
      const d = Math.hypot(cx, cz);
      if (d > 0.95) return s;

      const title = selected.map((o) => o.text).filter(Boolean).join(" · ").slice(0, 64) || "Refined";
      const gem: RefinedGem = {
        id: nanoid(),
        seed: Math.floor(Math.random() * 1_000_000),
        title,
        sourceOreIds: unique,
        x: cx,
        z: cz,
      };
      return {
        ores: s.ores.filter((o) => !unique.includes(o.id)),
        gems: [...s.gems, gem],
        kits: {
          ...s.kits,
          [gem.id]: s.kits[gem.id] ?? { need: "", materials: "", next: "" },
        },
        selectedOreIds: [],
      };
    }),

  openKitForGem: (gemId) =>
    set((s) => ({
      openGemId: gemId,
      kits: { ...s.kits, [gemId]: s.kits[gemId] ?? { need: "", materials: "", next: "" } },
    })),
  closeKit: () => set({ openGemId: null }),
  updateKit: (gemId, patch) =>
    set((s) => ({
      kits: { ...s.kits, [gemId]: { ...(s.kits[gemId] ?? { need: "", materials: "", next: "" }), ...patch } },
    })),

  addJot: (text) =>
    set((s) => {
      const t = text.trim();
      if (!t) return s;
      const jot: WanderJot = { id: nanoid(), text: t, createdAt: Date.now() };
      return { jots: [jot, ...s.jots].slice(0, 50) };
    }),
  removeJot: (id) => set((s) => ({ jots: s.jots.filter((j) => j.id !== id) })),
  sprinkleJotAsOre: (id) =>
    set((s) => {
      const jot = s.jots.find((j) => j.id === id);
      if (!jot) return s;
      const ore: IdeaOre = {
        id: nanoid(),
        seed: Math.floor(Math.random() * 1_000_000),
        text: jot.text,
        // sprinkle near left-bottom corner of desk
        x: clamp(-3.6 + Math.random() * 1.1, -4.9, 4.9),
        z: clamp(2.4 + Math.random() * 1.1, -4.9, 4.9),
      };
      return {
        jots: s.jots.filter((j) => j.id !== id),
        ores: [...s.ores, ore],
        selectedOreIds: [ore.id],
      };
    }),
}));

