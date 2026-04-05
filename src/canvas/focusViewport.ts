import type { MuseeIndex } from "@/core/museeArchivePolicy";
import {
  type FocusLifecyclePreset,
  type FocusRealm,
  shouldShowPlacementInFocusMode,
} from "@/core/focusMode";
import { placementToRect } from "@/core/transform";
import type { Block, BlockID, Placement, PlacementID } from "@/core/types";
import type { Viewport } from "@/store/useStore";

const MIN_SCALE = 0.25;
const MAX_SCALE = 2.5;

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * 計算 viewport，使所有 placement 包進畫布可視區（含 padding）。
 * 用於初次載入與「回到全覽」。
 */
export function computeViewportToFitPlacements(
  canvasWidth: number,
  canvasHeight: number,
  placements: Record<PlacementID, Placement>,
  options?: { padding?: number; maxScale?: number }
): Viewport {
  const pad = options?.padding ?? 72;
  const maxScaleCap = options?.maxScale ?? 1.05;

  if (canvasWidth <= 0 || canvasHeight <= 0) {
    return { x: 0, y: 0, scale: clampScale(1) };
  }

  const list = Object.values(placements).filter((p) => !p.parentContainerId);
  if (list.length === 0) {
    return {
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      scale: clampScale(1),
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of list) {
    const r = placementToRect(p);
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }

  const bw = Math.max(maxX - minX, 200);
  const bh = Math.max(maxY - minY, 200);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const scaleX = (canvasWidth - 2 * pad) / bw;
  const scaleY = (canvasHeight - 2 * pad) / bh;
  const scale = clampScale(Math.min(scaleX, scaleY, maxScaleCap));

  return {
    x: canvasWidth / 2 - cx * scale,
    y: canvasHeight / 2 - cy * scale,
    scale,
  };
}

/**
 * 專注模式：只框入符合 realm + lifecycle 的畫布上積木（不含 docked、不含收入靈感博物館索引者）。
 */
export function computeViewportToFitFocusSubset(
  canvasWidth: number,
  canvasHeight: number,
  placements: Record<PlacementID, Placement>,
  blocks: Record<BlockID, Block>,
  musee: MuseeIndex,
  realm: FocusRealm,
  lifecycle: FocusLifecyclePreset,
  options?: { padding?: number; maxScale?: number }
): Viewport {
  const pad = options?.padding ?? 72;
  const maxScaleCap = options?.maxScale ?? 1.05;

  if (canvasWidth <= 0 || canvasHeight <= 0) {
    return { x: 0, y: 0, scale: clampScale(1) };
  }

  const list = Object.values(placements).filter((p) => {
    /** 收納格／白紙 dock 的座標不參與主畫布框選，避免 (0,0) 扭曲視角 */
    if (p.parentContainerId) return false;
    if (p.blockId in musee) return false;
    const b = blocks[p.blockId];
    if (!b) return false;
    return shouldShowPlacementInFocusMode(p, b, { realm, lifecycle });
  });

  if (list.length === 0) {
    return {
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      scale: clampScale(1),
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of list) {
    const r = placementToRect(p);
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }

  const bw = Math.max(maxX - minX, 200);
  const bh = Math.max(maxY - minY, 200);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const scaleX = (canvasWidth - 2 * pad) / bw;
  const scaleY = (canvasHeight - 2 * pad) / bh;
  const scale = clampScale(Math.min(scaleX, scaleY, maxScaleCap));

  return {
    x: canvasWidth / 2 - cx * scale,
    y: canvasHeight / 2 - cy * scale,
    scale,
  };
}
