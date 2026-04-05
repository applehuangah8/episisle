import type { Viewport } from "@/store/useStore";

/** 與 `transform.ts` 預設 placement 尺寸一致，供「中心對齊」放置 */
export const DEFAULT_BLOCK_PLACEMENT_WIDTH = 280;
export const DEFAULT_BLOCK_PLACEMENT_HEIGHT = 220;

/** 主畫布／Downtown 內積木 placement 寬高可調範圍（世界座標／邏輯 px） */
export const PLACEMENT_WIDTH_MIN = 160;
export const PLACEMENT_WIDTH_MAX = 640;
export const PLACEMENT_HEIGHT_MIN = 100;
export const PLACEMENT_HEIGHT_MAX = 560;

/**
 * 畫布 surface 元素內的局部座標（左上為 0,0）→ 世界座標。
 */
export function canvasLocalToWorld(
  localX: number,
  localY: number,
  viewport: Viewport
): { x: number; y: number } {
  const { x: vx, y: vy, scale } = viewport;
  const s = scale > 1e-6 ? scale : 1;
  return {
    x: (localX - vx) / s,
    y: (localY - vy) / s,
  };
}

/**
 * 取得目前視窗中「畫布可視區中心」對應的世界座標，並可選擇回傳積木左上角（使積木幾何中心落在該點）。
 */
/**
 * 螢幕 client 座標（相對視窗）＋畫布 surface 元素 → 世界座標。
 */
export function clientToWorldFromCanvasElement(
  clientX: number,
  clientY: number,
  canvasEl: HTMLElement,
  viewport: Viewport
): { x: number; y: number } {
  const r = canvasEl.getBoundingClientRect();
  const localX = clientX - r.left;
  const localY = clientY - r.top;
  return canvasLocalToWorld(localX, localY, viewport);
}

export function getWorldPointAtCanvasCenter(
  canvasEl: HTMLElement,
  viewport: Viewport,
  options?: { centerBlock?: boolean }
): { x: number; y: number } {
  const r = canvasEl.getBoundingClientRect();
  const cx = r.width / 2;
  const cy = r.height / 2;
  const world = canvasLocalToWorld(cx, cy, viewport);
  if (!options?.centerBlock) return world;
  return {
    x: world.x - DEFAULT_BLOCK_PLACEMENT_WIDTH / 2,
    y: world.y - DEFAULT_BLOCK_PLACEMENT_HEIGHT / 2,
  };
}

/** Downtown 空白迷你畫布：viewport 內螢幕座標 → 畫布內容座標（與 translate + scale 一致） */
export function clientToDowntownBlankWorld(
  clientX: number,
  clientY: number,
  viewportEl: HTMLElement,
  canvasPosition: { x: number; y: number },
  contentScale: number
): { x: number; y: number } {
  const r = viewportEl.getBoundingClientRect();
  const lx = clientX - r.left;
  const ly = clientY - r.top;
  const s = contentScale > 1e-6 ? contentScale : 1;
  return {
    x: (lx - canvasPosition.x) / s,
    y: (ly - canvasPosition.y) / s,
  };
}
