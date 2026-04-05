import type { AppMode } from "@/isle/types";

/**
 * Multi-Isle 選單資料源（orchestrator 專用；與 selector 畫面三島對齊，方便擴充 Isle C）。
 */
export type IsleDestinationKey = "focus" | "aura" | "quiet";

export type IsleDestinationRow = {
  key: IsleDestinationKey;
  /** 可導航時為目標 mode；null 表示尚未開放 */
  mode: AppMode | null;
  title: string;
  subtitle: string;
};

export const ISLE_DESTINATIONS: IsleDestinationRow[] = [
  { key: "focus", mode: "focus", title: "Focus", subtitle: "Isle A · 工作與整理" },
  { key: "aura", mode: "aura", title: "Aura", subtitle: "Isle B · 療癒與創造" },
  { key: "quiet", mode: null, title: "靜域", subtitle: "Isle C · 即將啟航" },
];

export const SELECTOR_COPY = {
  title: "星圖主序",
  subtitle: "回到選島畫面",
} as const;
