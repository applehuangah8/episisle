import { useEffect, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";

import type { ArtifactFinish, StudioArtifact, SurfaceKind } from "../../domain/types";
import { STUDIO_ARTIFACTS } from "../../domain/studio";
import { salonSpring } from "../motion/salonMotion";
import { StudioArtifactGlyph } from "./StudioArtifactGlyph";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (opts: {
    name: string;
    subtitle?: string;
    status?: string;
    studioArtifact: StudioArtifact;
    defaultSurface: SurfaceKind;
    artifactTint?: string;
    artifactFinish?: ArtifactFinish;
  }) => void;
  reduce: boolean;
};

export function AddProjectSalon({ open, onClose, onCreate, reduce }: Props) {
  const [projectName, setProjectName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [status, setStatus] = useState("");
  const [artifact, setArtifact] = useState<StudioArtifact>("glass-cloche");
  const [tint, setTint] = useState("#a59bb0");
  const [finish, setFinish] = useState<ArtifactFinish>("opal");

  useEffect(() => {
    if (!open) return;
    setProjectName("");
    setSubtitle("");
    setStatus("");
    setArtifact("glass-cloche");
    setTint("#a59bb0");
    setFinish("opal");
  }, [open]);

  if (!open) return null;

  return (
    <div className="salon-add-overlay" role="dialog" aria-modal="true" aria-labelledby="salon-add-title">
      <button type="button" className="salon-add-overlay__scrim" onClick={onClose} aria-label="關閉" />
      <motion.div
        className="salon-add-panel"
        style={{ ["--salon-accent" as never]: tint } as CSSProperties}
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={salonSpring}
      >
        <header className="salon-add-panel__head">
          <p className="salon-add-panel__eyebrow">策展入口</p>
          <h2 id="salon-add-title" className="salon-add-panel__title">
            新增一間沙龍
          </h2>
          <p className="salon-add-panel__lede">
            先為專案<strong>命名</strong>，再選<strong>主視覺擺件</strong>與<strong>筆記質地</strong>。副標與狀態可留白。
          </p>
        </header>

        <section className="salon-add-section salon-add-section--fields" aria-labelledby="salon-add-identity-label">
          <div className="salon-add-section__rail">
            <h3 id="salon-add-identity-label" className="salon-add-section__title">
              命名
            </h3>
          </div>
          <label className="salon-meta-field">
            <span className="salon-meta-field__label">專案名稱 · 必填</span>
            <input
              className="salon-meta-field__input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              maxLength={96}
              autoComplete="off"
              placeholder="例如 Project Aura Musée"
            />
          </label>
          <label className="salon-meta-field">
            <span className="salon-meta-field__label">副標題 · 選填</span>
            <input
              className="salon-meta-field__input"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              maxLength={120}
              autoComplete="off"
              placeholder="例如 穿搭宇宙"
            />
          </label>
          <label className="salon-meta-field">
            <span className="salon-meta-field__label">狀態 · 選填</span>
            <input
              className="salon-meta-field__input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              maxLength={48}
              autoComplete="off"
              placeholder="例如 暫緩中"
            />
          </label>
        </section>

        <section className="salon-add-section" aria-labelledby="salon-add-artifact-label">
          <div className="salon-add-section__rail">
            <h3 id="salon-add-artifact-label" className="salon-add-section__title">
              主視覺擺件
            </h3>
            <span className="salon-add-section__meta">架上與中央場景會使用同一件</span>
          </div>
          <div className="salon-add-grid" role="list">
            {STUDIO_ARTIFACTS.map((a) => (
              <label
                key={a.id}
                className={`salon-add-card salon-add-card--${a.id} ${artifact === a.id ? "is-chosen" : ""}`}
                role="listitem"
              >
                <input
                  type="radio"
                  name="studio-artifact"
                  value={a.id}
                  checked={artifact === a.id}
                  onChange={() => setArtifact(a.id)}
                  aria-label={a.title}
                />
                <span className={`salon-add-card__glyph salon-add-card__glyph--${a.id}`} aria-hidden>
                  <StudioArtifactGlyph kind={a.id} tint={tint} finish={finish} />
                </span>
                <span className="salon-add-card__title">{a.title}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="salon-add-section" aria-labelledby="salon-add-tint-label">
          <div className="salon-add-section__rail">
            <h3 id="salon-add-tint-label" className="salon-add-section__title">
              擺件色澤
            </h3>
            <span className="salon-add-section__meta">像天文儀核心的光，會跟著這間沙龍</span>
          </div>
          <div className="salon-add-tint">
            <div className="salon-add-combo-preview" aria-label="擺件組合預覽">
              <div className={`salon-add-combo-preview__well salon-add-combo-preview__well--${artifact}`} aria-hidden>
                <span className="salon-add-combo-preview__glyph">
                  <StudioArtifactGlyph kind={artifact} tint={tint} finish={finish} />
                </span>
              </div>
              <div className="salon-add-combo-preview__meta scenography-type" aria-hidden>
                <span className="salon-add-combo-preview__title">{STUDIO_ARTIFACTS.find((a) => a.id === artifact)?.title ?? "擺件"}</span>
                <span className="salon-add-combo-preview__sub type-elegant-caps">{finish}</span>
                <span className="salon-add-combo-preview__dot" />
                <span className="salon-add-combo-preview__hex type-elegant-caps">{tint.toUpperCase()}</span>
              </div>
            </div>
            <div className="salon-add-tint__row" role="list" aria-label="Accent color choices">
              {(
                [
                  { finish: "opal", color: "#a59bb0", label: "蛋白石" },
                  { finish: "silk", color: "#c6b3d8", label: "絲緞" },
                  { finish: "brass", color: "#c4a574", label: "黃銅" },
                  { finish: "frost", color: "#9db7d6", label: "毛玻璃" },
                  { finish: "crystal", color: "#7fa39c", label: "水晶" },
                  { finish: "sea-glass", color: "#c9a6b6", label: "反果玻璃" },
                ] as const
              ).map((p) => (
                <button
                  key={`${p.finish}-${p.color}`}
                  type="button"
                  data-finish={p.finish}
                  style={{ ["--tint" as never]: p.color } as CSSProperties}
                  className={`salon-add-tint__stone ${tint.toLowerCase() === p.color.toLowerCase() ? "is-active" : ""}`}
                  onClick={() => {
                    setFinish(p.finish);
                    setTint(p.color);
                  }}
                  aria-label={`選擇 ${p.label} 色澤 ${p.color}`}
                  title={p.label}
                />
              ))}
            </div>
            <label className="salon-add-tint__picker">
              <span className="salon-add-tint__picker-label scenography-type type-elegant-caps">自訂</span>
              <input
                type="color"
                value={tint}
                onChange={(e) => {
                  setFinish("opal");
                  setTint(e.target.value);
                }}
                aria-label="自訂色澤"
              />
            </label>
          </div>
        </section>

        <div className="salon-add-actions">
          <button type="button" className="salon-add-cancel" onClick={onClose}>
            取消
          </button>
          <motion.button
            type="button"
            className="salon-add-confirm"
            disabled={!projectName.trim()}
            onClick={() =>
              onCreate({
                name: projectName.trim(),
                subtitle: subtitle.trim() || undefined,
                status: status.trim() || undefined,
                studioArtifact: artifact,
                defaultSurface: "frosted-plaque",
                artifactTint: tint,
                artifactFinish: finish,
              })
            }
            whileHover={reduce ? undefined : { y: -2, transition: salonSpring }}
          >
            建立沙龍
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
