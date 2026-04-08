import {
  ChevronLeft,
  EyeOff,
  File,
  Instagram,
  Minus,
  Move,
  Plus,
  Youtube,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  type ChangeEvent,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

import { DowntownBlankWorkspace } from "@/components/DowntownBlankWorkspace";
import { DowntownIgGrid, DowntownYtGrid } from "@/components/DowntownIgGrid";
import { useStore, type AestheticsHubMode } from "@/store/useStore";

function DowntownWidthResizeHandle() {
  const pct = useStore((s) => s.downtownPanelWidthPercent);
  const setPct = useStore((s) => s.setDowntownPanelWidthPercent);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startPct = useRef(0);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      startX.current = e.clientX;
      startPct.current = pct;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pct]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!dragging.current) return;
      const col = document.querySelector("[data-epis-main-column]");
      if (!(col instanceof HTMLElement)) return;
      const w = col.getBoundingClientRect().width;
      if (w < 120) return;
      const dx = e.clientX - startX.current;
      const next = startPct.current - (dx / w) * 100;
      setPct(next);
    },
    [setPct]
  );

  const onPointerUp = useCallback((e: ReactPointerEvent) => {
    dragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div
      className="group relative z-[6] w-2 shrink-0 cursor-col-resize border-x border-transparent bg-transparent transition hover:border-[var(--color-panel-border)]/40 hover:bg-[var(--color-accent-soft)]/15"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="separator"
      aria-orientation="vertical"
      aria-label="調整 Downtown 欄寬"
    >
      <div className="absolute left-1/2 top-1/4 h-1/2 w-0.5 -translate-x-1/2 rounded-full bg-[var(--color-stroke)]/25 opacity-60 group-hover:opacity-100" />
    </div>
  );
}

function BlankModeControls() {
  const url = useStore((s) => s.blankCanvasBgUrl);
  const opacity = useStore((s) => s.blankCanvasBgOpacity);
  const brightness = useStore((s) => s.blankCanvasBgBrightness);
  const setUrl = useStore((s) => s.setBlankCanvasBgUrl);
  const setOpacity = useStore((s) => s.setBlankCanvasBgOpacity);
  const setBrightness = useStore((s) => s.setBlankCanvasBgBrightness);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") setUrl(reader.result);
      };
      reader.readAsDataURL(f);
      e.target.value = "";
    },
    [setUrl]
  );

  return (
    <div className="mt-2 flex flex-col gap-2 border-b border-[var(--color-panel-border)]/45 px-3 py-1.5 text-[11px] text-epis-ink/60">
      <div className="flex flex-wrap items-center gap-3">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button
        type="button"
        className="rounded-lg border border-[var(--color-stroke)]/30 bg-white/60 px-2 py-1 transition hover:bg-white"
        onClick={() => fileRef.current?.click()}
      >
        選擇背景圖
      </button>
      {url ? (
        <button
          type="button"
          className="text-epis-ink/45 underline decoration-dotted hover:text-epis-ink/75"
          onClick={() => setUrl(null)}
        >
          清除圖片
        </button>
      ) : null}
      <label className="flex items-center gap-1.5">
        <span className="text-epis-ink/45">透明度</span>
        <input
          type="range"
          min={0.04}
          max={1}
          step={0.02}
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-24 accent-[var(--color-stroke)]"
        />
      </label>
      <label className="flex items-center gap-1.5">
        <span className="text-epis-ink/45">明暗</span>
        <input
          type="range"
          min={0.82}
          max={1.35}
          step={0.02}
          value={brightness}
          onChange={(e) => setBrightness(parseFloat(e.target.value))}
          className="w-24 accent-[var(--color-stroke)]"
        />
      </label>
      </div>
    </div>
  );
}

function isEditableEventTarget(target: EventTarget | null): boolean {
  const el = target instanceof HTMLElement ? target : null;
  return !!el?.closest("input, textarea, select, [contenteditable=true]");
}

