import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { codexImageMaskShell } from "./codexImageMask";
import type { CodexEntry } from "./codexTypes";
import { useEpisCodexStore } from "./episCodexStore";

const CODEX_PANEL_BG_URL =
  "https://raw.githubusercontent.com/applehuangah8/episisle/refs/heads/main/codexbg.png";

const calmEase = [0.22, 1, 0.36, 1] as const;

function useCodexGridColumns(): number {
  const [cols, setCols] = useState(4);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCols(4);
      else if (w >= 768) setCols(3);
      else setCols(2);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

function QuietMatte() {
  return (
    <div
      className="absolute inset-0"
      aria-hidden
      style={{
        background:
          "linear-gradient(128deg, rgba(238,244,240,0.5) 0%, rgba(220,232,238,0.38) 35%, rgba(236,228,220,0.34) 68%, rgba(232,242,236,0.46) 100%)",
      }}
    />
  );
}

/** Same mask pipeline as browse / add; `compact` from codexImageMaskShell. */
function CodexMaskedFigure({ entry }: { entry: CodexEntry }) {
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    setImgFailed(false);
  }, [entry.id, entry.image]);

  const shell = codexImageMaskShell(entry.imageMask, { compact: true });
  const imgCls = "h-full w-full min-h-0 object-cover";

  if (entry.image && !imgFailed) {
    const img = <img src={entry.image} alt="" className={imgCls} onError={() => setImgFailed(true)} />;
    const inner = (
      <div className={shell.className} style={shell.style}>
        {img}
      </div>
    );
    return shell.wrapClass ? <div className={shell.wrapClass}>{inner}</div> : inner;
  }

  const placeholder = (
    <div className={shell.className} style={shell.style}>
      <QuietMatte />
      <div className="absolute inset-0 flex items-center justify-center opacity-25">
        <ImagePlus className="size-10" strokeWidth={1} aria-hidden />
      </div>
    </div>
  );
  return shell.wrapClass ? <div className={shell.wrapClass}>{placeholder}</div> : placeholder;
}


