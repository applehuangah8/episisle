import type { DistrictZoneDefinition, WorldRect } from "@/core/types";

/** 世界空間網格單位（px 世界座標）；背景網格與區域對齊用 */
export const CANVAS_WORLD_GRID = 40;

/**
 * 原野／底色覆蓋範圍（自世界原點 0,0 向四向延伸的半徑 px）。
 * 僅用於視覺滿版，不影響 district 命中矩形。
 */
export const WORLD_INFINITE_HALF_EXTENT_PX = 5200;

/**
 * 與 `App.tsx` 種子 placement 對齊的 district 矩形（世界座標）。
 * 命中順序：見 `worldDistrictHitTest`（Town 子區優先，再 Studio，最後 Wild）。
 */
export const DEFAULT_DISTRICT_ZONES: DistrictZoneDefinition[] = [
  { id: "wild", label: "The Wild", x: -800, y: -400, width: 500, height: 600 },
  { id: "instagram", label: "Creative Town", x: -320, y: -400, width: 700, height: 600 },
  { id: "youtube", label: "YouTube", x: 360, y: -400, width: 460, height: 600 },
  { id: "studio", label: "Studio", x: -480, y: 210, width: 800, height: 420 },
];

export function unionWorldRects(a: WorldRect, b: WorldRect): WorldRect {
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** 視覺「Creative Town」：IG + YT 聯集（細網格僅畫在 IG 子區） */
export function getTownVisualRect(zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES): WorldRect {
  const ig = zones.find((z) => z.id === "instagram");
  const yt = zones.find((z) => z.id === "youtube");
  if (!ig || !yt) return { x: 0, y: 0, width: 1, height: 1 };
  return unionWorldRects(ig, yt);
}

export function getInstagramZone(zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES): DistrictZoneDefinition {
  const z = zones.find((d) => d.id === "instagram");
  if (!z) throw new Error("instagram zone missing");
  return z;
}

export function getWildZone(zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES): DistrictZoneDefinition {
  const z = zones.find((d) => d.id === "wild");
  if (!z) throw new Error("wild zone missing");
  return z;
}

/** 下方 Studio 區（規劃／推進）；靈感博物館為全螢幕畫廊，與此區 id 分離 */
export function getStudioZone(zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES): DistrictZoneDefinition {
  const z = zones.find((d) => d.id === "studio");
  if (!z) throw new Error("studio zone missing");
  return z;
}

/**
 * 涵蓋所有 district 的軸對齊矩形（GRID 倍數），供滿版底網格／可選背景圖使用。
 */
export function getCanvasWorldBackgroundRect(
  zones: DistrictZoneDefinition[] = DEFAULT_DISTRICT_ZONES,
  padGridCells = 6
): WorldRect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const z of zones) {
    minX = Math.min(minX, z.x);
    minY = Math.min(minY, z.y);
    maxX = Math.max(maxX, z.x + z.width);
    maxY = Math.max(maxY, z.y + z.height);
  }
  const pad = CANVAS_WORLD_GRID * padGridCells;
  const g = CANVAS_WORLD_GRID;
  minX = Math.floor((minX - pad) / g) * g;
  minY = Math.floor((minY - pad) / g) * g;
  maxX = Math.ceil((maxX + pad) / g) * g;
  maxY = Math.ceil((maxY + pad) / g) * g;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
