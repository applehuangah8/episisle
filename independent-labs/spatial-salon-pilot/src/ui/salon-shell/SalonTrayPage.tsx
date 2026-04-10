import type { CSSProperties } from "react";
import { useEffect, useId, useRef } from "react";

import { motion, useReducedMotion } from "framer-motion";

import type { DropMode, Project, SurfaceKind, ZoneId } from "../../domain/types";
import { SURFACE_KINDS } from "../../domain/studio";
import { salonSpring } from "../motion/salonMotion";

import { DROP_ZONES, studioArtifactMeshForProject } from "./SalonSpatialShell";
import { SeaGlassArtifactSvg } from "./SeaGlassArtifactSvg";
import { SurfaceFormMotif } from "./surfaceFormMotifs";
import "./salon-shell.css";

type SalonTrayPageProps = {
  accent?: string;
  project: Project;
  pourText: string;
  onPourText: (text: string) => void;
  onPourCommit: () => void;
  draftZone: ZoneId;
  draftMode: DropMode;
  draftSurface: SurfaceKind;
  draftSurfaceTint?: string;
  draftSurfaceVariant?: string;
  draftTextColor: string;
  draftTextFont: "etching" | "serif" | "script";
  onDraftZone: (z: ZoneId) => void;
  onDraftMode: (m: DropMode) => void;
  onDraftSurface: (s: SurfaceKind) => void;
  onDraftSurfaceTint: (t: string) => void;
  onDraftSurfaceVariant: (v: string) => void;
  onDraftTextColor: (c: string) => void;
  onDraftTextFont: (f: "etching" | "serif" | "script") => void;
  onClose: () => void;
};

function ZoneGlyph({ zone }: { zone: ZoneId }) {
  switch (zone) {
    case "Pocket":
      return (
        <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden>
          <path
            d="M6 10c0-3 2.5-5 10-5s10 2 10 5v12c0 2.5-2 4.5-10 4.5S6 24.5 6 22V10z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
            opacity="0.88"
          />
          <path d="M8 14h16" stroke="currentColor" strokeWidth="1" opacity="0.35" strokeLinecap="round" />
        </svg>
      );
    case "Thread":
      return (
        <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden>
          <path
            d="M8 22c4-8 12-8 16-16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            opacity="0.88"
          />
          <circle cx="10" cy="20" r="2.25" fill="currentColor" opacity="0.5" />
          <circle cx="22" cy="10" r="2.25" fill="currentColor" opacity="0.42" />
        </svg>
      );
    case "Mirror":
      return (
        <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden>
          <ellipse cx="16" cy="15" rx="8.5" ry="11" fill="none" stroke="currentColor" strokeWidth="1.35" opacity="0.88" />
          <path d="M12 11c2.2 1.8 5.8 1.8 8 0" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.35" strokeLinecap="round" />
        </svg>
      );
    case "Spark":
    default:
      return (
        <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden>
          <path
            d="M16 4l1.8 6.4L24 14l-6.2 1.6L16 22l-1.8-6.4L8 14l6.2-1.6L16 4z"
            fill="currentColor"
            opacity="0.72"
          />
        </svg>
      );
  }
}

function ModeLongGlyph() {
  return (
    <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden>
      <path d="M7 10h18M7 16h18M7 22h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.88" />
    </svg>
  );
}

