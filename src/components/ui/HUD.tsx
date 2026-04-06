import { motion } from "framer-motion";
import {
  Archive,
  Focus,
  Landmark,
  LayoutGrid,
  Map,
  Plus,
  RotateCcw,
  Settings,
} from "lucide-react";
import { useCallback, useMemo, useState, type CSSProperties, type RefObject } from "react";

import { useAreaDetection } from "@/canvas/useAreaDetection";
import { getWorldPointAtCanvasCenter } from "@/canvas/viewportMath";
import type { FocusLifecyclePreset, FocusRealm } from "@/core/focusMode";
import type { DistrictType, DistrictZoneHint } from "@/core/types";
import { getResolvedAuraIslandDisplayName } from "@/isle/aura/auraIslandMetadata";
import type { AuraIslandId } from "@/isle/aura/auraWorldIslandTypes";
import { useWorldEnteredFocusWorldId } from "@/isle/aura/WorldEnteredFocusScope";
import { useStore } from "@/store/useStore";

const hudFrameStyle: CSSProperties = {
  borderWidth: "var(--border-width)",
  borderStyle: "solid",
  borderColor: "var(--color-panel-border)",
  backdropFilter: "var(--blur-effect)",
  WebkitBackdropFilter: "var(--blur-effect)",
};

const HUD_SURFACE = "rounded-brick bg-[var(--color-town-bg)]/88 shadow-brick";

function districtToContextLabel(
  d: DistrictType | "neutral",
  selectedDistrict: DistrictType | null
): string {
  const effective = selectedDistrict ?? d;
  switch (effective) {
    case "wild":
      return "Wild";
    case "instagram":
    case "youtube":
      return "Downtown";
    case "studio":
      return "Studio";
    case "neutral":
      return "User Isle";
    default:
      return "Overview";
  }
}

export interface HUDProps {
  canvasSurfaceRef: RefObject<HTMLDivElement | null>;
}

function focusRealmLabel(r: FocusRealm): string {
  if (r === "wild") return "原野";
  if (r === "town") return "城鎮（Downtown 區）";
  return "Studio";
}

const FOCUS_LIFECYCLE_OPTIONS: { value: FocusLifecyclePreset; label: string }[] = [
  { value: "all", label: "全部狀態" },
  { value: "idea", label: "idea" },
  { value: "developing", label: "developing" },
  { value: "planned", label: "planned" },
  { value: "archived", label: "archived" },
];

