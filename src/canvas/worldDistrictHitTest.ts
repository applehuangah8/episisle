import { DEFAULT_DISTRICT_ZONES } from "@/canvas/districtLayout";
import type {
  DistrictType,
  DistrictZoneDefinition,
  DistrictZoneHint,
  WorldRect,
} from "@/core/types";

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

/**
 * 嚴格矩形未命中時的回退（僅在無法取得世界座標時使用）。
 * 預設仍為 wild；有座標時請改 {@link districtTypeForPlacementRect}。
 */
export function districtTypeFromZoneHint(hint: DistrictZoneHint): DistrictType {
  return hint === "neutral" ? "wild" : hint;
}

/** 窄縫（例如 Town 底緣與 Studio 頂之間、或大積木中心落在矩形外）用輕微外擴再判，避免 neutral 一律變 wild 誤判成野域卡 */
const NEUTRAL_RESOLVE_PAD_WORLD_PX = 64;

export function resolveDistrictTypeFromNeutralAtPoint(
  hint: DistrictZoneHint,
  worldX: number,
  worldY: number,
  zones: DistrictZoneDefinition[]
): DistrictType {
  if (hint !== "neutral") return hint;
  const pad = NEUTRAL_RESOLVE_PAD_WORLD_PX;
  for (const id of HIT_PRIORITY) {
    const z = zones.find((zz) => zz.id === id);
    if (!z) continue;
    const inside =
      worldX >= z.x - pad &&
      worldX <= z.x + z.width + pad &&
      worldY >= z.y - pad &&
      worldY <= z.y + z.height + pad;
    if (inside) return z.id;
  }
  return "wild";
}

export function districtTypeForPlacementRect(
  rect: { x: number; y: number; width: number; height: number },
  zones: DistrictZoneDefinition[]
): DistrictType {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const hint = hitTestDistrictsAtWorldPoint(cx, cy, zones);
  return resolveDistrictTypeFromNeutralAtPoint(hint, cx, cy, zones);
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

const isTownDistrict = (d: DistrictType): boolean => d === "instagram" || d === "youtube";

/**
 * 拖曳時 Wild 與 Town（IG/YT）邊界極窄且矩形重疊，中心點微移會在兩區之間來回判斷，
 * 造成 district 狂切換、外殼與翻面卡不斷 remount。用世界座標遲滯：要進 Town 需中心再偏東一截仍為 Town；
 * 要進 Wild 需再偏西一截仍為 Wild。放開時用 {@link districtTypeForPlacementRect} 與嚴格命中校正。
 */
export function districtTypeFromRectWithDragHysteresis(
  rect: { x: number; y: number; width: number; height: number },
  zones: DistrictZoneDefinition[],
  currentDistrict: DistrictType,
  hysteresisWorldPx: number = 40
): DistrictType {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const raw = districtTypeForPlacementRect(rect, zones);
  if (raw === currentDistrict) return currentDistrict;

  if (currentDistrict === "wild" && isTownDistrict(raw)) {
    const dcx = cx + hysteresisWorldPx;
    const dHint = hitTestDistrictsAtWorldPoint(dcx, cy, zones);
    const deeper = resolveDistrictTypeFromNeutralAtPoint(dHint, dcx, cy, zones);
    return isTownDistrict(deeper) ? deeper : "wild";
  }
  if (isTownDistrict(currentDistrict) && raw === "wild") {
    const dcx = cx - hysteresisWorldPx;
    const dHint = hitTestDistrictsAtWorldPoint(dcx, cy, zones);
    const deeper = resolveDistrictTypeFromNeutralAtPoint(dHint, dcx, cy, zones);
    return deeper === "wild" ? "wild" : currentDistrict;
  }

  return raw;
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