function ModeQuickGlyph() {
  return (
    <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden>
      <path
        d="M18 4L9 15h6l-2 13 11-14h-6l2-10z"
        fill="currentColor"
        opacity="0.78"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SalonTrayPage({
  accent,
  project,
  pourText,
  onPourText,
  onPourCommit,
  draftZone,
  draftMode,
  draftSurface,
  draftSurfaceTint,
  draftSurfaceVariant,
  draftTextColor,
  draftTextFont,
  onDraftZone,
  onDraftMode,
  onDraftSurface,
  onDraftSurfaceTint,
  onDraftSurfaceVariant,
  onDraftTextColor,
  onDraftTextFont,
  onClose,
}: SalonTrayPageProps) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const bouquetVariants: { id: string }[] = [
    { id: "bouquet-porcelain-pastel" },
    { id: "bouquet-baby-blue" },
    { id: "bouquet-apricot-lily" },
    { id: "bouquet-lavender-mist" },
    { id: "bouquet-spring-meadow" },
  ];

  const presetInkForFont: Record<SalonTrayPageProps["draftTextFont"], { value: string }> = {
    etching: { value: "#26344e" },
    serif: { value: "#3a2d28" },
    script: { value: "#5a2c3a" },
  };

  const inkFont =
    draftTextFont === "etching"
      ? `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`
      : draftTextFont === "script"
        ? `"Bickham Script Pro", "Edwardian Script ITC", "Palace Script MT", "Segoe Script", cursive`
        : `var(--font-serif)`;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const id = window.setTimeout(() => editorRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      className="salon-compose-page"
      style={
        {
          ["--salon-accent" as never]: accent ?? "#a59bb0",
        } as CSSProperties
      }
    >
      <div className="salon-compose-page__marble" aria-hidden />
      <div className="salon-compose-page__plush" aria-hidden />
      <div className="salon-compose-page__gem" aria-hidden>
        <SeaGlassArtifactSvg
          uid={`gem-${uid}`}
          tint={accent ?? "rgba(175, 155, 205, 0.5)"}
          finish={project.artifactFinish ?? "opal"}
        />
      </div>
      <div className="salon-compose-page__hud">
        <motion.button
          type="button"
          className="salon-compose-page__exit"
          onClick={onClose}
          aria-label="關閉撰寫"
          whileHover={reduce ? undefined : { y: -2, transition: salonSpring }}
          whileTap={reduce ? undefined : { scale: 0.98, transition: salonSpring }}
        >
          <span className="salon-compose-page__exit-glyph" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M14 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="salon-compose-page__exit-text">返回</span>
        </motion.button>
        <p className="salon-compose-page__title">Compose</p>
      </div>

      <div className="salon-compose-page__frame" data-uid={uid}>
        <div className="salon-compose-desk">
          <header className="salon-compose-desk__mast">
            <div className="salon-compose-altar" aria-label={`Project ${project.name}`}>
              <motion.div
                className="salon-compose-altar__float"
                animate={reduce ? undefined : { y: [0, -4, 0] }}
                transition={reduce ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="salon-compose-altar__mesh salon-artifact__mesh">
                  {studioArtifactMeshForProject(project, `compose-${uid}`)}
                </div>
                <div className="salon-compose-altar__meta">
                  <p className="salon-compose-altar__name">{project.name}</p>
                  {project.subtitle?.trim() ? (
                    <p className="salon-compose-altar__sub">{project.subtitle.trim()}</p>
                  ) : null}
                </div>
              </motion.div>
            </div>
          </header>

          <main className="salon-jot" aria-label="Writing area">
            <div className="salon-jot__surface" aria-hidden>
              <SurfaceFormMotif
                kind={draftSurface}
                variant="pour"
                flavor={draftSurface === "bouquet-spray" ? draftSurfaceVariant : undefined}
                className="salon-jot__surface-motif"
              />
            </div>
            <textarea
              ref={editorRef}
              className="salon-jot__editor"
              value={pourText}
              onChange={(e) => onPourText(e.target.value)}
              placeholder="隨手記下…"
              spellCheck={false}
              style={{ color: draftTextColor, fontFamily: inkFont } as CSSProperties}
            />
            <div className="salon-jot__footer">
              <button
                type="button"
                className="salon-jot__commit"
                onClick={() => {
                  onPourCommit();
                  onClose();
                }}
              >
                安放
              </button>
            </div>
          </main>
        </div>

        <aside className="salon-rack" aria-label="Format tools">
          <div className="salon-rack__section">
            <div className="salon-rack__icons" role="group" aria-label="Destination">
              {DROP_ZONES.map((z) => (
                <motion.button
                  key={z.id}
                  type="button"
                  className={`salon-rack__iconbtn ${draftZone === z.id ? "is-active" : ""}`}
                  onClick={() => onDraftZone(z.id)}
                  aria-pressed={draftZone === z.id}
                  aria-label={`${z.label} · ${z.hint}`}
                  title={`${z.label} — ${z.hint}`}
                  whileHover={reduce ? undefined : { scale: 1.04, transition: salonSpring }}
                  whileTap={reduce ? undefined : { scale: 0.96, transition: salonSpring }}
                >
                  <ZoneGlyph zone={z.id} />
                </motion.button>
              ))}
            </div>
          </div>

          <div className="salon-rack__section">
            <div className="salon-rack__icons" role="group" aria-label="Capture length">
              <motion.button
                type="button"
                className={`salon-rack__iconbtn salon-rack__iconbtn--wide ${draftMode === "RawPour" ? "is-active" : ""}`}
                onClick={() => onDraftMode("RawPour")}
                aria-pressed={draftMode === "RawPour"}
                aria-label="長注模式"
                title="長注"
                whileHover={reduce ? undefined : { scale: 1.03, transition: salonSpring }}
                whileTap={reduce ? undefined : { scale: 0.97, transition: salonSpring }}
              >
                <ModeLongGlyph />
              </motion.button>
              <motion.button
                type="button"
                className={`salon-rack__iconbtn salon-rack__iconbtn--wide ${draftMode === "QuickDrop" ? "is-active" : ""}`}
                onClick={() => onDraftMode("QuickDrop")}
                aria-pressed={draftMode === "QuickDrop"}
                aria-label="快記模式"
                title="快記"
                whileHover={reduce ? undefined : { scale: 1.03, transition: salonSpring }}
                whileTap={reduce ? undefined : { scale: 0.97, transition: salonSpring }}
              >
                <ModeQuickGlyph />
              </motion.button>
            </div>
          </div>

          <div className="salon-rack__section salon-rack__section--grow">
            <div className="salon-rack__swatchgrid" role="group" aria-label="Surface form">
              {SURFACE_KINDS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`salon-rack__surf ${draftSurface === s.id ? "is-active" : ""}`}
                  onClick={() => {
                    onDraftSurface(s.id);
                    if (s.id === "bouquet-spray" && !draftSurfaceVariant) onDraftSurfaceVariant("bouquet-porcelain-pastel");
                  }}
                  aria-pressed={draftSurface === s.id}
                  aria-label={`${s.label}. ${s.hint}`}
                  title={`${s.label} — ${s.hint}`}
                >
                  <SurfaceFormMotif kind={s.id} variant="swatch" className="salon-rack__surf-motif" />
                </button>
              ))}
            </div>

            {draftSurface === "bouquet-spray" ? (
              <div className="salon-rack__bouquet" role="group" aria-label="Bouquet palette">
                {bouquetVariants.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`salon-rack__bouquet-chip ${draftSurfaceVariant === b.id ? "is-active" : ""}`}
                    onClick={() => onDraftSurfaceVariant(b.id)}
                    aria-pressed={draftSurfaceVariant === b.id}
                    aria-label={`Bouquet variant ${b.id.replace("bouquet-", "").replace(/-/g, " ")}`}
                  >
                    <SurfaceFormMotif kind="bouquet-spray" variant="swatch" flavor={b.id} className="salon-rack__bouquet-motif" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="salon-rack__section">
            <div className="salon-rack__icons" role="group" aria-label="Typeface">
              {(
                [
                  ["etching", "Etching"],
                  ["serif", "Serif"],
                  ["script", "Script"],
                ] as const
              ).map(([f, name]) => (
                <button
                  key={f}
                  type="button"
                  className={`salon-rack__aa ${draftTextFont === f ? "is-active" : ""}`}
                  onClick={() => {
                    onDraftTextFont(f);
                    onDraftTextColor(presetInkForFont[f].value);
                  }}
                  aria-pressed={draftTextFont === f}
                  aria-label={name}
                  title={name}
                  style={
                    {
                      fontFamily:
                        f === "etching"
                          ? `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`
                          : f === "script"
                            ? `"Bickham Script Pro", "Edwardian Script ITC", "Segoe Script", cursive`
                            : `var(--font-serif)`,
                    } as CSSProperties
                  }
                >
                  Aa
                </button>
              ))}
            </div>
          </div>

          <div className="salon-rack__section">
            <div className="salon-rack__inkrow">
              <label className="salon-rack__ink-dot" title="Ink">
                <span className="salon-rack__ink-dot-inner" style={{ background: draftTextColor }} aria-hidden />
                <span className="salon-rack__sr">Ink color</span>
                <input
                  className="salon-rack__color-overlay"
                  type="color"
                  value={draftTextColor}
                  onChange={(e) => onDraftTextColor(e.target.value)}
                  aria-label="Ink color"
                />
              </label>
            </div>
          </div>

          {draftSurface === "silk-ribbon" ? (
            <div className="salon-rack__section">
              <div className="salon-rack__inkrow">
                <label className="salon-rack__ink-dot salon-rack__ink-dot--ribbon" title="Ribbon dye">
                  <span
                    className="salon-rack__ink-dot-inner"
                    style={{ background: draftSurfaceTint ?? "#c4a574" }}
                    aria-hidden
                  />
                  <span className="salon-rack__sr">Ribbon color</span>
                  <input
                    className="salon-rack__color-overlay"
                    type="color"
                    value={draftSurfaceTint ?? "#c4a574"}
                    onChange={(e) => onDraftSurfaceTint(e.target.value)}
                    aria-label="Ribbon color"
                  />
                </label>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
