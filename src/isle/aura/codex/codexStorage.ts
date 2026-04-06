import type { CodexEntry } from "./codexTypes";
import { isCodexImageMask } from "./codexTypes";

const STORAGE_KEY = (worldId: string) => `epis-codex-${worldId}`;

const CODEX_IMAGE_SLOT_LABEL_KEY = (worldId: string) => `epis-codex-imageSlotLabel-${worldId}`;

/** Remove persisted codex entries + overlay prefs for one world only. */
export function clearCodexStorage(worldId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY(worldId));
    window.localStorage.removeItem(CODEX_IMAGE_SLOT_LABEL_KEY(worldId));
  } catch {
    /* quota / private mode */
  }
}

export function loadCodexEntries(worldId: string): CodexEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(worldId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is CodexEntry => {
      if (row == null || typeof row !== "object") return false;
      const r = row as CodexEntry;
      return (
        typeof r.id === "string" &&
        typeof r.worldId === "string" &&
        typeof r.title === "string" &&
        typeof r.description === "string" &&
        typeof r.createdAt === "number" &&
        (r.category === undefined || typeof r.category === "string") &&
        (r.imageMask === undefined || isCodexImageMask(r.imageMask))
      );
    });
  } catch {
    return [];
  }
}

export function saveCodexEntries(worldId: string, entries: CodexEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY(worldId), JSON.stringify(entries));
  } catch {
    /* quota / private mode */
  }
}
