import { Archive, Landmark, LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";

import { useStore, type AppViewMode } from "@/store/useStore";

/**
 * 封存／博物館等全版子視圖專用頂欄：主畫布無 Canvas 時仍須能切回，避免僅依子頁內文按鈕卻因版面或層級看不到。
 */
export function AppSubViewChrome() {
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);

  if (viewMode === "main") return null;

  const tab = (mode: AppViewMode, label: string, icon: ReactNode) => (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
        viewMode === mode
          ? "bg-[var(--color-accent-soft)] text-[var(--color-text)]"
          : "text-[var(--color-text-muted)] hover:bg-white/70 hover:text-[var(--color-text)]"
      }`}
      aria-pressed={viewMode === mode}
      onClick={() => setViewMode(mode)}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <header
      className="pointer-events-auto fixed left-0 right-0 top-0 z-[25000] flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-panel-border)] bg-[var(--color-town-bg)]/96 px-3 py-2.5 shadow-sm backdrop-blur-md"
      role="navigation"
      aria-label="子頁導覽"
    >
      <div className="flex flex-wrap items-center gap-2">
        {tab("main", "主畫布", <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} />)}
        {tab("archive", "封存倉庫", <Archive className="h-3.5 w-3.5" strokeWidth={1.75} />)}
        {tab("musee", "靈感博物館", <Landmark className="h-3.5 w-3.5" strokeWidth={1.75} />)}
      </div>
      <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
        {viewMode === "musee" ? "展陳傳送門收入的積木" : "典籍封存項目"}
      </span>
    </header>
  );
}
