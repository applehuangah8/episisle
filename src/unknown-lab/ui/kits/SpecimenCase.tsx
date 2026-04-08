import { useMemo, useState } from "react";

import type { RefinedGem } from "@/unknown-lab/state/types";

export type SpecimenKit = {
  gemId: string;
  need: string;
  materials: string;
  next: string;
};

export function SpecimenCase({
  gem,
  kit,
  onChange,
  onExport,
  onClose,
}: {
  gem: RefinedGem;
  kit: SpecimenKit;
  onChange: (next: SpecimenKit) => void;
  onExport: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"need" | "materials" | "next">("need");

  const title = useMemo(() => gem.title || "Refined", [gem.title]);

  const field = (id: typeof tab, label: string) => {
    const active = tab === id;
    return (
      <button
        type="button"
        className={`rounded-full px-3 py-1 text-[11px] transition ${
          active ? "bg-white/10 text-[var(--unknown-text)]" : "text-[var(--unknown-text-muted)] hover:bg-white/5"
        }`}
        onClick={() => setTab(id)}
        aria-pressed={active}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="unknownGlassPanel w-[min(520px,calc(100vw-2rem))] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--unknown-text-muted)]">
            SpecimenCase
          </div>
          <div className="mt-1 truncate text-[13px] font-medium text-[var(--unknown-text)]">{title}</div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-[var(--unknown-stroke)] px-3 py-1 text-[11px] text-[var(--unknown-text)] hover:bg-white/5"
            onClick={onExport}
          >
            Export
          </button>
          <button
            type="button"
            className="rounded-full border border-[var(--unknown-stroke)] px-3 py-1 text-[11px] text-[var(--unknown-text)] hover:bg-white/5"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {field("need", "Need")}
        {field("materials", "Materials")}
        {field("next", "Next")}
      </div>

      <textarea
        value={tab === "need" ? kit.need : tab === "materials" ? kit.materials : kit.next}
        onChange={(e) => {
          const v = e.target.value;
          if (tab === "need") onChange({ ...kit, need: v });
          else if (tab === "materials") onChange({ ...kit, materials: v });
          else onChange({ ...kit, next: v });
        }}
        className="mt-3 h-36 w-full resize-none rounded-2xl border border-[var(--unknown-stroke)] bg-black/10 px-3 py-2 text-[12px] leading-relaxed text-[var(--unknown-text)] outline-none placeholder:text-[var(--unknown-text-muted)] focus:border-[var(--unknown-stroke-strong)]"
        placeholder=""
        spellCheck={false}
      />
    </div>
  );
}

