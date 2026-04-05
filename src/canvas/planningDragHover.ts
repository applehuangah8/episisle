import { clientToWorldFromCanvasElement } from "@/canvas/viewportMath";
import { hitTestDistrictsAtWorldPoint } from "@/canvas/worldDistrictHitTest";
import { isClientPointInsideDowntownSlotRoot } from "@/canvas/igClientHit";
import { isClientPointOverCanvasSurface } from "@/core/downtown";
import type { DistrictZoneDefinition } from "@/core/types";
import type { Viewport } from "@/store/useStore";

/** 規劃區拖曳浮層邊框：提示游標下方可磁吸的區域 */
export type PlanningDragHoverTint =
  | "neutral"
  | "canvas-wild"
  | "canvas-studio"
  | "canvas-ig"
  | "canvas-yt"
  | "panel-ig"
  | "panel-yt"
  | "blank-canvas";

export function planningDragHoverBorderColor(tint: PlanningDragHoverTint): string {
  switch (tint) {
    case "panel-ig":
    case "panel-yt":
      return "rgba(45, 55, 68, 0.55)";
    case "blank-canvas":
      return "rgba(90, 130, 145, 0.5)";
    case "canvas-wild":
      return "rgba(72, 98, 88, 0.48)";
    case "canvas-studio":
      return "rgba(88, 102, 128, 0.5)";
    case "canvas-ig":
      return "rgba(110, 145, 178, 0.55)";
    case "canvas-yt":
      return "rgba(168, 72, 72, 0.48)";
    default:
      return "rgba(0, 0, 0, 0.1)";
  }
}

export function resolvePlanningDragHoverTint(
  clientX: number,
  clientY: number,
  viewport: Viewport,
  zones: DistrictZoneDefinition[]
): PlanningDragHoverTint {
  const blankVp = document.querySelector("[data-epis-downtown-blank-viewport]");
  if (blankVp instanceof HTMLElement) {
    const r = blankVp.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      return "blank-canvas";
    }
  }
  if (isClientPointInsideDowntownSlotRoot(clientX, clientY, "ig")) return "panel-ig";
  if (isClientPointInsideDowntownSlotRoot(clientX, clientY, "yt")) return "panel-yt";

  const canvasEl = document.querySelector("[data-epis-canvas-surface]");
  if (canvasEl instanceof HTMLElement && isClientPointOverCanvasSurface(clientX, clientY)) {
    const { x: wx, y: wy } = clientToWorldFromCanvasElement(clientX, clientY, canvasEl, viewport);
    const d = hitTestDistrictsAtWorldPoint(wx, wy, zones);
    if (d === "wild") return "canvas-wild";
    if (d === "studio") return "canvas-studio";
    if (d === "instagram") return "canvas-ig";
    if (d === "youtube") return "canvas-yt";
    return "canvas-wild";
  }
  return "neutral";
}
