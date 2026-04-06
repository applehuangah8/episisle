import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LayoutGrid,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";

import { normalizeMetaName } from "@/isle/aura/auraWorldIdentity";
import { getResolvedAuraIslandDisplayName } from "@/isle/aura/auraIslandMetadata";
import type { AuraIslandId } from "@/isle/aura/auraWorldIslandTypes";
import { IslandBundleBackupMicro } from "@/isle/aura/IslandBundleBackupMicro";
import { useAuraWorldSelection } from "@/isle/aura/auraWorldSelectionStore";

import { CODEX_MASK_OPTIONS, codexImageMaskShell, codexMaskThumbnailStyle } from "./codexImageMask";
import type { CodexEntry, CodexImageMask } from "./codexTypes";
import { CodexArchiveSheet, CodexGridPanel } from "./CodexGridView";
import { useEpisCodexStore } from "./episCodexStore";

const ease = [0.22, 1, 0.36, 1] as const;
const slideEase = [0.25, 0.1, 0.25, 1] as const;
/** Short, no blur — avoids jank and “wait” stagger between slides. */
const slideTransition = { duration: 0.26, ease: slideEase };
const CORAL_CANCEL = "#E89587";
const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024;

const CODEX_PANEL_BG_URL =
  "https://raw.githubusercontent.com/applehuangah8/episisle/refs/heads/main/codexbg.png";

/** Quiet full-bleed matte for empty photo slot — no copy. */
function CodexGradientMatte() {
  return (
    <motion.div
      className="absolute inset-0"
      aria-hidden
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
      }}
      transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      style={{
        background:
          "linear-gradient(128deg, rgba(238,244,240,0.55) 0%, rgba(220,232,238,0.42) 35%, rgba(236,228,220,0.38) 68%, rgba(232,242,236,0.5) 100%)",
        backgroundSize: "200% 200%",
      }}
    />
  );
}

function CodexEditableWorldLabel({
  worldId,
  variant = "subline",
}: {
  worldId: string;
  /** subline: below count · header: beside EPIS CODEX (title row) */
  variant?: "subline" | "header";
}) {
  const islandId = worldId as AuraIslandId;
  const setWorldMeta = useAuraWorldSelection((s) => s.setWorldMeta);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const display = getResolvedAuraIslandDisplayName(islandId);

  useEffect(() => {
    if (!editing) setDraft(display);
  }, [display, editing]);

  const commit = useCallback(() => {
    const name = normalizeMetaName(draft);
    if (name.length >= 1)
      setWorldMeta(worldId, { name, isDefaultName: false, settlementStatus: "settled" });
    setEditing(false);
  }, [draft, setWorldMeta, worldId]);

  if (editing) {
    return (
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className={
          variant === "header"
            ? "min-w-[6rem] max-w-[14rem] rounded-lg border border-white/[0.22] bg-white/[0.35] px-2 py-1 text-[12px] font-normal outline-none ring-[rgba(66,104,133,0.22)] focus:ring-1"
            : "mt-2 w-full max-w-[16rem] rounded-lg border border-white/[0.18] bg-white/[0.2] px-2.5 py-1.5 text-[12px] font-normal outline-none ring-[rgba(66,104,133,0.18)] focus:ring-1"
        }
        style={{ borderWidth: "0.5px", color: "rgba(52,62,58,0.88)" }}
        autoFocus
        aria-label="編輯島名"
      />
    );
  }

  if (variant === "header") {
    return (
      <span
        className="max-w-[14rem] cursor-default select-none text-[12px] font-light leading-snug tracking-[0.14em] text-[rgba(42,52,48,0.78)] transition-colors hover:text-[rgba(32,42,38,0.92)]"
        style={{ fontFamily: "var(--epis-font-district), Georgia, serif" }}
        onDoubleClick={() => setEditing(true)}
        title="雙擊為此島命名"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setEditing(true);
        }}
      >
        {display}
      </span>
    );
  }

  return (
    <p
      className="mt-2 max-w-[18rem] cursor-default select-none text-[11px] font-normal leading-snug tracking-[0.12em] text-[rgba(72,84,78,0.5)] transition-colors hover:text-[rgba(52,62,58,0.62)]"
      style={{ fontFamily: "var(--epis-font-district), Georgia, serif" }}
      onDoubleClick={() => setEditing(true)}
      title="雙擊為此島命名"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setEditing(true);
      }}
    >
      {display}
    </p>
  );
}

