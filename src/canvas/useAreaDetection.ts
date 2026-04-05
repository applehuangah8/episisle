import { useCallback, useMemo } from "react";

import { DEFAULT_DISTRICT_ZONES } from "@/canvas/districtLayout";
import {
  detectDistrictForRectCenterWorld,
  hitTestDistrictsAtWorldPoint,
  resolveDistrictAtWorldPoint as resolveAtPoint,
} from "@/canvas/worldDistrictHitTest";
import type { DistrictZoneDefinition, DistrictZoneHint } from "@/core/types";
import { useStore as useEpisStore } from "@/store/useStore";

export { DEFAULT_DISTRICT_ZONES } from "@/canvas/districtLayout";
export {
  detectDistrictForRectCenterWorld,
  hitTestDistrictsAtWorldPoint,
  isWorldPointInMuseePortalHotspot,
} from "@/canvas/worldDistrictHitTest";

export type WorldPoint = { x: number; y: number };

/** @deprecated 請使用 `hitTestDistrictsAtWorldPoint` */
export function hitTestDistrictRects(
  worldX: number,
  worldY: number,
  zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES
): DistrictZoneHint {
  return hitTestDistrictsAtWorldPoint(worldX, worldY, zones);
}

export function resolveDistrictAtWorldPoint(
  worldX: number,
  worldY: number,
  zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES
): DistrictZoneHint {
  return resolveAtPoint(worldX, worldY, zones);
}

export function detectDistrictAt(
  worldX: number,
  worldY: number,
  zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES
): DistrictZoneHint {
  return resolveAtPoint(worldX, worldY, zones);
}

export interface AreaDetectionApi {
  zones: DistrictZoneDefinition[];
  detectDistrict: (worldX: number, worldY: number) => DistrictZoneHint;
  detectFromPosition: (pos: WorldPoint) => DistrictZoneHint;
  detect: (pos: WorldPoint) => DistrictZoneHint;
  detectDistrictForRectCenter: (rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => DistrictZoneHint;
}

/**
 * 區域偵測使用 Store `worldDistrictZones`（與地景矩形一致，可與單一 WorldContainer 對齊）。
 */
export function useAreaDetection(): AreaDetectionApi {
  const zones = useEpisStore((s) => s.worldDistrictZones);

  const detectDistrict = useCallback(
    (worldX: number, worldY: number) => hitTestDistrictsAtWorldPoint(worldX, worldY, zones),
    [zones]
  );

  const detectFromPosition = useCallback(
    (pos: WorldPoint) => hitTestDistrictsAtWorldPoint(pos.x, pos.y, zones),
    [zones]
  );

  return useMemo(
    () => ({
      zones,
      detectDistrict,
      detectFromPosition,
      detect: detectFromPosition,
      detectDistrictForRectCenter: (rect: {
        x: number;
        y: number;
        width: number;
        height: number;
      }) => detectDistrictForRectCenterWorld(rect, zones),
    }),
    [zones, detectDistrict, detectFromPosition]
  );
}
