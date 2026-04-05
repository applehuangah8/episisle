import { motion } from "framer-motion";
import { Archive, Copy, Layers2, X } from "lucide-react";
import { useCallback, useState } from "react";

import { DEFAULT_WILD_FLIP_FRONT_BLURB, FlipFrontBlurb } from "@/components/blocks/FlipFrontBlurb";
import { DistrictBlockShell } from "@/components/blocks/DistrictBlockShell";
import { TownFrontTitle } from "@/components/blocks/TownFlipCard";
import { blockDisplayTitle } from "@/core/blockView";
import type { DistrictType, RenderBlock } from "@/core/types";
import { useStore } from "@/store/useStore";

const flipSpring = { type: "spring" as const, stiffness: 220, damping: 26, mass: 0.55 };

const districtChips: { id: DistrictType; label: string }[] = [
  { id: "wild", label: "野域" },
  { id: "instagram", label: "IG" },
  { id: "youtube", label: "YT" },
  { id: "studio", label: "Studio" },
];

/**
 * 野域積木雙面：立面色調與單面 Wild 一致；內裏為完整模組編輯（不經 WildBlock 以免遞迴）。
 */
export function WildFlipCard({ model }: { model: RenderBlock }) {
  const [flipped, setFlipped] = useState(false);
  const title = blockDisplayTitle(model.block, "野域");
  const sendToArchiveFromButton = useStore((s) => s.sendToArchiveFromButton);
  const deletePlacementAndBlock = useStore((s) => s.deletePlacementAndBlock);
  const duplicatePlacement = useStore((s) => s.duplicatePlacement);
  const setDistrict = useStore((s) => s.setDistrict);
  const setSelectedPlacementId = useStore((s) => s.setSelectedPlacementId);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFlipped((v) => !v);
  }, []);

  return (
    <div className="h-full min-h-0 [perspective:880px]">
      <motion.div
        className="relative h-full min-h-0 w-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={flipSpring}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 flex min-h-0 flex-col overflow-hidden rounded-[22px] border-[0.5px] border-[#b8c9c4]/45 bg-gradient-to-br from-[var(--color-wild-block)] to-[#ddece8]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_24px_-12px_rgba(60,90,82,0.12)] [backface-visibility:hidden] [transform-style:preserve-3d]"
          style={{
            WebkitBackfaceVisibility: "hidden",
            backgroundImage: `
              radial-gradient(ellipse 100% 80% at 12% 10%, rgba(255,255,255,0.55) 0%, transparent 50%),
              radial-gradient(ellipse 75% 60% at 88% 85%, rgba(120,175,155,0.18) 0%, transparent 52%),
              radial-gradient(ellipse 50% 45% at 48% 48%, rgba(255,255,255,0.08) 0%, transparent 62%)
            `,
          }}
        >
          <div className="flex shrink-0 items-start justify-between gap-2 p-3">
            <div
              data-epis-no-drag
              className="min-w-0 flex-1"
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelectedPlacementId(model.placement.id);
              }}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-epis-ink/45">
                The Wild
              </p>
              <TownFrontTitle
                model={model}
                titleText={title}
                onEditFallback={() => setFlipped(true)}
              />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                data-epis-no-drag
                className="rounded-full border border-[var(--color-panel-border)] bg-white/55 p-1.5 text-epis-ink/70 shadow-brick transition hover:bg-white/85"
                title="翻面 · 內裏編輯"
                aria-label="翻面至內裏"
                onClick={toggle}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Layers2 className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                type="button"
                data-epis-no-drag
                className="rounded-lg p-1 text-epis-ink/45 transition hover:bg-white/35 hover:text-epis-ink/80"
                title="封存至倉庫（典籍）"
                aria-label="封存至倉庫"
                onClick={(e) => {
                  e.stopPropagation();
                  sendToArchiveFromButton(model.block.id);
                }}
              >
                <Archive className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                type="button"
                data-epis-no-drag
                className="rounded-lg p-1 text-epis-ink/45 transition hover:bg-white/35 hover:text-epis-ink/80"
                title="複製積木"
                aria-label="複製積木"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicatePlacement(model.placement.id);
                }}
              >
                <Copy className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                type="button"
                data-epis-no-drag
                className="rounded-lg p-1 text-pink-300 transition hover:bg-pink-50/80 hover:text-pink-400"
                title="刪除此積木"
                aria-label="刪除此積木"
                onClick={(e) => {
                  e.stopPropagation();
                  deletePlacementAndBlock(model.placement.id);
                }}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.25} />
              </button>
            </div>
          </div>
          <FlipFrontBlurb model={model} defaultBlurb={DEFAULT_WILD_FLIP_FRONT_BLURB} />
        </div>

        <div
          className="absolute inset-0 min-h-0 overflow-hidden rounded-[22px] border-[0.5px] border-[#b8c9c4]/45 bg-gradient-to-br from-[#eef6f4]/95 to-[var(--color-wild-block)]/98 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] [backface-visibility:hidden]"
          style={{
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="relative flex h-full min-h-0 flex-col">
            <div
              className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--color-panel-border)]/50 bg-white/25 px-3 py-2"
              data-epis-no-drag
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-epis-ink/40">
                區域
              </span>
              {districtChips.map(({ id, label }) => {
                const active = model.placement.district === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
                      active
                        ? "bg-[var(--color-accent-soft)] text-epis-ink/90"
                        : "bg-white/45 text-epis-ink/55 hover:bg-white/75"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDistrict(model.placement.id, id);
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <DistrictBlockShell
                model={model}
                fallbackTitle="野域"
                tintClass="bg-[var(--color-wild-block)]"
              />
            </div>
            <button
              type="button"
              data-epis-no-drag
              className="absolute bottom-2 right-2 z-[2] rounded-full border border-[var(--color-panel-border)] bg-white/80 p-1.5 text-epis-ink/70 shadow-brick transition hover:bg-white"
              title="回到立面"
              aria-label="回到立面"
              onClick={toggle}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Layers2 className="h-3.5 w-3.5 rotate-180" strokeWidth={2} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
