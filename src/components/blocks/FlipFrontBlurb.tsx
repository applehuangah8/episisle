import { useCallback, useEffect, useRef, useState } from "react";

import type { RenderBlock } from "@/core/types";
import { useStore } from "@/store/useStore";

/** Downtown 翻面卡立面：未寫入存檔時顯示的預設測試句 */
export const DEFAULT_TOWN_FLIP_FRONT_BLURB =
  "鹹水泥味混著廣播殘響，月台邊角有張被遺忘的綜合音樂季海報。";

/** 野域翻面卡立面：未寫入存檔時顯示的預設測試句 */
export const DEFAULT_WILD_FLIP_FRONT_BLURB =
  "松針上的露水還沒蒸發，風就先翻過了下一座山稜。";

type FlipFrontBlurbProps = {
  model: RenderBlock;
  /** `placement.ui.frontBlurb` 為空時使用 */
  defaultBlurb: string;
};

/**
 * 翻面卡立面大塊文字區：雙擊進入編輯，內容存於 `placement.ui.frontBlurb`。
 */
export function FlipFrontBlurb({ model, defaultBlurb }: FlipFrontBlurbProps) {
  const placementId = model.placement.id;
  const stored = model.placement.ui?.frontBlurb;
  const text = stored !== undefined ? stored : defaultBlurb;
  const setPlacementFrontBlurb = useStore((s) => s.setPlacementFrontBlurb);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(text);
  }, [editing, text]);

  const commit = useCallback(() => {
    setPlacementFrontBlurb(placementId, draft);
    setEditing(false);
  }, [placementId, draft, setPlacementFrontBlurb]);

  const start = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setDraft(text);
      setEditing(true);
      requestAnimationFrame(() => {
        taRef.current?.focus();
        taRef.current?.select();
      });
    },
    [text]
  );

  if (editing) {
    return (
      <div
        className="min-h-0 flex-1 overflow-hidden px-3 pb-3"
        data-epis-no-drag
        onPointerDown={(e) => e.stopPropagation()}
      >
        <textarea
          ref={taRef}
          data-epis-no-drag
          className="min-h-[5rem] w-full resize-y rounded-lg border border-[var(--color-panel-border)]/55 bg-white/55 px-2.5 py-2 text-xs leading-relaxed text-epis-ink/85 outline-none ring-0 focus:border-[var(--color-accent)]/35"
          value={draft}
          spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(text);
              setEditing(false);
              return;
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
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
      className="min-h-0 flex-1 overflow-hidden px-3 pb-3"
      data-epis-dblclick-edit
      onMouseDownCapture={(e) => {
        if (e.detail >= 2) e.preventDefault();
      }}
      onDoubleClick={start}
      role="presentation"
    >
      <p className="min-h-[5rem] cursor-text select-none whitespace-pre-wrap text-xs leading-relaxed text-epis-ink/52">
        {text}
      </p>
    </div>
  );
}
