import { DEFAULT_DISTRICT_ZONES } from "@/canvas/districtLayout";
import type { DistrictZoneDefinition, DistrictZoneHint, WorldRect } from "@/core/types";

/**
 * 與地景層一致：重疊時 Town（IG/YT）優先於 Wild，再 Studio。
 * 必須與 `DistrictLayer` 矩形與 Store `worldDistrictZones` 同步。
 */
const HIT_PRIORITY: DistrictZoneDefinition["id"][] = ["instagram", "youtube", "studio", "wild"];

export function hitTestDistrictsAtWorldPoint(
  worldX: number,
  worldY: number,
  zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES
): DistrictZoneHint {
  for (const id of HIT_PRIORITY) {
    const z = zones.find((zz) => zz.id === id);
    if (!z) continue;
    const inside =
      worldX >= z.x &&
      worldX <= z.x + z.width &&
      worldY >= z.y &&
      worldY <= z.y + z.height;
    if (inside) return z.id;
  }
  return "neutral";
}

export function resolveDistrictAtWorldPoint(
  worldX: number,
  worldY: number,
  zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES
): DistrictZoneHint {
  return hitTestDistrictsAtWorldPoint(worldX, worldY, zones);
}

export function detectDistrictForRectCenterWorld(
  rect: { x: number; y: number; width: number; height: number },
  zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES
): DistrictZoneHint {
  return hitTestDistrictsAtWorldPoint(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    zones
  );
}

export function isWorldPointInRect(wx: number, wy: number, r: WorldRect): boolean {
  return wx >= r.x && wx <= r.x + r.width && wy >= r.y && wy <= r.y + r.height;
}

/** 博物館入口圖示（世界座標）；主畫布投放請用 museePortalClientHit 螢幕矩形判定 */
export const MUSEE_PORTAL_ICON_W = 60;
export const MUSEE_PORTAL_ICON_H = 60;
export const MUSEE_PORTAL_MARGIN = 12;

export function getMuseePortalWorldRect(m: DistrictZoneDefinition): WorldRect {
  return {
    x: m.x + m.width - MUSEE_PORTAL_ICON_W - MUSEE_PORTAL_MARGIN,
    y: m.y + m.height - MUSEE_PORTAL_ICON_H - MUSEE_PORTAL_MARGIN,
    width: MUSEE_PORTAL_ICON_W,
    height: MUSEE_PORTAL_ICON_H,
  };
}

/** 拖放判定用（較寬鬆），避免大積木中心點難對準小圖示 */
export function getMuseePortalDropHitRect(m: DistrictZoneDefinition): WorldRect {
  const r = getMuseePortalWorldRect(m);
  const pad = 48;
  return {
    x: r.x - pad,
    y: r.y - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

export function rectsOverlapWorld(a: WorldRect, b: WorldRect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

export function isWorldRectOverlappingMuseePortalDrop(
  rect: WorldRect,
  zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES
): boolean {
  const m = zones.find((z) => z.id === "studio");
  if (!m) return false;
  return rectsOverlapWorld(rect, getMuseePortalDropHitRect(m));
}

/** 博物館區右下角世界座標熱區（純世界座標，與世界內 Portal 視覺一致） */
export function isWorldPointInMuseePortalHotspot(
  wx: number,
  wy: number,
  zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES
): boolean {
  const m = zones.find((z) => z.id === "studio");
  if (!m) return false;
  return isWorldPointInRect(wx, wy, getMuseePortalDropHitRect(m));
}
