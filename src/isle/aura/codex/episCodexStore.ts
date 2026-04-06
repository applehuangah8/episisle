import { nanoid } from "nanoid";
import { create } from "zustand";

import { clearCodexStorage, loadCodexEntries, saveCodexEntries } from "./codexStorage";
import type { CodexEntry, CodexImageMask } from "./codexTypes";

export type EpisCodexViewMode = "browse" | "grid";

type State = {
  isCodexOpen: boolean;
  codexEntriesByWorldId: Record<string, CodexEntry[]>;
  /** World the overlay is bound to while open (for persistence routing). */
  codexContextWorldId: string | null;
  activeIndex: number;
  slideDir: -1 | 1;
  showAddForm: boolean;
  /** Browse = single-entry immersive; grid = collection overview (+ archive sheet). */
  codexViewMode: EpisCodexViewMode;
  /** Open archive “sheet” entry id (grid card click); null when closed. */
  codexArchiveEntryId: string | null;

  setCodexOpen: (open: boolean) => void;
  openCodexForWorld: (worldId: string) => void;
  closeCodex: () => void;
  ensureHydrated: (worldId: string) => void;
  addEntry: (
    worldId: string,
    data: {
      title: string;
      description: string;
      category?: string;
      image?: string;
      imageMask?: CodexImageMask;
    },
  ) => void;
  setEntryImageMask: (worldId: string, entryId: string, mask: CodexImageMask) => void;
  removeEntry: (worldId: string, entryId: string) => void;
  goNext: () => void;
  goPrev: () => void;
  setShowAddForm: (v: boolean) => void;
  setCodexViewMode: (mode: EpisCodexViewMode) => void;
  openCodexArchiveEntry: (entryId: string) => void;
  closeCodexArchiveEntry: () => void;
  /** Switch to browse at this entry and close the archive sheet. */
  goCodexBrowseToEntryId: (worldId: string, entryId: string) => void;
  /** Drop all codex data for one world (memory + localStorage). */
  purgeWorldCodex: (worldId: string) => void;
};

function sortEntries(entries: CodexEntry[]): CodexEntry[] {
  return [...entries].sort((a, b) => a.createdAt - b.createdAt);
}

