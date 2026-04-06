import type { AppMode } from "@/isle/types";

/**
 * Travel HUD rows: navigable experience layers (not “isle A/B” product naming).
 */
export type ExperienceDestinationKey = "worldFocus" | "auraWorld" | "locked";

export type ExperienceDestinationRow = {
  key: ExperienceDestinationKey;
  /** Navigable target mode; null = not available */
  mode: AppMode | null;
  title: string;
  subtitle: string;
};

export const EXPERIENCE_DESTINATIONS: ExperienceDestinationRow[] = [
  {
    key: "worldFocus",
    mode: "worldFocus",
    title: "專注",
    subtitle: "瞬時傳送",
  },
  {
    key: "auraWorld",
    mode: "auraWorld",
    title: "Aura",
    subtitle: "秘境探索",
  },
  { key: "locked", mode: null, title: "未知", subtitle: "尚未解鎖" },
];

/** @deprecated use EXPERIENCE_DESTINATIONS */
export const ISLE_DESTINATIONS = EXPERIENCE_DESTINATIONS;

export const ENTRY_PATH_COPY = {
  title: "地圖",
  subtitle: "回到旅程開始畫面",
} as const;

/** @deprecated use ENTRY_PATH_COPY */
export const SELECTOR_COPY = ENTRY_PATH_COPY;

/** @deprecated use ExperienceDestinationKey */
export type IsleDestinationKey = ExperienceDestinationKey;
/** @deprecated use ExperienceDestinationRow */
export type IsleDestinationRow = ExperienceDestinationRow;
