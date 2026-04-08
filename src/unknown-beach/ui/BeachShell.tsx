import { BeachScene } from "@/unknown-beach/ui/BeachScene";
import { BeachToolDock } from "@/unknown-beach/ui/BeachToolDock";

import "./beachTokens.css";

export function BeachShell() {
  return (
    <div className="relative h-full w-full" style={{ background: "var(--beach-bg)" }}>
      {/* Debug stamp: proves you're seeing the latest bundle */}
      <div className="pointer-events-none absolute left-4 top-4 z-[99999]">
        <div className="beachPanel px-3 py-2 text-[10px] leading-tight text-[var(--beach-ink)]">
          <div className="text-[11px] font-medium">UnknownBeach</div>
          <div>{window.location.origin}{window.location.pathname}</div>
          <div>build: {__BUILD_STAMP__}</div>
        </div>
      </div>
      <BeachScene />
      <BeachToolDock />
    </div>
  );
}

