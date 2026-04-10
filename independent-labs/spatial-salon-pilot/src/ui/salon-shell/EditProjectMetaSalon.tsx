import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import type { Project } from "../../domain/types";
import { salonSpring } from "../motion/salonMotion";

type Props = {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSave: (patch: { name: string; subtitle: string; status: string }) => void;
  reduce: boolean;
};

export function EditProjectMetaSalon({ open, project, onClose, onSave, reduce }: Props) {
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!open || !project) return;
    setName(project.name);
    setSubtitle(project.subtitle ?? "");
    setStatus(project.status ?? "");
  }, [open, project?.id, project?.name, project?.subtitle, project?.status]);

  if (!open || !project) return null;

  return (
    <div className="salon-add-overlay" role="dialog" aria-modal="true" aria-labelledby="salon-edit-title">
      <button type="button" className="salon-add-overlay__scrim" onClick={onClose} aria-label="關閉" />
      <motion.div
        className="salon-add-panel salon-add-panel--compact"
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={salonSpring}
      >
        <header className="salon-add-panel__head">
          <p className="salon-add-panel__eyebrow">專案資訊</p>
          <h2 id="salon-edit-title" className="salon-add-panel__title">
            編輯名稱與狀態
          </h2>
          <p className="salon-add-panel__lede">抬頭、副標與狀態皆可隨時調整；留空副標或狀態即不顯示。</p>
        </header>

        <section className="salon-add-section salon-add-section--fields">
          <label className="salon-meta-field">
            <span className="salon-meta-field__label">專案名稱</span>
            <input
              className="salon-meta-field__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={96}
              autoComplete="off"
              placeholder="例如 Aura Musée"
            />
          </label>
          <label className="salon-meta-field">
            <span className="salon-meta-field__label">副標題</span>
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
            <span className="salon-meta-field__label">狀態</span>
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

        <div className="salon-add-actions">
          <button type="button" className="salon-add-cancel" onClick={onClose}>
            取消
          </button>
          <motion.button
            type="button"
            className="salon-add-confirm"
            disabled={!name.trim()}
            onClick={() => {
              onSave({ name: name.trim(), subtitle: subtitle.trim(), status: status.trim() });
              onClose();
            }}
            whileHover={reduce ? undefined : { y: -2, transition: salonSpring }}
          >
            儲存
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
