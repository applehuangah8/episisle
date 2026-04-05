import { motion } from "framer-motion";
import { Archive, Copy, Layers2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_TOWN_FLIP_FRONT_BLURB, FlipFrontBlurb } from "@/components/blocks/FlipFrontBlurb";
import { blockDisplayTitle, isContentModule } from "@/core/blockView";
import type { BlockComponent, DistrictType, RenderBlock } from "@/core/types";
import { useStore } from "@/store/useStore";

const flipSpring = { type: "spring" as const, stiffness: 220, damping: 26, mass: 0.55 };

const districtChips: { id: DistrictType; label: string }[] = [
  { id: "wild", label: "野域" },
  { id: "instagram", label: "Downtown" },
  { id: "youtube", label: "YT" },
  { id: "studio", label: "Studio" },
];

export function TownFrontTitle({
  model,
  titleText,
  onEditFallback,
}: {
  model: RenderBlock;
  titleText: string;
  /** 立面無可編輯內容模組時，雙擊標題的後備動作（例如翻面編輯） */
  onEditFallback?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(titleText);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateBlockContent = useStore((s) => s.updateBlockContent);

  const contentIdx = useMemo(
    () => model.block.modules.findIndex((m) => isContentModule(m)),
    [model.block.modules]
  );

  useEffect(() => {
    if (!editing) setDraft(titleText);
  }, [editing, titleText]);

  const commit = useCallback(() => {
    if (contentIdx < 0) {
      setEditing(false);
      return;
    }
    const mod = model.block.modules[contentIdx];
    if (!isContentModule(mod)) {
      setEditing(false);
      return;
    }
    const lines = mod.content.split("\n");
    lines[0] = draft.trim() || titleText;
    updateBlockContent(model.block.id, contentIdx, lines.join("\n"));
    setEditing(false);
  }, [contentIdx, draft, model.block.id, model.block.modules, titleText, updateBlockContent]);

  const start = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setDraft(titleText);
      setEditing(true);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    },
    [titleText]
  );

  if (contentIdx < 0) {
    return (
      <p
        className="mt-1 cursor-text select-none truncate text-sm font-semibold text-epis-ink/90"
        data-epis-dblclick-edit
        onMouseDownCapture={(e) => {
          if (e.detail >= 2) e.preventDefault();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onEditFallback?.();
        }}
        role="presentation"
      >
        {titleText}
      </p>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        data-epis-no-drag
        className="mt-1 w-full min-w-0 border-0 bg-transparent p-0 text-sm font-semibold text-epis-ink/90 outline-none ring-0 focus:outline-none focus:ring-0"
        value={draft}
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setDraft(titleText);
            setEditing(false);
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <p
      className="mt-1 cursor-text select-none truncate text-sm font-semibold text-epis-ink/90"
      data-epis-dblclick-edit
      onMouseDownCapture={(e) => {
        if (e.detail >= 2) e.preventDefault();
      }}
      onDoubleClick={start}
      role="presentation"
    >
      {titleText}
    </p>
  );
}

/**
 * Town 區：立面紙質光感 + 翻面後為完整模組編輯面；立面可封存、標題可雙擊編輯。
 */
export function TownFlipCard({ model, Cmp }: { model: RenderBlock; Cmp: BlockComponent }) {
  const [flipped, setFlipped] = useState(false);
  const title = blockDisplayTitle(model.block, "Downtown");
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
          className="absolute inset-0 flex min-h-0 flex-col overflow-hidden rounded-[20px] border-[0.5px] border-[#d8d0c4]/55 bg-gradient-to-br from-white/58 to-[#f4efe6]/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_10px_28px_-14px_rgba(88,72,56,0.08)] [backface-visibility:hidden] [transform-style:preserve-3d]"
          style={{
            WebkitBackfaceVisibility: "hidden",
            backgroundImage: `
              radial-gradient(ellipse 115% 85% at 8% 12%, rgba(255,252,247,0.95) 0%, transparent 52%),
              radial-gradient(ellipse 90% 70% at 92% 78%, rgba(230,200,165,0.2) 0%, transparent 48%),
              radial-gradient(ellipse 55% 40% at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 65%)
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
                Downtown
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
                className="rounded-full border border-[var(--color-panel-border)] bg-white/75 p-1.5 text-epis-ink/70 shadow-brick transition hover:bg-white"
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
                className="rounded-lg p-1 text-epis-ink/45 transition hover:bg-white/45 hover:text-epis-ink/80"
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
                className="rounded-lg p-1 text-epis-ink/45 transition hover:bg-white/45 hover:text-epis-ink/80"
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
          <FlipFrontBlurb model={model} defaultBlurb={DEFAULT_TOWN_FLIP_FRONT_BLURB} />
        </div>

        <div
          className="absolute inset-0 min-h-0 overflow-hidden rounded-[20px] border-[0.5px] border-[#d8d0c4]/50 bg-[#faf7f2]/92 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] [backface-visibility:hidden]"
          style={{
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="relative flex h-full min-h-0 flex-col">
            <div
              className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--color-panel-border)]/60 bg-white/40 px-3 py-2"
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
                        : "bg-white/50 text-epis-ink/55 hover:bg-white/80"
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
              <Cmp model={model} />
            </div>
            <button
              type="button"
              data-epis-no-drag
              className="absolute bottom-2 right-2 z-[2] rounded-full border border-[var(--color-panel-border)] bg-white/85 p-1.5 text-epis-ink/70 shadow-brick transition hover:bg-white"
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