/**
 * 主畫面右側 Downtown：工具列固定於欄內頂部；IG／YT 工作區支援中鍵或空白鍵+左鍵平移、+/- 縮放；規劃格可於欄內拖移與右下角改寬。
 */
export function Downtown() {
  const mode = useStore((s) => s.aestheticsHubMode);
  const setMode = useStore((s) => s.setAestheticsHubMode);
  const collapsed = useStore((s) => s.downtownPanelCollapsed);
  const setCollapsed = useStore((s) => s.setDowntownPanelCollapsed);
  const focusModeActive = useStore((s) => s.focusModeActive);
  const focusRealm = useStore((s) => s.focusRealm);
  /** 須為主列 flex 直接子項，{@link downtownPanelWidthPercent} 的 % 才會相對整欄計算（不可再外包一層 shrink-0） */
  const downtownStackZ =
    focusModeActive && (focusRealm === "town" || focusRealm === "studio")
      ? "z-[110]"
      : "z-[40]";
  const widthPct = useStore((s) => s.downtownPanelWidthPercent);
  const scale = useStore((s) => s.downtownContentScale);
  const setScale = useStore((s) => s.setDowntownContentScale);
  const blankScale = useStore((s) => s.downtownBlankScale);
  const setBlankScale = useStore((s) => s.setDowntownBlankScale);
  const pan = useStore((s) => s.downtownWorkspacePan);
  const panBy = useStore((s) => s.panDowntownWorkspaceBy);
  const resetPan = useStore((s) => s.resetDowntownWorkspacePan);
  const panning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const spaceHeldRef = useRef(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      if (isEditableEventTarget(e.target)) return;
      spaceHeldRef.current = true;
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeldRef.current = false;
    };
    const onBlur = () => {
      spaceHeldRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const modeToggleBtn = (m: AestheticsHubMode, icon: ReactNode, label: string) => {
    const active = mode === m;
    return (
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={active}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border backdrop-blur-md transition ${
          active
            ? "border-[var(--color-stroke)]/35 bg-[var(--color-accent-soft)]/90 text-epis-ink/88"
            : "border-[var(--color-panel-border)]/50 bg-white/55 text-epis-ink/50 hover:border-[var(--color-stroke)]/25 hover:bg-white/80 hover:text-epis-ink/75"
        }`}
        style={{ borderWidth: "0.5px" }}
        onClick={() => setMode(m)}
      >
        {icon}
      </button>
    );
  };

  const bumpScale = (d: number) => {
    if (mode === "blank") setBlankScale(blankScale + d);
    else setScale(scale + d);
  };
  const scaleDisplay = mode === "blank" ? blankScale : scale;

  const onWorkspacePointerDown = useCallback((e: ReactPointerEvent) => {
    const mid = e.button === 1;
    const spacePan = e.button === 0 && spaceHeldRef.current;
    if (!mid && !spacePan) return;
    e.preventDefault();
    panning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onWorkspacePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!panning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      panStart.current = { x: e.clientX, y: e.clientY };
      panBy(dx, dy);
    },
    [panBy]
  );

  const onWorkspacePointerUp = useCallback((e: ReactPointerEvent) => {
    panning.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }, []);

  if (collapsed) {
    return (
      <button
        type="button"
        className="pointer-events-auto z-[5] flex h-full w-10 shrink-0 flex-col items-center justify-center gap-1 border-l border-[var(--color-panel-border)] bg-[var(--color-town-bg)]/92 text-[10px] font-medium text-epis-ink/55 transition hover:bg-[var(--color-glass)] hover:text-epis-ink/80"
        onClick={() => setCollapsed(false)}
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        <span className="max-h-[5rem] select-none text-center" style={{ writingMode: "vertical-rl" }}>
          Downtown
        </span>
      </button>
    );
  }

  const workspaceTransform: CSSProperties =
    mode === "blank"
      ? {}
      : {
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scaleDisplay})`,
          transformOrigin: "0 0",
        };

  /** 整欄寬度相對主列（data-epis-main-column）的百分比；拖曳把手在欄內，內容用 flex-1 吃滿剩餘寬 */
  const HANDLE_W_PX = 8;

  return (
    <div
      className={`relative flex min-h-0 shrink-0 flex-row ${downtownStackZ}`}
      style={{
        width: `${widthPct}%`,
        minWidth: 260 + HANDLE_W_PX,
        maxWidth: "100%",
      }}
      aria-label="Downtown 欄"
    >
      <DowntownWidthResizeHandle />
      <div
        className="pointer-events-auto relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-l border-[var(--color-panel-border)]/50 bg-[var(--color-town-bg)]/92 backdrop-blur-md"
        aria-label="Downtown"
      >
        <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--color-panel-border)]/40 bg-white/55 px-2 py-2 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <span className="select-none text-[11px] font-semibold uppercase tracking-[0.08em] text-epis-ink/70">
              Downtown
            </span>
            <button
              type="button"
              className="rounded-md border border-[var(--color-panel-border)]/50 p-1 text-epis-ink/50 transition hover:bg-white/80 hover:text-epis-ink/75"
              style={{ borderWidth: "0.5px" }}
              title="暫時隱藏 Downtown"
              aria-label="暫時隱藏 Downtown"
              onClick={() => setCollapsed(true)}
            >
              <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {modeToggleBtn(
              "instagram",
              <Instagram className="h-4 w-4" strokeWidth={1.75} />,
              "IG 規劃格"
            )}
            {modeToggleBtn("youtube", <Youtube className="h-4 w-4" strokeWidth={1.75} />, "YouTube 模板")}
            {modeToggleBtn("blank", <File className="h-4 w-4" strokeWidth={1.75} />, "空白畫布")}
            <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-[var(--color-panel-border)]/50 bg-white/50 px-1 py-0.5">
              <button
                type="button"
                className="rounded p-1 text-epis-ink/50 hover:bg-white/90 hover:text-epis-ink/85"
                aria-label="縮小"
                onClick={() => bumpScale(-0.08)}
              >
                <Minus className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <span className="min-w-[2rem] text-center text-[10px] tabular-nums text-epis-ink/55">
                {Math.round(scaleDisplay * 100)}%
              </span>
              <button
                type="button"
                className="rounded p-1 text-epis-ink/50 hover:bg-white/90 hover:text-epis-ink/85"
                aria-label="放大"
                onClick={() => bumpScale(0.08)}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
            {mode !== "blank" ? (
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg border border-[var(--color-panel-border)]/50 bg-white/45 px-2 py-1 text-[10px] text-epis-ink/55 transition hover:bg-white/85 hover:text-epis-ink/80"
                style={{ borderWidth: "0.5px" }}
                title="重置平移"
                onClick={() => resetPan()}
              >
                <Move className="h-3 w-3" strokeWidth={2} />
                重置位置
              </button>
            ) : null}
          </div>
        </div>

        {mode === "blank" ? <BlankModeControls /> : null}

        <div
          className={`relative min-h-0 flex-1 ${
            mode === "blank"
              ? "flex flex-col overflow-hidden bg-[var(--color-canvas-bg)] px-1.5 pb-1.5 pt-0"
              : "overflow-hidden"
          }`}
        >
          {mode === "blank" ? (
            <DowntownBlankWorkspace />
          ) : (
            <div
              ref={workspaceRef}
              data-epis-downtown-workspace
              className="relative h-full min-h-[200px] cursor-auto touch-none overflow-hidden"
              onPointerDown={onWorkspacePointerDown}
              onPointerMove={onWorkspacePointerMove}
              onPointerUp={onWorkspacePointerUp}
              onPointerCancel={onWorkspacePointerUp}
              onAuxClick={(e) => e.button === 1 && e.preventDefault()}
            >
              <div
                className="absolute left-0 top-0 min-h-full min-w-full p-3 will-change-transform"
                style={workspaceTransform}
              >
                {mode === "instagram" ? <DowntownIgGrid /> : <DowntownYtGrid />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