const IMAGE_SLOT_LABEL_KEY = (worldId: string) => `epis-codex-imageSlotLabel-${worldId}`;

function CodexEditableSlotLabel({
  worldId,
  fallback,
  className,
}: {
  worldId: string;
  fallback: string;
  className?: string;
}) {
  const key = IMAGE_SLOT_LABEL_KEY(worldId);
  const [text, setText] = useState(fallback);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(fallback);

  useEffect(() => {
    try {
      const v = localStorage.getItem(key)?.trim();
      setText(v && v.length > 0 ? v : fallback);
    } catch {
      setText(fallback);
    }
  }, [worldId, key, fallback]);

  useEffect(() => {
    if (!editing) setDraft(text);
  }, [text, editing]);

  const commit = useCallback(() => {
    const t = draft.trim() || fallback;
    setText(t);
    try {
      localStorage.setItem(key, t);
    } catch {
      /* ignore */
    }
    setEditing(false);
  }, [draft, fallback, key]);

  if (editing) {
    return (
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="inline-block w-full max-w-[10rem] rounded-md border border-white/[0.16] bg-white/[0.18] px-1.5 py-0.5 text-[10px] font-normal outline-none ring-[rgba(66,104,133,0.18)] focus:ring-1"
        style={{ borderWidth: "0.5px", color: "rgba(52,62,58,0.88)" }}
        autoFocus
        aria-label="自訂欄位名稱"
      />
    );
  }

  return (
    <span
      className={className}
      onDoubleClick={() => setEditing(true)}
      title="雙擊變更欄位名稱"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setEditing(true);
      }}
    >
      {text}
    </span>
  );
}

