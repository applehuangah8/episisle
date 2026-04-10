import { motion } from "framer-motion";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DropItem, Project, SurfaceKind } from "../../domain/types";
import { SURFACE_KINDS } from "../../domain/studio";
import { salonSpring } from "../motion/salonMotion";
import { SurfaceFormMotif } from "./surfaceFormMotifs";

type Props = {
  open: boolean;
  onClose: () => void;
  variant?: "overlay" | "page";
  projectName: string;
  projects: Project[];
  currentProjectId: string;
  onSelectProject: (id: string) => void;
  drops: DropItem[];
  /** When set, Palais shows edit/delete controls on each drop (typically wired from `useSalonPilot`). */
  onUpdateDropContent?: (dropId: string, content: string) => void;
  onDeleteDrop?: (dropId: string) => void;
  reduce: boolean;
};

function surfaceLabel(kind: SurfaceKind | undefined) {
  return SURFACE_KINDS.find((s) => s.id === (kind ?? "frosted-plaque"))?.label ?? "筆記";
}

function textStyleForDrop(d: DropItem): CSSProperties {
  const family =
    d.textFont === "etching"
      ? `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`
      : d.textFont === "script"
        ? `"Bickham Script Pro", "Edwardian Script ITC", "Palace Script MT", "Segoe Script", cursive`
        : `var(--font-serif)`;
  return {
    color: d.textColor ?? "var(--ink-body)",
    fontFamily: family,
  };
}

type Pose = { x: number; y: number; r: number; s: number };