export function HUD({ canvasSurfaceRef }: HUDProps) {
  const inWorldFocusWorldId = useWorldEnteredFocusWorldId();
  const inWorldIsleLabel =
    inWorldFocusWorldId != null ? getResolvedAuraIslandDisplayName(inWorldFocusWorldId as AuraIslandId) : null;

  const viewport = useStore((s) => s.viewport);
  const addBlock = useStore((s) => s.addBlock);
  const addBlockInDistrict = useStore((s) => s.addBlockInDistrict);
  const frameAllPlacements = useStore((s) => s.frameAllPlacements);
  const selectedPlacementId = useStore((s) => s.selectedPlacementId);
  const placements = useStore((s) => s.placements);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const focusModeActive = useStore((s) => s.focusModeActive);
  const focusRealm = useStore((s) => s.focusRealm);
  const focusLifecycle = useStore((s) => s.focusLifecycle);
  const enterFocusMode = useStore((s) => s.enterFocusMode);
  const exitFocusMode = useStore((s) => s.exitFocusMode);
  const setFocusRealm = useStore((s) => s.setFocusRealm);
  const setFocusLifecycle = useStore((s) => s.setFocusLifecycle);
  const refocusFocusViewport = useStore((s) => s.refocusFocusViewport);

  const { detectDistrict } = useAreaDetection();
  const [pointerDistrict, setPointerDistrict] = useState<DistrictZoneHint>("neutral");

  const selectedDistrict = useMemo((): DistrictType | null => {
    if (!selectedPlacementId) return null;
    const p = placements[selectedPlacementId];
    return p?.district ?? null;
  }, [placements, selectedPlacementId]);

  const trackPointer = useCallback(
    (e: React.PointerEvent) => {
      if (viewMode !== "main") return;
      const el = canvasSurfaceRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      ) {
        return;
      }
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const { x: vx, y: vy, scale } = viewport;
      const s = scale > 1e-6 ? scale : 1;
      const wx = (cx - vx) / s;
      const wy = (cy - vy) / s;
      setPointerDistrict(detectDistrict(wx, wy));
    },
    [canvasSurfaceRef, viewport, detectDistrict, viewMode]
  );

  const headerLabel = districtToContextLabel(pointerDistrict, selectedDistrict);

  const handleNewBlock = useCallback(() => {
    const el = canvasSurfaceRef.current;
    if (!el) return;
    const { x, y } = getWorldPointAtCanvasCenter(el, viewport, { centerBlock: true });
    if (!focusModeActive) {
      addBlock(x, y);
      return;
    }
    if (focusRealm === "wild") {
      addBlockInDistrict(x, y, "wild");
      return;
    }
    if (focusRealm === "studio") {
      addBlockInDistrict(x, y, "studio");
      return;
    }
    const at = detectDistrict(x, y);
    if (at === "instagram" || at === "youtube") {
      addBlockInDistrict(x, y, at);
    } else {
      addBlockInDistrict(x, y, "instagram");
    }
  }, [
    addBlock,
    addBlockInDistrict,
    canvasSurfaceRef,
    detectDistrict,
    focusModeActive,
    focusRealm,
    viewport,
  ]);

  const scheduleRefocusFocus = useCallback(() => {
    queueMicrotask(() => refocusFocusViewport(canvasSurfaceRef.current));
  }, [canvasSurfaceRef, refocusFocusViewport]);

  const onFocusLifecycleSelect = useCallback(
    (value: string) => {
      setFocusLifecycle(value as FocusLifecyclePreset);
      scheduleRefocusFocus();
    },
    [setFocusLifecycle, scheduleRefocusFocus]
  );

  const viewBtn = (active: boolean) =>
    active
      ? "bg-[var(--color-accent-soft)] text-[var(--color-text)]"
      : "text-[var(--color-text-muted)] hover:bg-[var(--color-glass)] hover:text-[var(--color-text)]";

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col"
      style={{ zIndex: 10000 }}
      onPointerMove={trackPointer}
    >
      <header
        className={`pointer-events-auto mx-3 mt-3 flex items-center justify-between gap-3 px-4 py-2.5 ${HUD_SURFACE}`}
        style={hudFrameStyle}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="select-none text-lg leading-none" title="Island">
              🏝️
            </span>
            <h1 className="truncate font-sans text-sm font-medium tracking-[0.2em] text-[var(--color-text)]">
              Epis isle
            </h1>
          </div>
          {inWorldIsleLabel ? (
            <p
              className="truncate pl-8 text-[9px] font-normal tracking-[0.32em] text-[var(--color-text-muted)] opacity-[0.82]"
              style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif" }}
              title={inWorldIsleLabel}
            >
              {inWorldIsleLabel}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <div className="mr-1 flex items-center gap-0.5 rounded-full bg-[var(--color-glass)]/80 p-0.5">
            <button
              type="button"
              title="主畫布"
              aria-label="主畫布"
              aria-pressed={viewMode === "main"}
              className={`rounded-full p-2 transition ${viewBtn(viewMode === "main")}`}
              onClick={() => setViewMode("main")}
            >
              <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              title="封存倉庫"
              aria-label="封存倉庫"
              aria-pressed={viewMode === "archive"}
              className={`rounded-full p-2 transition ${viewBtn(viewMode === "archive")}`}
              onClick={() => setViewMode("archive")}
            >
              <Archive className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              title="靈感博物館"
              aria-label="靈感博物館"
              aria-pressed={viewMode === "musee"}
              className={`rounded-full p-2 transition ${viewBtn(viewMode === "musee")}`}
              onClick={() => setViewMode("musee")}
            >
              <Landmark className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>

          {viewMode === "main" && !focusModeActive ? (
            <button
              type="button"
              className="pointer-events-auto rounded-full p-2 text-[var(--color-text-muted)] transition hover:bg-[var(--color-glass)] hover:text-[var(--color-text)]"
              title="專注模式：全幅畫布，依區域與積木狀態篩選；結束時還原進入前視角"
              aria-label="進入專注模式"
              onClick={() => enterFocusMode("wild", canvasSurfaceRef.current)}
            >
              <Focus className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ) : null}

          {viewMode === "main" && focusModeActive ? (
            <div className="pointer-events-auto flex max-w-[min(100%,520px)] flex-wrap items-center gap-1 rounded-full border border-[var(--color-panel-border)]/60 bg-[var(--color-glass)]/90 px-2 py-1 text-[11px] text-[var(--color-text)]">
              {(["wild", "town", "studio"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`rounded-full px-2 py-0.5 font-medium transition ${
                    focusRealm === r
                      ? "bg-[var(--color-accent-soft)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:bg-white/40"
                  }`}
                  aria-pressed={focusRealm === r}
                  onClick={() => {
                    setFocusRealm(r);
                  }}
                >
                  {r === "wild" ? "原野" : r === "town" ? "城鎮" : "Studio"}
                </button>
              ))}
              <label className="ml-1 flex items-center gap-1 pl-1">
                <span className="text-[var(--color-text-muted)]">狀態</span>
                <select
                  className="max-w-[7.5rem] rounded-md border border-[var(--color-panel-border)]/50 bg-white/70 px-1.5 py-0.5 text-[11px] text-[var(--color-text)]"
                  value={focusLifecycle}
                  aria-label="依積木 lifecycle 篩選"
                  onChange={(e) => onFocusLifecycleSelect(e.target.value)}
                >
                  {FOCUS_LIFECYCLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="ml-1 rounded-full border border-[var(--color-stroke)]/35 bg-white/50 px-2 py-0.5 font-medium text-[var(--color-text)] transition hover:bg-white/80"
                title="回到大地圖並還原進入專注前的視角"
                onClick={() => exitFocusMode()}
              >
                大地圖
              </button>
            </div>
          ) : null}

          <button
            type="button"
            className="pointer-events-auto rounded-full p-2 text-[var(--color-text-muted)] transition hover:bg-[var(--color-glass)] hover:text-[var(--color-text)]"
            title="設定（預留）"
            aria-label="設定"
          >
            <Settings className="h-4 w-4" strokeWidth={1.75} />
          </button>
          {viewMode === "main" ? (
            <button
              type="button"
              className="pointer-events-auto rounded-full p-2 text-[var(--color-text-muted)] transition hover:bg-[var(--color-glass)] hover:text-[var(--color-text)]"
              title={focusModeActive ? "重新框入目前篩選的積木" : "框選全部積木（全覽）"}
              onClick={() => {
                const el = canvasSurfaceRef.current;
                if (!el) return;
                if (focusModeActive) refocusFocusViewport(el);
                else frameAllPlacements(el);
              }}
              aria-label={focusModeActive ? "專注視角全覽" : "全覽畫布"}
            >
              <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ) : null}
          {viewMode === "main" ? (
            <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-glass)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)]">
              <Map className="h-3.5 w-3.5 text-[var(--color-stroke)]" strokeWidth={2} />
              <span>
                {focusModeActive ? `專注 · ${focusRealmLabel(focusRealm)}` : headerLabel}
              </span>
            </div>
          ) : null}
        </div>
      </header>

      {viewMode === "main" ? (
        <div className="flex flex-1 flex-col items-center justify-end pb-6">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`pointer-events-auto flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[var(--color-text)] ${HUD_SURFACE}`}
            style={hudFrameStyle}
            onClick={handleNewBlock}
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            New Block
          </motion.button>
        </div>
      ) : null}
    </div>
  );
}
