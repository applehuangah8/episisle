import type { AppMode } from "@/isle/types";

/**
 * Travel HUD rows: navigable experience layers (not “isle A/B” product naming).
 */
export type IsleDestinationKey = "worldFocus" | "auraWorld" | "rePickIsland" | "locked";

export type IsleDestinationRow = {
  key: IsleDestinationKey;
  /** Navigable target mode; null = not available (unless `action` is set) */
  mode: AppMode | null;
  title: string;
  subtitle: string;
  /** Immersive-only: leave entered world and return to archipelago map. */
  action?: "rePickIsland";
};

export const ISLE_DESTINATIONS: IsleDestinationRow[] = [
  {
    key: "worldFocus",
    mode: "worldFocus",
    title: "專注",
    subtitle: "瞬時進入工作臺",
  },
  {
    key: "auraWorld",
    mode: "auraWorld",
    title: "世界",
    subtitle: "沉浸探索",
  },
  {
    key: "rePickIsland",
    mode: null,
    title: "再次選島",
    subtitle: "回到群島地圖重選世界",
    action: "rePickIsland",
  },
  { key: "locked", mode: null, title: "未知", subtitle: "尚未解鎖" },
];

/** in-world 子模式（AppMode 仍為 auraWorld）— 航線列表標題字串。 */
export function getImmersiveTravelLabels(input: {
  entryReady: boolean;
  viewMode: "aura" | "focus" | null;
}): { title: string; subtitle: string } {
  if (!input.entryReady || input.viewMode == null) {
    return { title: "世界", subtitle: "沉浸體驗" };
  }
  if (input.viewMode === "focus") {
    return { title: "Focus", subtitle: "專注模式" };
  }
  return { title: "探索", subtitle: "漫遊與圖鑑預覽" };
}

export const SELECTOR_COPY = {
  title: "回主頁",
  subtitle: "回到旅程開始畫面",
} as const;

/** @deprecated use ISLE_DESTINATIONS */
export const EXPERIENCE_DESTINATIONS = ISLE_DESTINATIONS;
/** @deprecated use SELECTOR_COPY */
export const ENTRY_PATH_COPY = SELECTOR_COPY;
/** @deprecated use IsleDestinationKey */
export type ExperienceDestinationKey = IsleDestinationKey;
/** @deprecated use IsleDestinationRow */
export type ExperienceDestinationRow = IsleDestinationRow;
