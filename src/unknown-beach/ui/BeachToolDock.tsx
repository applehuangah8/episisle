import { useState } from "react";

export function BeachToolDock() {
  const [open, setOpen] = useState<null | "postcard" | "jots" | "camera" | "bag" | "relax">(null);

  const chip = (id: NonNullable<typeof open>, label: string) => (
    <button
      key={id}
      type="button"
      className={`beachToolChip ${open === id ? "beachToolChip--active" : ""}`}
      onClick={() => setOpen((v) => (v === id ? null : id))}
      aria-label={label}
    >
      <div className="beachMicroLabel">{label}</div>
    </button>
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="pointer-events-auto absolute bottom-5 right-5 flex items-center gap-2">
        {chip("postcard", "旅籤")}
        {chip("jots", "隨筆")}
        {/* Replace the two next to 隨筆 (旅印/坩堝) temporarily */}
        {chip("camera", "相機")}
        {chip("bag", "背包")}
        {chip("relax", "放鬆")}
      </div>

      {open ? (
        <div className="pointer-events-auto absolute bottom-20 right-5 w-[min(360px,calc(100vw-2.5rem))] beachPanel px-3 py-3">
          {open === "postcard" ? (
            <div className="space-y-2">
              <div className="beachMicroLabel">旅籤</div>
              <div className="text-[12px] text-[var(--beach-ink)]/80">
                之後會在這裡做「選世界/換場景」的具像化明信片。
              </div>
            </div>
          ) : null}
          {open === "jots" ? (
            <div className="space-y-2">
              <div className="beachMicroLabel">隨筆</div>
              <div className="text-[12px] text-[var(--beach-ink)]/80">
                之後會在這裡寫下度假靈感，並可「撒回沙地」變成原石。
              </div>
            </div>
          ) : null}
          {open === "camera" ? (
            <div className="space-y-2">
              <div className="beachMicroLabel">相機</div>
              <div className="text-[12px] text-[var(--beach-ink)]/80">
                之後會在這裡做「拍一張此刻的微縮場景」作為靈感快照。
              </div>
            </div>
          ) : null}
          {open === "bag" ? (
            <div className="space-y-2">
              <div className="beachMicroLabel">背包</div>
              <div className="text-[12px] text-[var(--beach-ink)]/80">
                之後會在這裡查看你收集的原石/寶石與小道具。
              </div>
            </div>
          ) : null}
          {open === "relax" ? (
            <div className="space-y-2">
              <div className="beachMicroLabel">放鬆</div>
              <div className="text-[12px] text-[var(--beach-ink)]/80">
                之後會在這裡切換度假氛圍（光、風、海聲），讓你進入放空狀態但不鎖任何功能。
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

