/** Downtown IG 網格容器 id；`Placement.parentContainerId` 對應此值表示收納於面板網格內 */
export const DOWNTOWN_IG_CONTAINER_ID = "downtown-ig";

/** Downtown YouTube 規劃格容器（與 IG 格分離，槽位索引各自獨立） */
export const DOWNTOWN_YT_CONTAINER_ID = "downtown-yt";

/** Downtown 空白模式迷你畫布 */
export const DOWNTOWN_BLANK_CONTAINER_ID = "downtown-blank";

const BLANK_SURFACE = "[data-epis-downtown-blank-surface]";

export function findDowntownBlankSurfaceAtClient(clientX: number, clientY: number): boolean {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return false;
  return Boolean(el.closest(BLANK_SURFACE));
}

/** 游標是否在空白畫布「地板」上（用於拖放進入，避免誤判外層） */
export function isPointerOverDowntownBlankFloor(clientX: number, clientY: number): boolean {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return false;
  return Boolean(el.closest("[data-epis-downtown-blank-floor]"));
}

/** 網格內積木在 store 中的預設像素尺寸（畫布上仍以 100% 填滿 slot；較大以利拖移與放回主畫布） */
export const DOWNTOWN_SLOT_PX = 168;

/** IG／YT 規劃格面板：可拖移、右下角改寬（高度隨內容） */
export const DOWNTOWN_PLAN_FRAME_MIN_WIDTH_PX = 280;
export const DOWNTOWN_PLAN_FRAME_MAX_WIDTH_PX = 960;
export const DOWNTOWN_PLAN_FRAME_DEFAULT_WIDTH_PX = 420;

export function findDowntownSlotIndexAtClient(clientX: number, clientY: number): number | null {
  const hit = findDowntownSlotIndexAndGridAtClient(clientX, clientY);
  return hit?.index ?? null;
}

/** 用於空白畫布拖回規劃格時判斷落在 IG 或 YT 哪一張網格 */
export function findDowntownSlotIndexAndGridAtClient(
  clientX: number,
  clientY: number
): { index: number; grid: "ig" | "yt" } | null {
  const selectors = [
    ["[data-epis-downtown-ig-root]", "ig"],
    ["[data-epis-downtown-yt-root]", "yt"],
  ] as const;
  for (const [sel, grid] of selectors) {
    const root = document.querySelector(sel);
    if (!(root instanceof HTMLElement)) continue;
    const nodes = root.querySelectorAll("[data-epis-downtown-slot]");
    for (const node of nodes) {
      if (!(node instanceof HTMLElement)) continue;
      const r = node.getBoundingClientRect();
      if (
        clientX >= r.left &&
        clientX <= r.right &&
        clientY >= r.top &&
        clientY <= r.bottom
      ) {
        const raw = node.dataset.slotIndex;
        if (raw == null) continue;
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) return { index: n, grid };
      }
    }
  }
  return null;
}

export function isClientPointOverCanvasSurface(
  clientX: number,
  clientY: number,
  marginPx = 0
): boolean {
  const el = document.querySelector("[data-epis-canvas-surface]");
  if (!(el instanceof HTMLElement)) return false;
  const r = el.getBoundingClientRect();
  const m = marginPx;
  return (
    clientX >= r.left - m &&
    clientX <= r.right + m &&
    clientY >= r.top - m &&
    clientY <= r.bottom + m
  );
}

export function portalAbsorbsClientPoint(
  clientX: number,
  clientY: number,
  margin = 56
): boolean {
  const portal = document.querySelector("[data-epis-musee-portal]");
  if (!(portal instanceof HTMLElement)) return false;
  const pr = portal.getBoundingClientRect();
  return (
    clientX >= pr.left - margin &&
    clientX <= pr.right + margin &&
    clientY >= pr.top - margin &&
    clientY <= pr.bottom + margin
  );
}