export function CodexGridPanel({ entries }: { entries: CodexEntry[] }) {
  const openArchive = useEpisCodexStore((s) => s.openCodexArchiveEntry);
  const cols = useCodexGridColumns();

  const gridItemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 14 },
      show: (i: number) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        return {
          opacity: 1,
          y: 0,
          transition: {
            delay: row * 0.11 + col * 0.035,
            duration: 0.52,
            ease: calmEase,
          },
        };
      },
    }),
    [cols],
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-2 md:px-8 md:pt-3">
      <div
        className="mx-auto grid w-full max-w-[1200px] grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        style={{ gap: 40 }}
      >
        {entries.map((entry, i) => (
          <motion.article
            key={entry.id}
            custom={i}
            variants={gridItemVariants}
            initial="hidden"
            animate="show"
            className="w-full"
          >
            <motion.button
              type="button"
              onClick={() => openArchive(entry.id)}
              className="group w-full text-left"
              aria-label={`開啟典藏：${entry.title}`}
              whileHover={{
                y: -2,
                scale: 1.015,
                filter: "brightness(1.08)",
                transition: { duration: 0.38, ease: calmEase },
              }}
              whileTap={{ scale: 0.995 }}
              transition={{ duration: 0.38, ease: calmEase }}
            >
              <div
                className="flex w-full flex-col overflow-hidden rounded-[14px] bg-[rgba(255,255,255,0.05)]"
                style={{
                  aspectRatio: "3 / 4",
                  border: "0.5px solid rgba(255,252,248,0.55)",
                  boxShadow:
                    "0 0 0 0.5px rgba(218,200,168,0.2), 0 16px 48px -20px rgba(38,44,40,0.28), inset 0 1px 0 rgba(255,252,248,0.22), inset 0 -1px 0 rgba(90,80,60,0.04)",
                }}
              >
                <div className="flex min-h-0 flex-1 flex-col p-2.5">
                  <div className="relative min-h-0 flex-1 overflow-visible">
                    <CodexMaskedFigure entry={entry} />
                  </div>
                  <div className="mt-3 shrink-0 space-y-1 px-0.5 pb-0.5 pt-1">
                    <h3
                      className="line-clamp-2 text-[14px] font-light leading-snug tracking-[0.1em] text-[rgba(38,46,42,0.9)]"
                      style={{ fontFamily: "var(--epis-font-district), Georgia, serif" }}
                    >
                      {entry.title}
                    </h3>
                    <p
                      className="text-[10px] font-normal uppercase tracking-[0.2em] text-[rgba(72,78,74,0.42)]"
                      style={{ fontVariant: "small-caps" }}
                    >
                      {entry.category?.trim() || "specimen"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.button>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

type ArchiveProps = {
  worldId: string;
  entry: CodexEntry | null;
  onClose: () => void;
};

export function CodexArchiveSheet({ worldId, entry, onClose }: ArchiveProps) {
  const goBrowse = useEpisCodexStore((s) => s.goCodexBrowseToEntryId);

  return (
    <AnimatePresence>
      {entry ? (
        <motion.div
          key={entry.id}
          className="absolute inset-0 z-[24] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: calmEase }}
        >
          <button
            type="button"
            aria-label="關閉詳情"
            className="absolute inset-0 bg-[rgba(18,22,20,0.28)]"
            style={{ backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)" }}
            onClick={onClose}
          />
          <motion.div
            role="document"
            className="relative z-10 flex max-h-[min(90vh,820px)] w-full max-w-[min(96vw,980px)] overflow-hidden rounded-[22px] border border-white/[0.14] shadow-[0_40px_100px_-40px_rgba(32,38,34,0.45)]"
            style={{
              borderWidth: "0.5px",
              boxShadow:
                "0 44px 120px -36px rgba(28,32,30,0.38), inset 0 1px 0 rgba(255,252,248,0.35)",
            }}
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.72, ease: calmEase }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute inset-0 scale-[1.02]"
              style={{
                backgroundImage: `url(${CODEX_PANEL_BG_URL})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[rgba(252,246,238,0.93)] via-[rgba(248,242,234,0.88)] to-[rgba(244,236,226,0.9)]"
              aria-hidden
            />
            <div className="relative z-10 grid min-h-[min(76vh,640px)] w-full grid-cols-1 md:grid-cols-2">
              <div className="flex min-h-[42vh] flex-col justify-center border-b border-white/[0.1] p-6 md:min-h-0 md:border-b-0 md:border-r md:p-8">
                <div className="mx-auto flex h-full max-h-[min(64vh,560px)] w-full max-w-[420px] items-center justify-center">
                  <div className="h-full w-full min-h-[280px]">
                    <CodexMaskedFigure entry={entry} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between gap-6 overflow-y-auto p-6 md:p-9">
                <div>
                  <p className="text-[10px] font-normal uppercase tracking-[0.28em] text-[rgba(72,78,74,0.38)]">
                    典藏摘卷
                  </p>
                  <h2
                    className="mt-3 text-[clamp(1.15rem,2.4vw,1.45rem)] font-light leading-snug tracking-[0.12em] text-[rgba(32,40,36,0.92)]"
                    style={{ fontFamily: "var(--epis-font-district), Georgia, serif" }}
                  >
                    {entry.title}
                  </h2>
                  <p
                    className="mt-2 text-[10px] font-normal uppercase tracking-[0.22em] text-[rgba(66,104,133,0.48)]"
                    style={{ fontVariant: "small-caps" }}
                  >
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  {entry.category ? (
                    <p className="mt-4 text-[10px] font-normal tracking-[0.18em] text-[rgba(78,84,80,0.48)]">
                      <span className="text-[rgba(72,78,74,0.35)]">類別　</span>
                      {entry.category}
                    </p>
                  ) : null}
                  <p
                    className="mt-5 text-[13px] font-normal leading-[1.85] text-[rgba(62,68,64,0.82)]"
                    style={{ fontFamily: "var(--epis-font-sans), system-ui, sans-serif" }}
                  >
                    {entry.description || "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.1] pt-5">
                  <button
                    type="button"
                    onClick={() => goBrowse(worldId, entry.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.12] px-4 py-2 text-[11px] font-normal tracking-[0.14em] text-[rgba(42,48,44,0.82)] transition hover:bg-white/[0.2]"
                    style={{ borderWidth: "0.5px" }}
                  >
                    <BookOpen className="size-3.5 opacity-70" strokeWidth={1.5} aria-hidden />
                    以此則瀏覽
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-normal tracking-[0.12em] text-[rgba(72,78,74,0.55)] transition hover:text-[rgba(42,48,44,0.85)]"
                  >
                    <X className="size-3.5" strokeWidth={1.5} aria-hidden />
                    收回
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
