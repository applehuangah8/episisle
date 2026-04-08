import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";

import {
  planningDragHoverBorderColor,
  resolvePlanningDragHoverTint,
} from "@/canvas/planningDragHover";
import { TownFlipCard } from "@/components/blocks/TownFlipCard";
import { WildFlipCard } from "@/components/blocks/WildFlipCard";
import { DowntownPlanSlotPreview } from "@/components/downtown/DowntownPlanSlotBlock";
import { ensureBlocksRegistered } from "@/components/registerBlocks";
import { getDistrictComponent } from "@/core/blockRegistry";
import { toRenderBlock } from "@/core/transform";
import type { BlockComponent, DistrictType } from "@/core/types";
import { useStore } from "@/store/useStore";

ensureBlocksRegistered();

function isTownDistrict(d: DistrictType): boolean {
  return d === "instagram" || d === "youtube";
}

function BlockContent({
  district,
  model,
  Cmp,
}: {
  district: DistrictType;
  model: ReturnType<typeof toRenderBlock>;
  Cmp: BlockComponent;
}) {
  if (district === "wild") {
    return <WildFlipCard model={model} />;
  }
  if (isTownDistrict(district)) {
    return <TownFlipCard model={model} Cmp={Cmp} />;
  }
  return <Cmp model={model} />;
}

/**
 * Downtown 規劃格／空白畫布拖向主畫布時，以螢幕座標跟隨游標的浮層（不受父層 overflow 裁切）。
 * 顯示與格內相同的積木內容，磨砂玻璃外殼＋區域感應邊框色。
 */
export function PlanningDragOverlay() {
  const v = useStore((s) => s.planningDragVisual);
  const viewport = useStore((s) => s.viewport);
  const worldDistrictZones = useStore((s) => s.worldDistrictZones);
  const placementId = v?.placementId ?? null;

  const pair = useStore(
    useShallow((s) => {
      if (!placementId) return null;
      const placement = s.placements[placementId];
      if (!placement) return null;
      const block = s.blocks[placement.blockId];
      if (!block || block.id in s.musee) return null;
      return { placement, block };
    })
  );

  if (!v) return null;

  const tint = resolvePlanningDragHoverTint(v.clientX, v.clientY, viewport, worldDistrictZones);
  const borderColor = planningDragHoverBorderColor(tint);

  const slotKind = v.kind === "slot-yt" ? "yt" : v.kind === "slot-ig" ? "ig" : null;

  let inner: ReactNode;
  if (pair && slotKind) {
    inner = (
      <DowntownPlanSlotPreview
        model={toRenderBlock(pair.block, pair.placement, "neutral")}
        slotKind={slotKind}
        onRequestEdit={() => {}}
      />
    );
  } else if (pair && v.kind === "blank") {
    const Cmp = getDistrictComponent(pair.placement.district);
    inner = Cmp ? (
      <BlockContent
        district={pair.placement.district}
        model={toRenderBlock(pair.block, pair.placement, "neutral")}
        Cmp={Cmp}
      />
    ) : (
      <div className="h-full w-full bg-white/20" />
    );
  } else {
    inner = <div className="h-full w-full bg-white/20" />;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[50000] cursor-grabbing"
      style={{ cursor: "grabbing" }}
      aria-hidden
    >
      {/* Drop-point indicator dot */}
      <div
        className="absolute rounded-full"
        style={{
          left: v.clientX,
          top: v.clientY,
          width: 8,
          height: 8,
          marginLeft: -4,
          marginTop: -4,
          background: borderColor,
          boxShadow: `0 0 0 3px rgba(255,255,255,0.7), 0 0 12px ${borderColor}`,
        }}
      />
      {/* Block thumbnail */}
      <motion.div
        className="absolute"
        style={{
          left: v.clientX,
          top: v.clientY,
          width: v.width,
          height: v.height,
          marginLeft: -v.width / 2,
          marginTop: -v.height / 2,
          boxShadow:
            "0 12px 32px -8px rgba(0,0,0,0.18), 0 4px 12px -4px rgba(0,0,0,0.08)",
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 0.82, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 26, mass: 0.5 }}
      >
        <div
          className="flex h-full w-full flex-col overflow-hidden rounded-xl"
          style={{
            background: "rgba(255, 255, 255, 0.22)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: `1.5px solid ${borderColor}`,
            boxSizing: "border-box",
          }}
        >
          <div className="min-h-0 flex-1 overflow-hidden">{inner}</div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
