import { createPortal } from "react-dom";
import { Pencil, X } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";

import { DistrictBlockShell } from "@/components/blocks/DistrictBlockShell";
import {
  blockDisplayTitle,
  isContentModule,
  isNextModule,
  isTaskModule,
} from "@/core/blockView";
import type { Block, BlockComponent, BlockModule, DistrictType, RenderBlock } from "@/core/types";

function moduleChipLabel(m: BlockModule): string {
  if (isContentModule(m)) return "內容";
  if (isTaskModule(m)) return "待辦";
  if (isNextModule(m)) return "下一步";
  return m.type;
}

function blockTeaser(block: Block): string {
  const cm = block.modules.find(isContentModule);
  if (!cm) return "";
  const lines = cm.content.split("\n");
  const body = lines.length > 1 ? lines.slice(1).join("\n").trim() : "";
  const raw = body || lines[0]?.trim() || "";
  return raw.length > 72 ? `${raw.slice(0, 72)}…` : raw;
}

export function DowntownPlanSlotPreview({
  model,
  slotKind,
  onRequestEdit,
}: {
  model: RenderBlock;
  slotKind: "ig" | "yt";
  onRequestEdit: () => void;
}) {
  const yt = slotKind === "yt";
  const title = blockDisplayTitle(model.block, yt ? "YouTube" : "Downtown");
  const teaser = blockTeaser(model.block);
  const chips = useMemo(
    () => model.block.modules.map((m, i) => ({ key: `${i}`, label: moduleChipLabel(m) })),
    [model.block.modules]
  );

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onRequestEdit();
    },
    [onRequestEdit]
  );

  return (
    <div
      data-epis-downtown-slot-preview
      data-epis-dblclick-edit
      className={`relative flex h-full min-h-0 w-full select-none flex-col overflow-hidden rounded-[14px] border text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] ${
        yt
          ? "border-red-900/35 bg-gradient-to-br from-neutral-900/92 via-neutral-950/95 to-black/90"
          : "border-[#d8d0c4]/45 bg-gradient-to-br from-[#fffdfb]/92 via-[#faf6ef]/88 to-[#f3ebe0]/78"
      }`}
      style={{
        backgroundImage: yt
          ? `radial-gradient(ellipse 95% 70% at 18% 12%, rgba(255,80,72,0.12) 0%, transparent 52%),
             radial-gradient(ellipse 80% 60% at 88% 88%, rgba(120,160,255,0.06) 0%, transparent 48%)`
          : `radial-gradient(ellipse 100% 75% at 10% 8%, rgba(255,252,248,0.95) 0%, transparent 50%),
             radial-gradient(ellipse 70% 55% at 92% 78%, rgba(232,200,170,0.22) 0%, transparent 50%)`,
      }}
      onMouseDownCapture={(e) => {
        if (e.detail >= 2) e.preventDefault();
      }}
      onDoubleClick={onDoubleClick}
      title="雙擊開啟編輯"
    >
      <div className="flex min-h-0 flex-1 flex-col p-2.5 pr-9">
        <p
          className={`text-[9px] font-medium uppercase tracking-[0.32em] ${
            yt ? "text-red-200/55" : "text-epis-ink/42"
          }`}
        >
          {yt ? "YouTube" : "Downtown"}
        </p>
        <p
          className={`mt-0.5 line-clamp-2 text-[11px] font-semibold leading-tight ${
            yt ? "text-neutral-100/92" : "text-epis-ink/88"
          }`}
        >
          {title}
        </p>
        {chips.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {chips.map((c) => (
              <span
                key={c.key}
                className={`rounded-full px-1.5 py-px text-[9px] font-medium ${
                  yt
                    ? "bg-red-950/55 text-red-100/75 ring-1 ring-red-500/20"
                    : "bg-white/55 text-epis-ink/62 ring-1 ring-[#d8d0c4]/40"
                }`}
              >
                {c.label}
              </span>
            ))}
          </div>
        ) : null}
        {teaser ? (
          <p
            className={`mt-1.5 line-clamp-2 text-[10px] leading-snug ${
              yt ? "text-neutral-400/88" : "text-epis-ink/48"
            }`}
          >
            {teaser}
          </p>
        ) : (
          <p
            className={`mt-1.5 text-[10px] italic ${
              yt ? "text-neutral-500/70" : "text-epis-ink/38"
            }`}
          >
            尚無內文預覽
          </p>
        )}
      </div>
      <button
        type="button"
        data-epis-no-drag
        className={`absolute right-1.5 top-1.5 z-[2] rounded-full p-1.5 transition ${
          yt
            ? "bg-red-950/70 text-red-100/80 hover:bg-red-900/85"
            : "bg-white/70 text-epis-ink/55 shadow-sm hover:bg-white/95 hover:text-epis-ink/80"
        }`}
        title="編輯積木"
        aria-label="編輯積木"
        onClick={(e) => {
          e.stopPropagation();
          onRequestEdit();
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Pencil className="h-3 w-3" strokeWidth={2.25} />
      </button>
    </div>
  );
}

export function DowntownPlanEditorModal({
  open,
  onClose,
  model,
  district,
  Cmp,
  slotLabel,
}: {
  open: boolean;
  onClose: () => void;
  model: RenderBlock;
  district: DistrictType;
  Cmp: BlockComponent;
  slotLabel: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const body =
    district === "wild" ? (
      <DistrictBlockShell
        model={model}
        fallbackTitle="野域"
        tintClass="bg-[var(--color-wild-block)]"
      />
    ) : (
      <Cmp model={model} />
    );

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="epis-downtown-edit-title">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(58,48,42,0.28)] backdrop-blur-[3px]"
        aria-label="關閉編輯視窗"
        onClick={onClose}
      />
      <div className="relative z-[201] flex max-h-[min(88vh,760px)] w-full max-w-lg flex-col overflow-hidden rounded-[22px] border border-[var(--color-panel-border)] bg-[var(--color-app-bg)] shadow-[0_24px_64px_-20px_rgba(42,36,32,0.35)]">
        <header className="flex shrink-0 items-start justify-between gap-2 border-b border-[var(--color-panel-border)]/80 bg-gradient-to-b from-white/40 to-transparent px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-epis-ink/42">{slotLabel}</p>
            <h2 id="epis-downtown-edit-title" className="mt-0.5 text-sm font-semibold text-epis-ink/90">
              編輯積木
            </h2>
          </div>
          <button
            type="button"
            data-epis-no-drag
            className="shrink-0 rounded-full p-2 text-epis-ink/45 transition hover:bg-white/60 hover:text-epis-ink/75"
            title="關閉"
            aria-label="關閉"
            onClick={onClose}
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-3">{body}</div>
        <footer className="shrink-0 border-t border-[var(--color-panel-border)]/70 bg-white/25 px-4 py-3">
          <button
            type="button"
            className="w-full rounded-xl border border-[var(--color-panel-border)] bg-[var(--color-accent-soft)]/90 py-2.5 text-sm font-medium text-epis-ink/90 shadow-sm transition hover:bg-[var(--color-accent-soft)]"
            onClick={onClose}
          >
            完成
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
