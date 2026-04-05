import type { BlockID, MuseeChannel, MuseeEntry } from "./types";

/**
 * ## Musee 封存與 `musee` 連動規則
 *
 * 1. **主畫布可見性**：凡 `blockId` 作為鍵出現在 `musee`（`Record<blockId, MuseeEntry>`）中，該區塊的**所有** `Placement` 皆不於主畫布渲染（與 `district` 無關；不依賴 `placement.ui.hidden`）。
 * 2. **封存寫入**：寫入 `musee[blockId]`（`archivedAt` 為當下時間）；同一 `blockId` 僅一筆（Record 鍵即保證；重複封存視為覆寫 `archivedAt`）。
 * 3. **領域同步**：封存時將對應 `Block.lifecycle` 設為 `archived`，並更新 `updatedAt`。
 * 4. **館藏 UI**：以 `musee` 的值陣列為來源，自 `blocks` 讀取完整 `Block`；列表依 `archivedAt` 新→舊排序。
 * 5. **還原到主畫布**：刪除 `musee[blockId]`，並將 `Block.lifecycle` 設為 `developing`。
 * 6. **選取狀態**：若當前選中的 `Placement` 所屬 `blockId` 被封存，清除 `selectedPlacementId`。
 *
 * （與早期陣列欄位 `museeArchive` 語意相同，僅儲存形狀改為 Record。）
 */

export type MuseeIndex = Record<BlockID, MuseeEntry>;

export function archivedBlockIdSet(musee: MuseeIndex): Set<BlockID> {
  return new Set(Object.keys(musee));
}

/** 舊資料無 `channel` 時視為典籍封存 */
export function normalizeMuseeEntry(entry: MuseeEntry): MuseeEntry & { channel: MuseeChannel } {
  const channel: MuseeChannel = entry.channel === "musee" ? "musee" : "archive";
  return { ...entry, channel };
}

export function sortMuseeEntriesNewestFirst(musee: MuseeIndex): MuseeEntry[] {
  return Object.values(musee)
    .map(normalizeMuseeEntry)
    .sort((a, b) => b.archivedAt - a.archivedAt);
}

export function sortMuseeEntriesByChannel(
  musee: MuseeIndex,
  channel: MuseeChannel
): MuseeEntry[] {
  return sortMuseeEntriesNewestFirst(musee).filter((e) => e.channel === channel);
}
