import { useCallback, useEffect, useRef, useState } from "react";

import type { BlockModule } from "@/core/types";
import { useStore } from "@/store/useStore";

/** 非內建 type 的模組預覽（可擴充協定） */
export function ExtensionModule({
  mod,
  blockId,
  moduleIndex,
}: {
  mod: BlockModule;
  blockId: string;
  moduleIndex: number;
}) {
  const data = "data" in mod ? mod.data : undefined;
  const raw = data === undefined ? "" : JSON.stringify(data, null, 2);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(raw);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateBlock = useStore((s) => s.updateBlock);

  useEffect(() => {
    if (!editing) setDraft(raw);
  }, [editing, raw]);

  const commit = useCallback(() => {
    const st = useStore.getState();
    const prev = st.blocks[blockId];
    if (!prev) {
      setEditing(false);
      return;
    }
    const mods = [...prev.modules];
    if (moduleIndex < 0 || moduleIndex >= mods.length) {
      setEditing(false);
      return;
    }
    const trimmed = draft.trim();
    let parsed: unknown;
    try {
      parsed = trimmed === "" ? undefined : JSON.parse(trimmed);
    } catch {
      setDraft(raw);
      setEditing(false);
      return;
    }
    const nextType = mods[moduleIndex]!.type;
    mods[moduleIndex] = { type: nextType, data: parsed } as BlockModule;
    updateBlock(blockId, { modules: mods });
    setEditing(false);
  }, [blockId, draft, moduleIndex, raw, updateBlock]);

  const start = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraft(raw);
    setEditing(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [raw]);

  if (editing) {
    return (
      <div className="epis-brick epis-brick-glass rounded-2xl border-dashed border-epis-ink/25 bg-[var(--color-town-bg)]/55 p-3">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-epis-ink/45">ext · {mod.type}</div>
        <textarea
          ref={textareaRef}
          data-epis-no-drag
          className="min-h-[120px] w-full resize-y rounded-lg border border-[var(--color-panel-border)]/60 bg-white/70 p-2 font-mono text-xs text-epis-ink/85 outline-none ring-0 focus:border-[var(--color-accent)]/40"
          spellCheck={false}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(raw);
              setEditing(false);
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
        <p className="mt-1.5 text-[10px] text-epis-ink/40">離開欄位即儲存；Esc 取消</p>
      </div>
    );
  }

  return (
    <div
      className="epis-brick epis-brick-glass cursor-pointer select-none rounded-2xl border-dashed border-epis-ink/20 bg-[var(--color-town-bg)]/55 p-3 font-mono text-xs text-epis-ink/70"
      data-epis-dblclick-edit
      onMouseDownCapture={(e) => {
        if (e.detail >= 2) e.preventDefault();
      }}
      onDoubleClick={start}
      title="雙擊編輯 JSON"
      role="presentation"
    >
      <div className="mb-1 text-[10px] uppercase tracking-wider text-epis-ink/45">
        ext · {mod.type}
      </div>
      <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-all">
        {data === undefined ? "—" : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