function CodexMaskPicker({
  value,
  onChange,
  dense,
}: {
  value: CodexImageMask;
  onChange: (m: CodexImageMask) => void;
  /** Tighter buttons + thumbnails for footer row */
  dense?: boolean;
}) {
  const btn = dense ? "size-7" : "size-8";
  const thumb = dense ? "size-[13px]" : "size-4";
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5" role="radiogroup" aria-label="圖片外框">
      {CODEX_MASK_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={value === opt.id}
          aria-label={opt.label}
          title={opt.label}
          onClick={() => onChange(opt.id)}
          className={`flex ${btn} shrink-0 items-center justify-center rounded-full border border-white/[0.2] transition ${
            value === opt.id
              ? "bg-white/[0.28] ring-1 ring-[rgba(66,104,133,0.42)] shadow-[0_2px_10px_-3px_rgba(42,52,48,0.12)]"
              : "bg-white/[0.1] opacity-72 hover:opacity-100"
          }`}
          style={{ borderWidth: "0.5px" }}
        >
          <span
            className={`${thumb} bg-[rgba(66,104,133,0.38)]`}
            style={codexMaskThumbnailStyle(opt.id)}
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}

function CodexAddWorkspace({
  worldId,
  onCancel,
}: {
  worldId: string;
  onCancel: () => void;
}) {
  const addEntry = useEpisCodexStore((s) => s.addEntry);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [fileData, setFileData] = useState<string | null>(null);
  const [imageMask, setImageMask] = useState<CodexImageMask>("petal");

  const urlLooksUsable = imageUrl.trim().startsWith("http") || imageUrl.trim().startsWith("data:");
  const displaySrc = fileData || (urlLooksUsable ? imageUrl.trim() : "");

  const onPickFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    if (f.size > MAX_IMAGE_BYTES) return;
    const reader = new FileReader();
    reader.onload = () => setFileData(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(f);
  }, []);

  const openPicker = () => fileRef.current?.click();

  const submit = useCallback(() => {
    const img = (fileData || (urlLooksUsable ? imageUrl.trim() : "")) || undefined;
    addEntry(worldId, {
      title,
      category,
      description,
      image: img,
      imageMask,
    });
    setTitle("");
    setCategory("");
    setImageUrl("");
    setDescription("");
    setFileData(null);
    setImageMask("petal");
  }, [addEntry, worldId, title, category, description, fileData, imageUrl, urlLooksUsable, imageMask]);

  const field =
    "w-full rounded-2xl border border-white/[0.16] bg-white/[0.14] px-4 py-3 text-[13px] font-normal shadow-[inset_0_1px_0_rgba(255,252,248,0.55)] outline-none transition-[box-shadow,border-color] duration-200 placeholder:text-[rgba(90,96,102,0.36)] focus:border-[rgba(66,104,133,0.32)] focus:bg-white/[0.18] focus:shadow-[inset_0_1px_0_rgba(255,252,248,0.65),0_0_0_1px_rgba(66,104,133,0.14)]";

  return (
    <>
      <div className="relative flex min-h-[280px] flex-col md:col-span-7 md:min-h-0 md:border-r md:border-white/[0.1] md:pr-6">
        <div className="mb-3 shrink-0 space-y-2">
          <span className="text-[10px] font-normal tracking-[0.18em] text-[rgba(62,72,68,0.48)]">預覽外框</span>
          <CodexMaskPicker value={imageMask} onChange={setImageMask} />
        </div>
        <div
          className="relative flex min-h-[min(52vh,480px)] flex-1 cursor-pointer flex-col overflow-hidden rounded-[24px] border border-white/[0.16] bg-white/[0.06] shadow-[inset_0_0_0_0.5px_rgba(255,252,248,0.45)] md:min-h-0"
          style={{ borderWidth: "0.5px" }}
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openPicker();
          }}
          role="button"
          tabIndex={0}
          aria-label="選擇圖片"
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
          {displaySrc ? (
            (() => {
              const shell = codexImageMaskShell(imageMask);
              const img = (
                <img
                  src={displaySrc}
                  alt=""
                  className="h-full min-h-[280px] w-full flex-1 object-cover md:min-h-[360px]"
                />
              );
              const inner = (
                <div className={shell.className} style={shell.style}>
                  {img}
                </div>
              );
              return shell.wrapClass ? <div className={shell.wrapClass}>{inner}</div> : inner;
            })()
          ) : (
            <>
              <CodexGradientMatte />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <ImagePlus className="size-[4.5rem] text-[rgba(66,104,133,0.22)]" strokeWidth={1.1} aria-hidden />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-col justify-center gap-0 border-t border-white/[0.08] px-5 py-6 md:col-span-5 md:border-l md:border-t-0 md:px-7 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="flex max-h-[min(78vh,720px)] flex-col gap-5 overflow-y-auto pr-1"
        >
          <div className="mb-1 flex justify-end">
            <button
              type="button"
              onClick={onCancel}
              aria-label="返回典藏列表"
              title="返回"
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/[0.2] bg-white/[0.08] text-[rgba(52,62,58,0.72)] shadow-[0_2px_14px_-4px_rgba(42,52,48,0.18)] transition hover:bg-white/[0.16] hover:text-[rgba(42,52,48,0.92)]"
              style={{ borderWidth: "0.5px" }}
            >
              <ArrowLeft className="size-[18px]" strokeWidth={1.75} aria-hidden />
            </button>
          </div>

          <label className="block space-y-2">
            <span className="text-[10px] font-normal tracking-[0.18em] text-[rgba(78,88,84,0.42)]">標題</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="典藏標題"
              className={field}
              style={{ borderWidth: "0.5px", color: "rgba(42,52,58,0.9)" }}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[10px] font-normal tracking-[0.18em] text-[rgba(78,88,84,0.42)]">類別</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="自訂類別"
              className={field}
              style={{ borderWidth: "0.5px", color: "rgba(42,52,58,0.88)" }}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[10px] font-normal tracking-[0.18em] text-[rgba(78,88,84,0.42)]">
              <CodexEditableSlotLabel worldId={worldId} fallback="雙擊變更" />
            </span>
            <input
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (fileData) setFileData(null);
              }}
              className={field}
              style={{ borderWidth: "0.5px", color: "rgba(42,52,58,0.85)" }}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[10px] font-normal tracking-[0.18em] text-[rgba(78,88,84,0.42)]">描述</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="…"
              rows={8}
              className={`${field} min-h-[11rem] resize-none leading-[1.85]`}
              style={{ borderWidth: "0.5px", color: "rgba(52,62,58,0.88)" }}
            />
          </label>

          <div className="flex flex-row-reverse items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-2xl px-5 py-2.5 text-[12px] font-normal transition opacity-85 hover:opacity-100"
              style={{ color: CORAL_CANCEL }}
            >
              取消
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!title.trim()}
              className="rounded-2xl border border-[rgba(42,52,48,0.12)] bg-gradient-to-b from-white/[0.22] to-white/[0.08] px-6 py-2.5 text-[12px] font-medium text-[rgba(36,44,42,0.88)] shadow-[0_8px_28px_-12px_rgba(42,52,48,0.35)] transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-38"
              style={{ borderWidth: "0.5px" }}
            >
              加入圖鑑
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

