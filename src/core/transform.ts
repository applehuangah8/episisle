import type {
  Block,
  DistrictType,
  DistrictZoneHint,
  Placement,
  RenderBlock,
  WorldRect,
} from "./types";

const DEFAULT_WIDTH = 280;
const DEFAULT_HEIGHT = 220;

export function placementToRect(placement: Placement): WorldRect {
  return {
    x: placement.position.x,
    y: placement.position.y,
    width: placement.ui?.width ?? DEFAULT_WIDTH,
    height: placement.ui?.height ?? DEFAULT_HEIGHT,
  };
}

/**
 * Placement + Block → 畫布 RenderBlock（轉譯引擎）。
 */
export function toRenderBlock(
  block: Block,
  placement: Placement,
  districtHint?: DistrictZoneHint
): RenderBlock {
  return {
    placement,
    block,
    rect: placementToRect(placement),
    districtHint,
  };
}

/** 世界座標矩形 → CSS transform（左上為原點） */
export function rectToTranslate(rect: Pick<WorldRect, "x" | "y">): string {
  return `translate3d(${rect.x}px, ${rect.y}px, 0)`;
}

function blockHasNextModule(block: Block): boolean {
  return block.modules.some((m) => m.type === "next" || m.type === "schedule");
}

/**
 * 將舊版 `schedule` 模組轉為 `next` 文字欄。
 */
export function normalizeBlockModules(block: Block): Block {
  const modules = block.modules.map((m): Block["modules"][number] => {
    if (m.type === "schedule") {
      const start = (m as { start?: number }).start;
      let text = "";
      if (start != null && !Number.isNaN(start)) {
        try {
          text = new Date(start).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch {
          /* ignore */
        }
      }
      return { type: "next", text };
    }
    return m;
  });
  return { ...block, modules };
}

/**
 * 切換 `Placement.district` 時的領域轉譯（由 store `setDistrict` 呼叫）。
 *
 * - **instagram / youtube**：若尚無 `next` 模組，補上一筆；IG 時可將 `lifecycle` 調為 `planned`。
 * - **其餘 district**：不強制改動模組；仍更新 `updatedAt` 以反映最近一次 district 指派。
 */
export function transformBlockForDistrict(block: Block, district: DistrictType): Block {
  const now = Date.now();

  if (district === "neutral") {
    return { ...block, updatedAt: now };
  }

  if (
    (district === "instagram" || district === "youtube") &&
    !blockHasNextModule(block)
  ) {
    return {
      ...block,
      lifecycle: district === "instagram" ? "planned" : block.lifecycle,
      updatedAt: now,
      modules: [...block.modules, { type: "next", text: "" }],
    };
  }

  return {
    ...block,
    updatedAt: now,
  };
}