export const useEpisCodexStore = create<State>()((set, get) => ({
  isCodexOpen: false,
  codexEntriesByWorldId: {},
  codexContextWorldId: null,
  activeIndex: 0,
  slideDir: 1,
  showAddForm: false,
  codexViewMode: "browse",
  codexArchiveEntryId: null,

  setCodexOpen: (open) => set({ isCodexOpen: open }),

  ensureHydrated: (worldId) => {
    const existing = get().codexEntriesByWorldId[worldId];
    if (existing) return;
    const loaded = sortEntries(loadCodexEntries(worldId));
    set((s) => ({
      codexEntriesByWorldId: { ...s.codexEntriesByWorldId, [worldId]: loaded },
    }));
  },

  openCodexForWorld: (worldId) => {
    get().ensureHydrated(worldId);
    const list = get().codexEntriesByWorldId[worldId] ?? [];
    set({
      isCodexOpen: true,
      codexContextWorldId: worldId,
      activeIndex: list.length > 0 ? 0 : 0,
      showAddForm: false,
      slideDir: 1,
      codexViewMode: "browse",
      codexArchiveEntryId: null,
    });
  },

  closeCodex: () =>
    set({
      isCodexOpen: false,
      codexContextWorldId: null,
      showAddForm: false,
      codexViewMode: "browse",
      codexArchiveEntryId: null,
    }),

  addEntry: (worldId, data) => {
    const cat = data.category?.trim();
    const entry: CodexEntry = {
      id: nanoid(),
      worldId,
      title: data.title.trim(),
      description: data.description.trim(),
      category: cat || undefined,
      image: data.image?.trim() || undefined,
      imageMask: data.imageMask,
      createdAt: Date.now(),
    };
    if (!entry.title) return;
    set((s) => {
      const prev = s.codexEntriesByWorldId[worldId] ?? [];
      const next = sortEntries([...prev, entry]);
      saveCodexEntries(worldId, next);
      return {
        codexEntriesByWorldId: { ...s.codexEntriesByWorldId, [worldId]: next },
        activeIndex: next.length - 1,
        showAddForm: false,
        slideDir: 1,
      };
    });
  },

  setEntryImageMask: (worldId, entryId, mask) => {
    set((s) => {
      const prev = s.codexEntriesByWorldId[worldId] ?? [];
      const next = prev.map((e) => (e.id === entryId ? { ...e, imageMask: mask } : e));
      saveCodexEntries(worldId, next);
      return { codexEntriesByWorldId: { ...s.codexEntriesByWorldId, [worldId]: next } };
    });
  },

  removeEntry: (worldId, entryId) => {
    set((s) => {
      const prev = s.codexEntriesByWorldId[worldId] ?? [];
      const idx = prev.findIndex((e) => e.id === entryId);
      if (idx === -1) return {};
      const next = prev.filter((e) => e.id !== entryId);
      saveCodexEntries(worldId, next);
      const len = next.length;
      let activeIndex = s.activeIndex;
      if (len === 0) activeIndex = 0;
      else if (activeIndex >= len) activeIndex = len - 1;
      else if (idx < activeIndex) activeIndex = activeIndex - 1;
      return {
        codexEntriesByWorldId: { ...s.codexEntriesByWorldId, [worldId]: next },
        activeIndex,
      };
    });
  },

  goNext: () => {
    const { codexContextWorldId, activeIndex, codexEntriesByWorldId } = get();
    if (!codexContextWorldId) return;
    const list = codexEntriesByWorldId[codexContextWorldId] ?? [];
    if (list.length < 2) return;
    set({
      activeIndex: (activeIndex + 1) % list.length,
      slideDir: 1,
    });
  },

  goPrev: () => {
    const { codexContextWorldId, activeIndex, codexEntriesByWorldId } = get();
    if (!codexContextWorldId) return;
    const list = codexEntriesByWorldId[codexContextWorldId] ?? [];
    if (list.length < 2) return;
    set({
      activeIndex: (activeIndex - 1 + list.length) % list.length,
      slideDir: -1,
    });
  },

  setShowAddForm: (v) => set({ showAddForm: v }),

  setCodexViewMode: (mode) =>
    set({
      codexViewMode: mode,
      codexArchiveEntryId: null,
    }),

  openCodexArchiveEntry: (entryId) => set({ codexArchiveEntryId: entryId }),

  closeCodexArchiveEntry: () => set({ codexArchiveEntryId: null }),

  goCodexBrowseToEntryId: (worldId, entryId) => {
    const list = get().codexEntriesByWorldId[worldId] ?? [];
    const idx = list.findIndex((e) => e.id === entryId);
    if (idx === -1) {
      set({ codexArchiveEntryId: null, codexViewMode: "browse" });
      return;
    }
    set({
      activeIndex: idx,
      codexViewMode: "browse",
      codexArchiveEntryId: null,
      slideDir: 1,
    });
  },

  purgeWorldCodex: (worldId) => {
    clearCodexStorage(worldId);
    set((s) => {
      const { [worldId]: _removed, ...rest } = s.codexEntriesByWorldId;
      void _removed;
      const closing = s.codexContextWorldId === worldId;
      return {
        codexEntriesByWorldId: rest,
        isCodexOpen: closing ? false : s.isCodexOpen,
        codexContextWorldId: closing ? null : s.codexContextWorldId,
        showAddForm: closing ? false : s.showAddForm,
        activeIndex: closing ? 0 : s.activeIndex,
        codexArchiveEntryId: closing ? null : s.codexArchiveEntryId,
        codexViewMode: closing ? "browse" : s.codexViewMode,
      };
    });
  },
}));
