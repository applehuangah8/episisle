/**
 * Unified backup / restore for local-only Epis isle data.
 * — Quick Focus: default `epis-isle-v1` blob
 * — Immersive: per-world Focus snapshot + identity slice + Codex list
 */

import { saveCodexEntries } from "./codex/codexStorage";
import type { CodexEntry } from "./codex/codexTypes";
import { useEpisCodexStore } from "./codex/episCodexStore";
import type { AuraWorldMeta } from "./auraWorldIdentity";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";
import { useStore } from "@/store/useStore";

export const IMMERSIVE_WORLD_BACKUP_SCHEMA = "epis-isle-immersive-world-bundle-v1" as const;
export const QUICK_FOCUS_BACKUP_SCHEMA = "epis-isle-quick-focus-bundle-v1" as const;

const IDENTITY_LS_KEY = "epis-aura-world-identity-v1";
const QUICK_FOCUS_LS_KEY = "epis-isle-v1";

function focusWorldLsKey(worldId: string): string {
  return `epis-isle-world-${worldId}`;
}

type IdentityPersistShape = {
  state?: {
    worldMetaById?: Partial<Record<string, AuraWorldMeta>>;
    namingGateDoneByWorldId?: Partial<Record<string, boolean>>;
  };
  version?: number;
};

function parseLsJson<T>(raw: string | null): T | null {
  if (raw == null || raw === "") return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export type ImmersiveWorldBackupPayload = {
  schema: typeof IMMERSIVE_WORLD_BACKUP_SCHEMA;
  worldId: string;
  exportedAt: number;
  /** Raw Zustand JSON for `epis-isle-world-{worldId}` (stringified StorageValue or plain state). */
  focusWorldRaw: string | null;
  worldMeta: AuraWorldMeta | null;
  namingGateDone: boolean | null;
  codexEntries: CodexEntry[];
};

export type QuickFocusBackupPayload = {
  schema: typeof QUICK_FOCUS_BACKUP_SCHEMA;
  exportedAt: number;
  /** Full localStorage value for epis-isle-v1 (verbatim string). */
  quickFocusRaw: string | null;
};

export function exportImmersiveWorldBackup(worldId: string): string {
  const focusWorldRaw = localStorage.getItem(focusWorldLsKey(worldId));

  let worldMeta: AuraWorldMeta | null = null;
  let namingGateDone: boolean | null = null;
  const idBlob = parseLsJson<IdentityPersistShape>(localStorage.getItem(IDENTITY_LS_KEY));
  const st = idBlob?.state;
  if (st) {
    worldMeta = st.worldMetaById?.[worldId] ?? null;
    namingGateDone = st.namingGateDoneByWorldId?.[worldId] ?? null;
  }

  const codexRaw = localStorage.getItem(`epis-codex-${worldId}`);
  let codexEntries: CodexEntry[] = [];
  if (codexRaw) {
    try {
      const arr = JSON.parse(codexRaw) as unknown;
      if (Array.isArray(arr)) codexEntries = arr as CodexEntry[];
    } catch {
      /* ignore */
    }
  }

  const payload: ImmersiveWorldBackupPayload = {
    schema: IMMERSIVE_WORLD_BACKUP_SCHEMA,
    worldId,
    exportedAt: Date.now(),
    focusWorldRaw,
    worldMeta,
    namingGateDone,
    codexEntries,
  };
  return JSON.stringify(payload, null, 2);
}

function mergeIdentityWorldRow(
  worldId: string,
  worldMeta: AuraWorldMeta | null,
  namingGateDone: boolean | null,
): void {
  const raw = localStorage.getItem(IDENTITY_LS_KEY);
  const idBlob = parseLsJson<IdentityPersistShape>(raw) ?? { state: { worldMetaById: {}, namingGateDoneByWorldId: {} }, version: 2 };
  const state = idBlob.state ?? { worldMetaById: {}, namingGateDoneByWorldId: {} };
  const worldMetaById = { ...state.worldMetaById };
  const namingGateDoneByWorldId = { ...state.namingGateDoneByWorldId };

  if (worldMeta != null) {
    worldMetaById[worldId] = { ...worldMetaById[worldId], ...worldMeta };
  }
  if (namingGateDone != null) {
    namingGateDoneByWorldId[worldId] = namingGateDone;
  }

  const next: IdentityPersistShape = {
    state: { worldMetaById, namingGateDoneByWorldId },
    version: idBlob.version ?? 2,
  };
  localStorage.setItem(IDENTITY_LS_KEY, JSON.stringify(next));
}

export function importImmersiveWorldBackup(
  json: string,
  opts?: { expectedWorldId?: string },
): { ok: true } | { ok: false; error: string } {
  let data: ImmersiveWorldBackupPayload;
  try {
    data = JSON.parse(json) as ImmersiveWorldBackupPayload;
  } catch {
    return { ok: false, error: "檔案不是有效的 JSON。" };
  }
  if (data.schema !== IMMERSIVE_WORLD_BACKUP_SCHEMA || typeof data.worldId !== "string") {
    return { ok: false, error: "這不是沉浸式小島備份檔，或版本不相容。" };
  }
  const wid = data.worldId;
  if (opts?.expectedWorldId != null && opts.expectedWorldId !== wid) {
    return { ok: false, error: "此備份屬於另一座小島，請在對應的島上驗證還原。" };
  }

  if (data.focusWorldRaw != null && data.focusWorldRaw !== "") {
    try {
      JSON.parse(data.focusWorldRaw);
      localStorage.setItem(focusWorldLsKey(wid), data.focusWorldRaw);
    } catch {
      return { ok: false, error: "專注畫布備份資料格式錯誤。" };
    }
  }

  mergeIdentityWorldRow(wid, data.worldMeta, data.namingGateDone);

  if (Array.isArray(data.codexEntries)) {
    saveCodexEntries(wid, data.codexEntries);
    useEpisCodexStore.setState((s) => ({
      codexEntriesByWorldId: {
        ...s.codexEntriesByWorldId,
        [wid]: [...data.codexEntries].sort((a, b) => a.createdAt - b.createdAt),
      },
    }));
  }

  void Promise.all([
    Promise.resolve(useAuraWorldSelection.persist.rehydrate()),
    Promise.resolve(useStore.persist.rehydrate()),
  ]);

  return { ok: true };
}

export function exportQuickFocusBackup(): string {
  const payload: QuickFocusBackupPayload = {
    schema: QUICK_FOCUS_BACKUP_SCHEMA,
    exportedAt: Date.now(),
    quickFocusRaw: localStorage.getItem(QUICK_FOCUS_LS_KEY),
  };
  return JSON.stringify(payload, null, 2);
}

export function importQuickFocusBackup(json: string): { ok: true } | { ok: false; error: string } {
  let data: QuickFocusBackupPayload;
  try {
    data = JSON.parse(json) as QuickFocusBackupPayload;
  } catch {
    return { ok: false, error: "檔案不是有效的 JSON。" };
  }
  if (data.schema !== QUICK_FOCUS_BACKUP_SCHEMA) {
    return { ok: false, error: "這不是 Quick 專注路徑備份檔。" };
  }
  if (data.quickFocusRaw == null || data.quickFocusRaw === "") {
    return { ok: false, error: "備份檔沒有資料。" };
  }
  try {
    JSON.parse(data.quickFocusRaw);
    localStorage.setItem(QUICK_FOCUS_LS_KEY, data.quickFocusRaw);
  } catch {
    return { ok: false, error: "備份內容格式錯誤。" };
  }
  void useStore.persist.rehydrate();
  return { ok: true };
}