function EntryVisual({ entry, hintId }: { entry: CodexEntry; hintId: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    setImgFailed(false);
  }, [entry.id, entry.image]);

  const shell = codexImageMaskShell(entry.imageMask);

  if (entry.image && !imgFailed) {
    const img = (
      <img
        src={entry.image}
        alt=""
        className="h-full min-h-[280px] w-full object-cover md:min-h-[360px]"
        onError={() => setImgFailed(true)}
      />
    );
    const inner = (
      <div className={shell.className} style={shell.style}>
        {img}
      </div>
    );
    return shell.wrapClass ? <div className={shell.wrapClass}>{inner}</div> : inner;
  }

  const placeholder = (
    <div className={shell.className} style={shell.style}>
      <CodexGradientMatte />
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <ImagePlus className="size-16" strokeWidth={1} aria-hidden />
      </div>
      <span id={hintId} className="sr-only">
        顯示圖片
      </span>
    </div>
  );
  return shell.wrapClass ? <div className={shell.wrapClass}>{placeholder}</div> : placeholder;
}

const entryVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? 18 : -18,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? -14 : 14,
    opacity: 0,
  }),
};

export function AuraCodexOverlay() {
  const hintId = useId();
  const isOpen = useEpisCodexStore((s) => s.isCodexOpen);
  const closeCodex = useEpisCodexStore((s) => s.closeCodex);
  const ctxWorldId = useEpisCodexStore((s) => s.codexContextWorldId);
  const entriesByWorld = useEpisCodexStore((s) => s.codexEntriesByWorldId);
  const activeIndex = useEpisCodexStore((s) => s.activeIndex);
  const slideDir = useEpisCodexStore((s) => s.slideDir);
  const goNext = useEpisCodexStore((s) => s.goNext);
  const goPrev = useEpisCodexStore((s) => s.goPrev);
  const showAddForm = useEpisCodexStore((s) => s.showAddForm);
  const setShowAddForm = useEpisCodexStore((s) => s.setShowAddForm);
  const setEntryImageMask = useEpisCodexStore((s) => s.setEntryImageMask);
  const removeEntry = useEpisCodexStore((s) => s.removeEntry);
  const codexViewMode = useEpisCodexStore((s) => s.codexViewMode);
  const setCodexViewMode = useEpisCodexStore((s) => s.setCodexViewMode);
  const codexArchiveEntryId = useEpisCodexStore((s) => s.codexArchiveEntryId);
  const closeCodexArchiveEntry = useEpisCodexStore((s) => s.closeCodexArchiveEntry);

  const isEntered = useAuraWorldSelection((s) => s.isEntered);
  const selectedWorldId = useAuraWorldSelection((s) => s.selectedWorldId);
  const viewMode = useAuraWorldSelection((s) => s.viewMode);

  useEffect(() => {
    if (viewMode === "focus") {
      useEpisCodexStore.getState().closeCodex();
    }
  }, [viewMode]);

  useEffect(() => {
    if (!isEntered || !selectedWorldId) {
      useEpisCodexStore.getState().closeCodex();
      return;
    }
    const ctx = useEpisCodexStore.getState().codexContextWorldId;
    if (ctx && ctx !== selectedWorldId) {
      useEpisCodexStore.getState().closeCodex();
    }
  }, [isEntered, selectedWorldId]);

  const worldId = ctxWorldId ?? "";
  const list = entriesByWorld[worldId] ?? [];
  const entry = list[activeIndex] ?? null;
  const archiveEntry =
    codexArchiveEntryId != null ? (list.find((e) => e.id === codexArchiveEntryId) ?? null) : null;

  const panelFrame: CSSProperties = {
    borderRadius: 28,
    border: "0.5px solid rgba(255,252,248,0.72)",
    boxShadow:
      "0 36px 120px -36px rgba(32,42,38,0.42), inset 0 1px 0 rgba(255,252,248,0.6), inset 0 -1px 0 rgba(72,78,74,0.06)",
  };

  return (
    <AnimatePresence>
      {isOpen && ctxWorldId ? (
        <motion.div
          key="epis-codex-root"
          className="pointer-events-auto fixed inset-0 z-[88] flex items-center justify-center px-3 py-6 sm:px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease }}
        >
          <button
            type="button"
            aria-label="Close Codex"
            className="absolute inset-0 bg-[rgba(12,16,14,0.12)]"
            style={{ backdropFilter: "blur(3px)" }}
            onClick={() => closeCodex()}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="epis-codex-heading"
            className="relative flex max-h-[min(96vh,940px)] min-h-[min(620px,90vh)] w-full max-w-[min(96vw,1120px)] flex-col overflow-hidden"
            style={panelFrame}
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: 0.82, ease }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute inset-0 scale-[1.03]"
              aria-hidden
              style={{
                backgroundImage: `url(${CODEX_PANEL_BG_URL})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[rgba(255,252,248,0.89)] via-[rgba(250,242,232,0.76)] to-[rgba(238,228,218,0.84)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,252,248,0.5),transparent_65%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 mix-blend-multiply bg-[rgba(48,56,52,0.04)]"
              aria-hidden
            />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <header className="flex shrink-0 items-start justify-between border-b border-white/[0.12] px-5 py-4 backdrop-blur-[2px] md:px-8 md:py-5">
              <div>
                <p
                  id="epis-codex-heading"
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[14px] font-light tracking-[0.34em] text-[rgba(34,44,40,0.9)]"
                  style={{ fontFamily: "var(--epis-font-district), Georgia, serif" }}
                >
                  <span>EPIS CODEX</span>
                  <span className="select-none text-[12px] font-light tracking-[0.08em] text-[rgba(88,96,90,0.38)]" aria-hidden>
                    ·
                  </span>
                  <CodexEditableWorldLabel worldId={ctxWorldId} variant="header" />
                </p>
                <p className="mt-2 text-[10px] font-normal tracking-[0.22em] text-[rgba(72,78,74,0.48)]">
                  {list.length} 則典藏
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5 md:gap-2">
                {list.length > 0 && !showAddForm ? (
                  <div
                    className="mr-1 flex items-center rounded-full border border-white/[0.1] p-0.5"
                    style={{ borderWidth: "0.5px" }}
                    role="group"
                    aria-label="閱覽模式"
                  >
                    <button
                      type="button"
                      title="單則瀏覽"
                      aria-pressed={codexViewMode === "browse"}
                      className={`flex size-8 items-center justify-center rounded-full transition ${
                        codexViewMode === "browse"
                          ? "bg-white/[0.2] text-[rgba(42,52,48,0.88)]"
                          : "text-[rgba(72,78,74,0.45)] hover:bg-white/[0.08]"
                      }`}
                      onClick={() => setCodexViewMode("browse")}
                    >
                      <BookOpen className="size-[15px]" strokeWidth={1.55} aria-hidden />
                    </button>
                    <button
                      type="button"
                      title="典藏全覽"
                      aria-pressed={codexViewMode === "grid"}
                      className={`flex size-8 items-center justify-center rounded-full transition ${
                        codexViewMode === "grid"
                          ? "bg-white/[0.2] text-[rgba(42,52,48,0.88)]"
                          : "text-[rgba(72,78,74,0.45)] hover:bg-white/[0.08]"
                      }`}
                      onClick={() => setCodexViewMode("grid")}
                    >
                      <LayoutGrid className="size-[15px]" strokeWidth={1.55} aria-hidden />
                    </button>
                  </div>
                ) : null}
                <IslandBundleBackupMicro worldId={ctxWorldId} variant="codex" />
                <button
                  type="button"
                  title={
                    showAddForm
                      ? "請先儲存或取消目前編輯，再加入下一筆"
                      : "新增典藏"
                  }
                  aria-label="新增典藏"
                  disabled={showAddForm}
                  className={`flex size-9 items-center justify-center rounded-full border border-white/[0.12] text-[rgba(66,104,133,0.78)] transition ${
                    showAddForm
                      ? "cursor-not-allowed opacity-35 hover:bg-transparent"
                      : "hover:bg-white/[0.12]"
                  }`}
                  style={{ borderWidth: "0.5px" }}
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="size-4" strokeWidth={1.65} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="關閉"
                  className="flex size-9 items-center justify-center rounded-full border border-white/[0.1] text-[rgba(72,82,78,0.52)] transition hover:bg-white/[0.1]"
                  style={{ borderWidth: "0.5px" }}
                  onClick={() => closeCodex()}
                >
                  <X className="size-4" strokeWidth={1.55} aria-hidden />
                </button>
              </div>
            </header>

            <div
              className={`relative min-h-0 flex-1 ${showAddForm || codexViewMode === "browse" ? "grid grid-cols-1 md:grid-cols-12 md:min-h-[min(72vh,780px)]" : "flex min-h-[min(72vh,780px)] flex-col"}`}
            >
              {showAddForm ? (
                <CodexAddWorkspace worldId={worldId} onCancel={() => setShowAddForm(false)} />
              ) : codexViewMode === "grid" ? (
                list.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
                    <p
                      className="text-[12px] font-light tracking-[0.22em] text-[rgba(90,96,102,0.48)]"
                      style={{ fontFamily: "var(--epis-font-district), Georgia, serif" }}
                    >
                      尚無典藏
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="rounded-full border border-[rgba(66,104,133,0.22)] bg-white/[0.06] px-6 py-2.5 text-[11px] font-medium text-[rgba(42,52,58,0.82)] transition hover:bg-white/[0.12]"
                      style={{ borderWidth: "0.5px" }}
                    >
                      寫下第一則
                    </button>
                  </div>
                ) : (
                  <CodexGridPanel entries={list} />
                )
              ) : (
                <>
                  <div className="relative flex min-h-[260px] flex-col border-b border-white/[0.1] p-4 md:col-span-7 md:border-b-0 md:border-r md:border-white/[0.1] md:p-5">
                    {list.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-12 text-center">
                        <p
                          className="text-[12px] font-light tracking-[0.22em] text-[rgba(90,96,102,0.48)]"
                          style={{ fontFamily: "var(--epis-font-district), Georgia, serif" }}
                        >
                          尚無典藏
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowAddForm(true)}
                          className="rounded-full border border-[rgba(66,104,133,0.22)] bg-white/[0.06] px-6 py-2.5 text-[11px] font-medium text-[rgba(42,52,58,0.82)] transition hover:bg-white/[0.12]"
                          style={{ borderWidth: "0.5px" }}
                        >
                          寫下第一則
                        </button>
                      </div>
                    ) : (
                      <div className="relative flex min-h-[min(54vh,520px)] flex-1 flex-col md:min-h-[460px]">
                        {entry ? (
                          <div className="mb-3 flex shrink-0 justify-center px-1">
                            <CodexMaskPicker
                              dense
                              value={entry.imageMask ?? "petal"}
                              onChange={(m) => setEntryImageMask(worldId, entry.id, m)}
                            />
                          </div>
                        ) : null}
                        <AnimatePresence initial={false} custom={slideDir}>
                          <motion.div
                            key={entry?.id ?? "void"}
                            custom={slideDir}
                            variants={entryVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={slideTransition}
                            className="flex min-h-0 flex-1 flex-col"
                          >
                            {entry ? (
                              <div className="relative flex min-h-0 flex-1 flex-col md:min-h-0">
                                <EntryVisual entry={entry} hintId={hintId} />
                              </div>
                            ) : null}
                          </motion.div>
                        </AnimatePresence>

                        {list.length > 1 ? (
                          <div className="mt-auto flex items-center justify-center gap-6 pb-5 pt-5">
                            <button
                              type="button"
                              aria-label="上一則"
                              className="rounded-full border border-white/[0.1] p-2 text-[rgba(52,62,58,0.65)] transition hover:bg-white/[0.08]"
                              style={{ borderWidth: "0.5px" }}
                              onClick={goPrev}
                            >
                              <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
                            </button>
                            <span className="text-[10px] font-normal tabular-nums tracking-widest text-[rgba(90,96,102,0.4)]">
                              {activeIndex + 1} / {list.length}
                            </span>
                            <button
                              type="button"
                              aria-label="下一則"
                              className="rounded-full border border-white/[0.1] p-2 text-[rgba(52,62,58,0.65)] transition hover:bg-white/[0.08]"
                              style={{ borderWidth: "0.5px" }}
                              onClick={goNext}
                            >
                              <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex min-h-0 flex-col justify-center overflow-y-auto border-t border-white/[0.1] px-5 py-6 backdrop-blur-[1px] md:col-span-5 md:border-l md:border-t-0 md:px-8 md:py-8">
                    <AnimatePresence initial={false}>
                      {entry ? (
                        <motion.div
                          key={entry.id}
                          custom={slideDir}
                          variants={entryVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={slideTransition}
                          className="flex flex-col gap-5"
                        >
                          <div className="flex items-start justify-between gap-4 border-b border-white/[0.12] pb-4">
                            <h2
                              className="min-w-0 flex-1 text-[clamp(1.05rem,2.1vw,1.28rem)] font-light leading-snug tracking-[0.26em] text-[rgba(34,44,40,0.92)]"
                              style={{ fontFamily: "var(--epis-font-district), Georgia, serif" }}
                            >
                              {entry.title}
                            </h2>
                            <button
                              type="button"
                              aria-label="刪除此典藏"
                              title="刪除此典藏"
                              className="group flex size-9 shrink-0 items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.06] text-[rgba(72,82,78,0.45)] shadow-[0_2px_10px_-4px_rgba(42,52,48,0.15)] transition hover:border-[rgba(200,90,90,0.35)] hover:bg-[rgba(255,245,244,0.55)] hover:text-[#B85C5C]"
                              style={{ borderWidth: "0.5px" }}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    "確定刪除此典藏？資料將自書架移除且無法還原。",
                                  )
                                )
                                  return;
                                removeEntry(worldId, entry.id);
                              }}
                            >
                              <Trash2 className="size-[17px]" strokeWidth={1.55} aria-hidden />
                            </button>
                          </div>
                          {entry.category ? (
                            <p className="text-[10px] font-normal tracking-[0.2em] text-[rgba(66,104,133,0.55)]">
                              {entry.category}
                            </p>
                          ) : null}
                          <p
                            className="text-[13px] font-normal text-[rgba(90,96,102,0.88)]"
                            style={{
                              fontFamily: "var(--epis-font-sans), system-ui, sans-serif",
                              lineHeight: 1.85,
                            }}
                          >
                            {entry.description || "—"}
                          </p>
                          <p className="text-[10px] font-normal tracking-[0.1em] text-[rgba(90,96,102,0.36)]">
                            {new Date(entry.createdAt).toLocaleString()}
                          </p>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </>
              )}
              <CodexArchiveSheet
                worldId={worldId}
                entry={archiveEntry}
                onClose={closeCodexArchiveEntry}
              />
            </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