function hashToUnit(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  // [0,1)
  return ((h >>> 0) % 100000) / 100000;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function layoutKey(viewProjectId: string | null) {
  return `salon-palais-layout-v2::${viewProjectId ?? "all"}`;
}

function loadLayout(viewProjectId: string | null): Record<string, Pose> {
  try {
    const raw = localStorage.getItem(layoutKey(viewProjectId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Pose>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveLayout(viewProjectId: string | null, map: Record<string, Pose>) {
  try {
    localStorage.setItem(layoutKey(viewProjectId), JSON.stringify(map));
  } catch {
    // ignore
  }
}

function estimateRadius(d: DropItem) {
  const base = 10;
  const len = Math.min(180, d.content.length);
  return base + len * 0.06;
}

function autoScatter(drops: DropItem[], existing: Record<string, Pose>): Record<string, Pose> {
  const next: Record<string, Pose> = { ...existing };
  const placed: Array<{ id: string; x: number; y: number; rad: number }> = [];

  // Seed placements first (around fountain + under trees), then relax.
  for (const d of drops) {
    if (next[d.id]) continue;
    const u = hashToUnit(d.id);
    const v = hashToUnit(`${d.id}::y`);
    const ring = 18 + Math.floor(u * 3) * 9; // 18 / 27 / 36
    const ang = (u * 2 - 1) * Math.PI; // [-pi,pi]
    const cx = 50 + Math.cos(ang) * ring;
    const cy = 54 + Math.sin(ang) * (ring * 0.62);
    const x = clamp(cx + (v - 0.5) * 10, 10, 90);
    const y = clamp(cy + (u - 0.5) * 8, 16, 90);
    next[d.id] = { x, y, r: (u - 0.5) * 14, s: 0.9 + v * 0.18 };
  }

  for (const d of drops) {
    const p = next[d.id]!;
    placed.push({ id: d.id, x: p.x, y: p.y, rad: estimateRadius(d) });
  }

  // Simple relaxation to reduce overlaps.
  for (let iter = 0; iter < 26; iter++) {
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i]!;
        const b = placed[j]!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const min = (a.rad + b.rad) * 0.06; // percent-ish
        if (dist >= min) continue;
        const push = (min - dist) * 0.45;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x = clamp(a.x + nx * push, 8, 92);
        a.y = clamp(a.y + ny * push, 14, 92);
        b.x = clamp(b.x - nx * push, 8, 92);
        b.y = clamp(b.y - ny * push, 14, 92);
      }
    }
  }

  for (const p of placed) {
    next[p.id] = { ...next[p.id]!, x: p.x, y: p.y };
  }

  return next;
}

function PalaceArtifactToolbar({
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  if (!canEdit && !canDelete) return null;
  return (
    <div
      className="palace-artifact__toolbar"
      role="group"
      aria-label="字條操作"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {canEdit ? (
        <button type="button" className="palace-artifact__toolbar-btn" onClick={onEdit}>
          編輯
        </button>
      ) : null}
      {canDelete ? (
        <button type="button" className="palace-artifact__toolbar-btn palace-artifact__toolbar-btn--danger" onClick={onDelete}>
          刪除
        </button>
      ) : null}
    </div>
  );
}

function PalaceTextEdit({
  draft,
  hint,
  onDraftChange,
  onSave,
  onCancel,
  className,
  style,
}: {
  draft: string;
  hint: string | null;
  onDraftChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  className: string;
  style: CSSProperties;
}) {
  return (
    <div className="palace-artifact__edit" onPointerDown={(e) => e.stopPropagation()}>
      <textarea
        className={`palace-artifact__textarea ${className}`}
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        style={style}
        rows={4}
        spellCheck={false}
        aria-label="編輯字條文字"
      />
      {hint ? (
        <p className="palace-artifact__edit-hint" role="status">
          {hint}
        </p>
      ) : null}
      <div className="palace-artifact__edit-actions">
        <button type="button" className="palace-artifact__edit-save" onClick={onSave}>
          儲存
        </button>
        <button type="button" className="palace-artifact__edit-cancel" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}

function PalaceCore({ label }: { label: string }) {
  return (
    <div className="salon-palace-core" aria-label={`${label} core`}>
      <svg viewBox="0 0 420 420" className="salon-palace-core__svg" aria-hidden>
        <defs>
          <radialGradient id="palace-core-sphere" cx="38%" cy="30%" r="68%">
            <stop offset="0%" stopColor="rgba(255, 252, 248, 0.95)" />
            <stop offset="58%" stopColor="rgba(188, 208, 170, 0.88)" />
            <stop offset="100%" stopColor="rgba(108, 148, 96, 0.9)" />
          </radialGradient>
          <linearGradient id="palace-core-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(247, 231, 189, 0.92)" />
            <stop offset="100%" stopColor="rgba(182, 146, 84, 0.88)" />
          </linearGradient>
        </defs>
        <ellipse cx="210" cy="212" rx="162" ry="102" fill="none" stroke="url(#palace-core-gold)" strokeWidth="5" opacity="0.8" />
        <ellipse cx="210" cy="212" rx="144" ry="126" fill="none" stroke="rgba(255, 252, 248, 0.82)" strokeWidth="3.2" opacity="0.92" />
        <ellipse cx="210" cy="212" rx="114" ry="146" fill="none" stroke="rgba(255, 252, 248, 0.66)" strokeWidth="2.4" opacity="0.9" />
        <ellipse cx="210" cy="212" rx="102" ry="82" fill="none" stroke="url(#palace-core-gold)" strokeWidth="3.6" opacity="0.82" transform="rotate(14 210 212)" />
        <circle cx="210" cy="212" r="36" fill="url(#palace-core-sphere)" />
        <ellipse cx="197" cy="197" rx="12" ry="7.5" fill="rgba(255,255,255,0.58)" transform="rotate(-24 197 197)" />
      </svg>
      <p className="salon-palace-core__label scenography-type">{label}</p>
    </div>
  );
}

export function CurioPalace({
  open,
  onClose,
  variant = "overlay",
  projectName,
  projects,
  currentProjectId,
  onSelectProject,
  drops,
  onUpdateDropContent,
  onDeleteDrop,
  reduce,
}: Props) {
  if (!open) return null;

  const wrapperClass =
    variant === "page" ? "salon-palace-page" : "salon-palace-overlay salon-palace-overlay--jardin";

  const [viewProjectId, setViewProjectId] = useState<string | null>(currentProjectId);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number; px: number; py: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editHint, setEditHint] = useState<string | null>(null);

  const visibleDrops = useMemo(() => {
    if (!viewProjectId) return drops;
    return drops.filter((d) => d.projectId === viewProjectId);
  }, [drops, viewProjectId]);

  const [layout, setLayout] = useState<Record<string, Pose>>(() => loadLayout(currentProjectId));

  useEffect(() => {
    setLayout(() => autoScatter(visibleDrops, loadLayout(viewProjectId)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewProjectId, open]);

  useEffect(() => {
    setLayout((prev) => {
      const ids = new Set(visibleDrops.map((d) => d.id));
      const pruned: Record<string, Pose> = {};
      for (const k of Object.keys(prev)) {
        if (ids.has(k)) pruned[k] = prev[k]!;
      }
      return autoScatter(visibleDrops, pruned);
    });
  }, [visibleDrops]);

  useEffect(() => {
    if (!editingId) return;
    if (!visibleDrops.some((d) => d.id === editingId)) {
      setEditingId(null);
      setEditDraft("");
      setEditHint(null);
    }
  }, [visibleDrops, editingId]);

  useEffect(() => {
    setEditHint(null);
  }, [editingId]);

  useEffect(() => {
    saveLayout(viewProjectId, layout);
  }, [layout, viewProjectId]);

  return (
    <div
      className={wrapperClass}
      role={variant === "page" ? undefined : "dialog"}
      aria-modal={variant === "page" ? undefined : true}
      aria-labelledby="palace-title"
    >
      {variant === "page" ? null : <div className="salon-palace-overlay__scrim" aria-hidden />}
      <motion.div
        className="salon-palace-scene"
        initial={reduce ? false : { opacity: 0, y: 16, scale: 1.02, filter: "blur(14px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={salonSpring}
      >
        <h2 id="palace-title" className="sr-only">
          Palais Curated Garden
        </h2>
        <div className="salon-palace-scene__void" aria-hidden />
        <div className="salon-palace-scene__air" aria-hidden />
        <div className="salon-palace-scene__fountain" aria-hidden />
        <div className="salon-palace-scene__flora salon-palace-scene__flora--left" aria-hidden />
        <div className="salon-palace-scene__flora salon-palace-scene__flora--right" aria-hidden />
        <div className="salon-palace-scene__petals" aria-hidden />
        <PalaceCore label={projectName} />

        <div className="salon-palace-scene__hud" role="toolbar" aria-label="Palais controls">
          <button type="button" className="salon-palace-exit" onClick={onClose} aria-label="退出 Palais">
            退出
          </button>
          <div className="salon-palace-planets" role="group" aria-label="Project planets">
            <button
              type="button"
              className={`salon-palace-planet ${viewProjectId === null ? "is-active" : ""}`}
              onClick={() => setViewProjectId(null)}
              aria-pressed={viewProjectId === null}
            >
              全覽
            </button>
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`salon-palace-planet ${viewProjectId === p.id ? "is-active" : ""}`}
                onClick={() => {
                  setViewProjectId(p.id);
                  onSelectProject(p.id);
                }}
                aria-pressed={viewProjectId === p.id}
                title={p.name}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={containerRef}
          className="salon-palace-scene__artifacts"
          onPointerMove={(e) => {
            const drag = dragRef.current;
            const el = containerRef.current;
            if (!drag || !el) return;
            const rect = el.getBoundingClientRect();
            const nx = clamp(((e.clientX - rect.left - drag.ox) / rect.width) * 100, 6, 94);
            const ny = clamp(((e.clientY - rect.top - drag.oy) / rect.height) * 100, 10, 94);
            setLayout((prev) => ({ ...prev, [drag.id]: { ...(prev[drag.id] ?? { x: nx, y: ny, r: 0, s: 1 }), x: nx, y: ny } }));
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
        >
          {visibleDrops.length === 0 ? (
            <p className="salon-palace__empty scenography-type">尚無展品。托盤寫下一行後回到 Palais。</p>
          ) : (
            visibleDrops.map((d) => {
              const slot = layout[d.id] ?? { x: 50, y: 50, r: 0, s: 1 };
              const sk = d.surfaceKind ?? "frosted-plaque";
              const isBouquet = sk === "bouquet-spray";
              const isRibbon = sk === "silk-ribbon";
              const isBox = sk === "time-capsule";
              const isEditing = editingId === d.id;
              const canMutate = Boolean(onUpdateDropContent || onDeleteDrop);
              const textClass = `palace-text--${sk}`;
              const textStyle = textStyleForDrop(d);

              return (
                <article
                  key={d.id}
                  className={`palace-artifact palace-artifact--${isBouquet ? "bouquet" : isBox ? "box" : "paper"} palace-artifact-surface--${sk}`}
                  style={
                    {
                      ["--x" as never]: slot.x,
                      ["--y" as never]: slot.y,
                      ["--r" as never]: `${slot.r}deg`,
                      ["--s" as never]: slot.s,
                    } as CSSProperties
                  }
                  onPointerDown={(e) => {
                    if (isEditing) return;
                    if ((e.target as HTMLElement).closest?.(".palace-artifact__toolbar, .palace-artifact__edit")) return;
                    const el = containerRef.current;
                    if (!el) return;
                    const rect = el.getBoundingClientRect();
                    const pose = layout[d.id] ?? slot;
                    const px = (pose.x / 100) * rect.width + rect.left;
                    const py = (pose.y / 100) * rect.height + rect.top;
                    dragRef.current = { id: d.id, ox: e.clientX - px, oy: e.clientY - py, px: pose.x, py: pose.y };
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  }}
                >
                  <div className="palace-artifact__meta scenography-type">
                    <span>{surfaceLabel(sk)}</span>
                    <span>{d.zone}</span>
                  </div>
                  {canMutate && !isEditing ? (
                    <PalaceArtifactToolbar
                      canEdit={Boolean(onUpdateDropContent)}
                      canDelete={Boolean(onDeleteDrop)}
                      onEdit={() => {
                        setEditingId(d.id);
                        setEditDraft(d.content);
                      }}
                      onDelete={() => {
                        if (!onDeleteDrop) return;
                        if (!window.confirm("確定刪除此字條？將一併從展場與喚醒摘要更新。")) return;
                        onDeleteDrop(d.id);
                      }}
                    />
                  ) : null}
                  {isBouquet ? (
                    <div className="palace-exhibit__bouquet">
                      <div className="palace-exhibit__pedestal" aria-hidden>
                        <SurfaceFormMotif kind={sk} variant="exhibit" flavor={d.surfaceVariant} />
                      </div>
                      <div
                        className={`palace-exhibit__bouquet-label scenography-type${isEditing ? " palace-exhibit__bouquet-label--editing" : ""}`}
                        aria-label="Bouquet label"
                      >
                        {isEditing && onUpdateDropContent ? (
                          <PalaceTextEdit
                            draft={editDraft}
                            hint={editHint}
                            onDraftChange={(v) => {
                              setEditDraft(v);
                              if (editHint) setEditHint(null);
                            }}
                            onSave={() => {
                              const trimmed = editDraft.trim();
                              if (!trimmed) {
                                setEditHint("請至少保留一個字再儲存。");
                                return;
                              }
                              onUpdateDropContent(d.id, editDraft);
                              setEditingId(null);
                              setEditHint(null);
                            }}
                            onCancel={() => {
                              setEditingId(null);
                              setEditHint(null);
                            }}
                            className={textClass}
                            style={textStyle}
                          />
                        ) : (
                          <span className="palace-exhibit__bouquet-label-ink" style={textStyle}>
                            {d.content}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`palace-exhibit__paper ${isBox ? "palace-exhibit__paper--box" : ""}`}
                      style={isRibbon ? ({ ["--ribbon" as never]: d.surfaceTint ?? "#c4a574" } as CSSProperties) : undefined}
                    >
                      <div className="palace-exhibit__paper-form" aria-hidden>
                        <SurfaceFormMotif kind={sk} variant="exhibit" />
                      </div>
                      {isEditing && onUpdateDropContent ? (
                        <PalaceTextEdit
                          draft={editDraft}
                          hint={editHint}
                          onDraftChange={(v) => {
                            setEditDraft(v);
                            if (editHint) setEditHint(null);
                          }}
                          onSave={() => {
                            const trimmed = editDraft.trim();
                            if (!trimmed) {
                              setEditHint("請至少保留一個字再儲存。");
                              return;
                            }
                            onUpdateDropContent(d.id, editDraft);
                            setEditingId(null);
                            setEditHint(null);
                          }}
                          onCancel={() => {
                            setEditingId(null);
                            setEditHint(null);
                          }}
                          className={textClass}
                          style={textStyle}
                        />
                      ) : (
                        <p className={`palace-exhibit__text palace-exhibit__text--readable ${textClass}`} style={textStyle}>
                          {d.content}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
