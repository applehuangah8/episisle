import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";

import type { BlockModule } from "@/core/types";
import { useStore } from "@/store/useStore";

type NextMod = Extract<BlockModule, { type: "next" }>;

const inputClass =
  "min-w-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-epis-ink/85 outline-none ring-0 focus:outline-none focus:ring-0";

function useAutosize(textareaRef: React.RefObject<HTMLTextAreaElement | null>, value: string, editing: boolean) {
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el || !editing) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 22)}px`;
  }, [textareaRef, value, editing]);
}

export const NextModule = memo(function NextModuleInner({
  mod,
  blockId,
  placementId,
  moduleIndex,
}: {
  mod: NextMod;
  blockId: string;
  placementId: string;
  moduleIndex: number;
}) {
  const text = typeof mod.text === "string" ? mod.text : "";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateBlockContent = useStore((s) => s.updateBlockContent);
  const setEditingPlacementId = useStore((s) => s.setEditingPlacementId);

  useAutosize(textareaRef, draft, editing);

  const commit = useCallback(() => {
    updateBlockContent(blockId, moduleIndex, draft);
    setEditing(false);
    setEditingPlacementId(null);
  }, [blockId, draft, moduleIndex, setEditingPlacementId, updateBlockContent]);

  const startEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setDraft(text);
      setEditing(true);
      setEditingPlacementId(placementId);
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      });
    },
    [placementId, setEditingPlacementId, text]
  );

  if (editing) {
    return (
      <div className="epis-brick epis-brick-glass rounded-2xl p-3 text-sm" data-epis-no-drag>
        <div className="flex items-start gap-2">
          <span className="shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wide text-epis-ink/50">
            next
          </span>
          <textarea
            ref={textareaRef}
            className={inputClass}
            rows={1}
            value={draft}
            spellCheck={false}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDraft(text);
                setEditing(false);
                setEditingPlacementId(null);
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commit();
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="epis-brick epis-brick-glass cursor-text select-none rounded-2xl p-3 text-sm"
      data-epis-dblclick-edit
      onMouseDownCapture={(e) => {
        if (e.detail >= 2) e.preventDefault();
      }}
      onDoubleClick={startEdit}
      role="presentation"
    >
      <div className="flex items-start gap-2">
        <span className="shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wide text-epis-ink/50">
          next
        </span>
        <p className="min-w-0 flex-1 whitespace-pre-wrap leading-relaxed text-epis-ink/85">
          {text.trim() ? text : "（雙擊編輯）"}
        </p>
      </div>
    </div>
  );
});
