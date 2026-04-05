import { MuseeBlock } from "@/components/blocks/MuseeBlock";
import { blockDisplayTitle } from "@/core/blockView";
import { sortMuseeEntriesByChannel } from "@/core/museeArchivePolicy";
import { toRenderBlock } from "@/core/transform";
import type { Block, Placement } from "@/core/types";
import { useStore } from "@/store/useStore";

function galleryPlacement(blockId: string): Placement {
  return {
    id: `epis-gallery:${blockId}`,
    blockId,
    district: "studio",
    position: { x: 0, y: 0 },
    ui: { width: 300, height: 268 },
  };
}

function GalleryCard({
  blockId,
  block,
  onRestore,
}: {
  blockId: string;
  block: Block;
  onRestore: () => void;
}) {
  const placement = galleryPlacement(blockId);
  const model = toRenderBlock(block, placement, "studio");

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="min-h-[272px] overflow-hidden rounded-xl border border-[rgba(142,180,196,0.35)] bg-[rgba(248,250,252,0.4)] shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.4)] backdrop-blur-[6px]">
        <div className="h-full min-h-[272px] p-1">
          <MuseeBlock model={model} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="truncate text-xs text-epis-ink/50">{blockDisplayTitle(block, blockId)}</span>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-[rgba(142,180,196,0.4)] bg-white/50 px-2.5 py-1 text-[11px] font-medium text-epis-ink/70 transition hover:bg-white/80"
          onClick={onRestore}
        >
          丟回主畫布
        </button>
      </div>
    </div>
  );
}

/**
 * 靈感博物館長廊：拖入 🏛️ 的積木（channel: musee），可預覽編輯模組內容。
 */
export function MuseeGalleryView() {
  const musee = useStore((s) => s.musee);
  const blocks = useStore((s) => s.blocks);
  const restoreFromHiddenStorage = useStore((s) => s.restoreFromHiddenStorage);
  const setViewMode = useStore((s) => s.setViewMode);

  const entries = sortMuseeEntriesByChannel(musee, "musee");

  return (
    <div
      className="flex h-full min-h-0 flex-col pt-14"
      style={{
        background:
          "linear-gradient(168deg, rgba(236,242,248,0.95) 0%, rgba(228,234,242,0.92) 38%, rgba(220,228,238,0.9) 100%)",
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 top-14 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(rgba(142,180,196,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(142,180,196,0.12) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative z-[1] mx-auto grid w-full max-w-6xl min-h-0 flex-1 grid-cols-1 gap-8 overflow-auto p-6 md:grid-cols-2 md:p-8 xl:grid-cols-3">
        {entries.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(142,180,196,0.35)] py-24 text-center text-sm text-epis-ink/45">
            <span className="mb-2 text-3xl opacity-60" aria-hidden>
              🏛️
            </span>
            尚無展陳 · 於主畫布將積木拖入右下角博物館入口
          </div>
        ) : (
          entries.map((entry) => {
            const b = blocks[entry.blockId];
            if (!b) {
              return (
                <div
                  key={entry.blockId}
                  className="rounded-xl border border-amber-200/60 bg-amber-50/30 p-4 text-xs text-amber-900/70"
                >
                  缺少區塊資料：{entry.blockId}
                </div>
              );
            }
            return (
              <GalleryCard
                key={entry.blockId}
                blockId={entry.blockId}
                block={b}
                onRestore={() => {
                  restoreFromHiddenStorage(entry.blockId);
                  setViewMode("main");
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
