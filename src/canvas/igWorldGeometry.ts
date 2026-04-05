import type { DistrictZoneDefinition, WorldRect } from "@/core/types";

import { isWorldPointInRect } from "@/canvas/worldDistrictHitTest";

/** 畫布世界座標中的 IG 容器寬度（px） */
export const IG_WORLD_CONTAINER_WIDTH_PX = 1200;

export const IG_PAD = 12;
export const IG_GRID_GAP = 2;
export const IG_HEADER_H = 24;
export const IG_STORY_H = 52;
export const IG_STORY_GAP = 8;
export const IG_FOOTER_H = 32;

export function computeIgGridMetrics(slotCount: number) {
  const innerW = IG_WORLD_CONTAINER_WIDTH_PX - IG_PAD * 2;
  const cell = (innerW - IG_GRID_GAP * 2) / 3;
  const rows = Math.ceil(slotCount / 3);
  const gridH = rows > 0 ? rows * cell + (rows - 1) * IG_GRID_GAP : 0;
  const totalH =
    IG_PAD +
    IG_HEADER_H +
    IG_STORY_GAP +
    IG_STORY_H +
    IG_STORY_GAP +
    gridH +
    IG_FOOTER_H +
    IG_PAD;
  return { innerW, cell, rows, gridH, totalH };
}

/** IG 正方形格 vs YouTube 16:9 格 */
export function computeTownPlannerMetrics(
  slotCount: number,
  hubMode: "instagram" | "youtube"
) {
  const innerW = IG_WORLD_CONTAINER_WIDTH_PX - IG_PAD * 2;
  const cellW = (innerW - IG_GRID_GAP * 2) / 3;
  const cellH = hubMode === "youtube" ? cellW * (9 / 16) : cellW;
  const rows = Math.ceil(slotCount / 3);
  const gridH = rows > 0 ? rows * cellH + (rows - 1) * IG_GRID_GAP : 0;
  const totalH =
    IG_PAD +
    IG_HEADER_H +
    IG_STORY_GAP +
    IG_STORY_H +
    IG_STORY_GAP +
    gridH +
    IG_FOOTER_H +
    IG_PAD;
  return { innerW, cellW, cellH, rows, gridH, totalH };
}

export function getIgGridLayoutWorld(zones: DistrictZoneDefinition[], slotCount: number) {
  const ig = zones.find((z) => z.id === "instagram");
  if (!ig) throw new Error("instagram zone missing");
  const { innerW, cell, rows, gridH, totalH } = computeIgGridMetrics(slotCount);
  const containerLeft = ig.x;
  const containerTop = ig.y;
  const gridLeft = containerLeft + IG_PAD;
  const gridTop =
    containerTop + IG_PAD + IG_HEADER_H + IG_STORY_GAP + IG_STORY_H + IG_STORY_GAP;
  return {
    containerLeft,
    containerTop,
    gridLeft,
    gridTop,
    innerW,
    cell,
    rows,
    gridH,
    totalH,
    slotCount,
  };
}

export function getIgContainerOuterWorldRect(
  zones: DistrictZoneDefinition[],
  slotCount: number
): WorldRect {
  const L = getIgGridLayoutWorld(zones, slotCount);
  return {
    x: L.containerLeft,
    y: L.containerTop,
    width: IG_WORLD_CONTAINER_WIDTH_PX,
    height: L.totalH,
  };
}

/** 世界座標點落在第幾格（0-based），不在任何格內則 null */
export function findIgSlotIndexAtWorldPoint(
  wx: number,
  wy: number,
  slotCount: number,
  zones: DistrictZoneDefinition[]
): number | null {
  const g = getIgGridLayoutWorld(zones, slotCount);
  for (let i = 0; i < slotCount; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const sx = g.gridLeft + col * (g.cell + IG_GRID_GAP);
    const sy = g.gridTop + row * (g.cell + IG_GRID_GAP);
    if (wx >= sx && wx <= sx + g.cell && wy >= sy && wy <= sy + g.cell) {
      return i;
    }
  }
  return null;
}

export function isWorldPointInsideIgContainer(
  wx: number,
  wy: number,
  slotCount: number,
  zones: DistrictZoneDefinition[]
): boolean {
  const r = getIgContainerOuterWorldRect(zones, slotCount);
  return isWorldPointInRect(wx, wy, r);
}

/** IG 格內拖曳偏移（世界 px）下，積木幾何中心的世界座標 */
export function igDockedBlockCenterWorld(
  gridIndex: number,
  offsetX: number,
  offsetY: number,
  slotCount: number,
  zones: DistrictZoneDefinition[]
): { cwx: number; cwy: number } {
  const L = getIgGridLayoutWorld(zones, slotCount);
  const row = Math.floor(gridIndex / 3);
  const col = gridIndex % 3;
  const sx = L.gridLeft + col * (L.cell + IG_GRID_GAP);
  const sy = L.gridTop + row * (L.cell + IG_GRID_GAP);
  return {
    cwx: sx + L.cell / 2 + offsetX,
    cwy: sy + L.cell / 2 + offsetY,
  };
}
