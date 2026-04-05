import { memo } from "react";

import { useStore } from "@/store/useStore";

const ICON_PX = 56;

/**
 * 固定於**畫布 surface** 右下角（不受 WorldContainer 平移／縮放影響），瀏覽器縮放時仍貼齊可視畫布區右下。
 * 投放判定請用 {@link isElementClientOverlappingMuseePortal}。
 */
export const MuseeScreenPortal = memo(function MuseeScreenPortalInner() {
  const viewMode = useStore((s) => s.viewMode);
  const focusMode = useStore((s) => s.focusModeActive);
  if (viewMode !== "main" || focusMode) return null;

  return (
    <div
      data-epis-musee-portal
      className="pointer-events-none absolute bottom-3 right-3 z-[40] select-none"
      aria-label="靈感博物館入口"
      title="拖曳積木至此收入博物館"
    >
      <div
        data-epis-musee-portal-inner
        className="flex items-center justify-center rounded-2xl border border-[rgba(142,180,196,0.38)] bg-[rgba(255,255,255,0.42)] shadow-[0_10px_28px_-8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-[12px]"
        style={{ width: ICON_PX, height: ICON_PX }}
      >
        <span className="text-[1.75rem] leading-none drop-shadow-sm" aria-hidden>
          🏛️
        </span>
      </div>
    </div>
  );
});

/** @deprecated 世界座標版已廢止，請用 MuseeScreenPortal */
export const MuseeWorldPortal = MuseeScreenPortal;
export const MuseePortal = MuseeScreenPortal;
