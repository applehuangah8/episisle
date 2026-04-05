import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { BlockModule } from "@/core/types";
import {
  EPIS_FOCUS_CONTENT_MODULE,
  type EpisFocusContentModuleDetail,
} from "@/dom/episContentEditEvents";
import { useStore } from "@/store/useStore";

type ContentMod = Extract<BlockModule, { type: "content" }>;

const textareaBaseClass =
  "w-full resize-none border-0 bg-transparent p-0 text-sm leading-relaxed text-epis-ink/85 outline-none ring-0 focus:outline-none focus:ring-0";

function useAutosize(textareaRef: React.RefObject<HTMLTextAreaElement | null>, value: string, editing: boolean) {
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el || !editing) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 24)}px`;
  }, [textareaRef, value, editing]);
}

export const ContentModule = memo(function ContentModuleInner({
  mod,
  blockId,
  placementId,
  moduleIndex,
  isPrimaryContent,
}: {
  mod: ContentMod;
  blockId: string;
  placementId: string;
  moduleIndex: number;
  isPrimaryContent: boolean;
}) {
  const text = typeof mod.content === "string" ? mod.content : "";
  const lines = text.split("\n");
  const title = lines.length > 1 ? lines[0]!.trim() : "內容";
  const body = lines.length > 1 ? lines.slice(1).join("\n").trim() : text;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const didAutoFocusRef = useRef(false);

  const updateBlockContent = useStore((s) => s.updateBlockContent);
  const setEditingPlacementId = useStore((s) => s.setEditingPlacementId);
  const clearPendingContentFocus = useStore((s) => s.clearPendingContentFocus);

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

  useLayoutEffect(() => {
    if (didAutoFocusRef.current || editing || text !== "") return;
    if (!isPrimaryContent) return;
    const gallery = placementId.startsWith("epis-gallery:");
    const pending = useStore.getState().pendingContentFocusPlacementId;
    const fromNewBlock = pending === placementId;
    if (!gallery && !fromNewBlock) return;
    didAutoFocusRef.current = true;
    if (fromNewBlock) clearPendingContentFocus();
    setDraft(text);
    setEditing(true);
    setEditingPlacementId(placementId);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, [
    clearPendingContentFocus,
    editing,
    isPrimaryContent,
    placementId,
    setEditingPlacementId,
    text,
  ]);

  useEffect(() => {
    const onFocus = (ev: Event) => {
      const ce = ev as CustomEvent<EpisFocusContentModuleDetail>;
      const d = ce.detail;
      if (!d || d.placementId !== placementId || d.moduleIndex !== moduleIndex) return;
      startEdit({
        stopPropagation() {},
        preventDefault() {},
      } as React.MouseEvent);
    };
    document.addEventListener(EPIS_FOCUS_CONTENT_MODULE, onFocus);
    return () => document.removeEventListener(EPIS_FOCUS_CONTENT_MODULE, onFocus);
  }, [placementId, moduleIndex, startEdit]);

  if (editing) {
    return (
      <div className="epis-brick epis-brick-glass rounded-2xl p-3 text-sm" data-epis-no-drag>
        <textarea
          ref={textareaRef}
          className={textareaBaseClass}
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
            if (e.key === "Enter" && !draft.includes("\n") && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
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
      {lines.length > 1 ? (
        <>
          <div className="text-xs font-medium text-epis-ink/60">{title}</div>
          <p className="mt-1 whitespace-pre-wrap leading-relaxed text-epis-ink/85">
            {body || "（雙擊編輯）"}
          </p>
        </>
      ) : (
        <p className="whitespace-pre-wrap leading-relaxed text-epis-ink/85">
          {body || "（雙擊編輯）"}
        </p>
      )}
    </div>
  );
});
