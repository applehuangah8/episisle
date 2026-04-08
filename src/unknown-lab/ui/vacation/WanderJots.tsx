import { useMemo, useState } from "react";

import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";

export function WanderJots() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const jots = useUnknownLabStore((s) => s.jots);
  const addJot = useUnknownLabStore((s) => s.addJot);
  const sprinkle = useUnknownLabStore((s) => s.sprinkleJotAsOre);
  const remove = useUnknownLabStore((s) => s.removeJot);

  const count = useMemo(() => jots.length, [jots.length]);

  return (
    <div className="relative">
      <button
        type="button"
        className={`unknownJots ${open ? "unknownJots--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="旅人隨筆"
      >
        <span className="unknownJotsMark" aria-hidden />
        {count ? <span className="unknownJotsCount" aria-hidden>{count}</span> : null}
      </button>

      {open ? (
        <div className="unknownJotsPanel unknownGlassPanel absolute bottom-14 left-0 w-[min(340px,calc(100vw-2.5rem))] p-3">
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              className="w-full rounded-full border border-[var(--unknown-stroke)] bg-black/10 px-3 py-2 text-[12px] text-[var(--unknown-text)] outline-none focus:border-[var(--unknown-stroke-strong)]"
              placeholder=""
            />
            <button
              type="button"
              className="rounded-full border border-[var(--unknown-stroke)] px-3 py-2 text-[11px] text-[var(--unknown-text)] hover:bg-white/5"
              onClick={() => {
                addJot(draft);
                setDraft("");
              }}
              aria-label="新增隨筆"
            >
              +
            </button>
          </div>

          <div className="mt-3 max-h-[220px] space-y-2 overflow-auto pr-1">
            {jots.length === 0 ? (
              <div className="text-[11px] text-[var(--unknown-text-muted)]"> </div>
            ) : null}
            {jots.map((j) => (
              <div key={j.id} className="flex items-start gap-2 rounded-2xl border border-[var(--unknown-stroke)] bg-black/10 px-3 py-2">
                <div className="min-w-0 flex-1 text-[12px] leading-relaxed text-[var(--unknown-text)]">
                  {j.text}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="rounded-full border border-[var(--unknown-stroke)] px-2 py-1 text-[10px] text-[var(--unknown-text)] hover:bg-white/5"
                    onClick={() => sprinkle(j.id)}
                    aria-label="撒回桌面"
                    title="撒回桌面"
                  >
                    ↗
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[var(--unknown-stroke)] px-2 py-1 text-[10px] text-[var(--unknown-text-muted)] hover:bg-white/5 hover:text-[var(--unknown-text)]"
                    onClick={() => remove(j.id)}
                    aria-label="刪除"
                    title="刪除"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

