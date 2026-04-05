import { blockDisplayTitle } from "@/core/blockView";
import { sortMuseeEntriesByChannel } from "@/core/museeArchivePolicy";
import type { Block, MuseeEntry } from "@/core/types";
import { useStore } from "@/store/useStore";

function formatArchivedAt(ts: number): string {
  try {
    return new Date(ts).toLocaleString("zh-Hant", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function ArchiveRow({
  entry,
  block,
  onRestore,
}: {
  entry: MuseeEntry;
  block: Block | undefined;
  onRestore: () => void;
}) {
  const title = block ? blockDisplayTitle(block, block.id) : entry.blockId;
  const modules = block?.modules.length ?? 0;

  return (
    <li className="rounded-xl border border-[rgba(90,96,102,0.12)] bg-white/40 p-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-[8px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-epis-ink/90">{title}</div>
          <div className="mt-1 text-xs text-epis-ink/55">
            封存於 {formatArchivedAt(entry.archivedAt)} · {modules} 個模組
          </div>
          {!block ? (
            <p className="mt-1 text-xs text-amber-800/80">blocks 缺少此區塊資料</p>
          ) : null}
        </div>
        <button
          type="button"
          className="shrink-0 rounded-xl border border-[var(--color-panel-border)] bg-[var(--color-town-bg)]/80 px-3 py-1.5 text-xs font-medium text-epis-ink/80 shadow-brick transition hover:bg-[var(--color-glass-hover)]"
          onClick={onRestore}
        >
          回到畫布
        </button>
      </div>
    </li>
  );
}

/**
 * 典籍封存倉：僅 `channel === archive`。
 */
export function ArchiveView() {
  const musee = useStore((s) => s.musee);
  const blocks = useStore((s) => s.blocks);
  const restoreFromHiddenStorage = useStore((s) => s.restoreFromHiddenStorage);

  const entries = sortMuseeEntriesByChannel(musee, "archive");

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--color-canvas-bg)] pt-14">
      <ul className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col gap-3 overflow-auto p-6">
        {entries.length === 0 ? (
          <li className="rounded-xl border border-dashed border-epis-ink/15 bg-white/25 py-16 text-center text-sm text-epis-ink/45">
            尚無封存項目
          </li>
        ) : (
          entries.map((entry) => (
            <ArchiveRow
              key={entry.blockId}
              entry={entry}
              block={blocks[entry.blockId]}
              onRestore={() => restoreFromHiddenStorage(entry.blockId)}
            />
          ))
        )}
      </ul>
    </div>
  );
}
