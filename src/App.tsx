import { AnimatePresence, motion } from "framer-motion";
import { useLayoutEffect, useRef, type RefObject } from "react";

import { AppSubViewChrome } from "@/components/AppSubViewChrome";
import { PlanningDragOverlay } from "@/components/PlanningDragOverlay";
import { Downtown } from "@/components/Downtown";
import { ArchiveView } from "@/components/ArchiveView";
import { MuseeGalleryView } from "@/components/MuseeGalleryView";
import { Canvas } from "@/canvas/Canvas";
import { HUD } from "@/components/ui/HUD";
import { useStore } from "@/store/useStore";

function MainSplitLayout({ canvasSurfaceRef }: { canvasSurfaceRef: RefObject<HTMLDivElement | null> }) {
  const focusModeActive = useStore((s) => s.focusModeActive);
  const focusRealm = useStore((s) => s.focusRealm);
  /** 原野專注時全幅畫布；城鎮／Studio 專注時保留 Downtown，規劃格積木才不會「被藏起來」。 */
  const showDowntown = !focusModeActive || focusRealm === "town" || focusRealm === "studio";
  /**
   * 專注 · 城鎮／Studio：視角會拉近，主畫布積木常「畫在」右欄螢幕區上。若整欄畫布子樹 z-index 仍高於
   * Downtown，規劃格標題列的 pointer 會被畫布吃掉，表現成拖不動或放開後像卡回同一處。
   * 此時改為 Downtown 疊在畫布之上；HUD 改為同層絕對定位且寬度＝左欄寬，才不會被右欄蓋住。
   */
  const focusTownStudio =
    focusModeActive && (focusRealm === "town" || focusRealm === "studio");
  const canvasColumnZ = focusTownStudio ? "z-0" : "z-[100]";

  return (
    <div data-epis-main-column className="relative flex h-full min-h-0 w-full flex-row">
      {/**
       * HUD 放在左欄內 `inset-0`，寬度永遠等於畫布欄，避免另一層絕對定位用錯 %／ResizeObserver 蓋到右欄 Downtown。
       * 與 {@link Downtown} 的堆疊高低仍由左欄 `z-*` vs Downtown 根節點 `z-[40]|z-[110]` 決定（Downtown 須維持主列直接子項）。
       */}
      <div className={`relative min-h-0 min-w-0 flex-1 overflow-visible ${canvasColumnZ}`}>
        <Canvas ref={canvasSurfaceRef as never} />
        <div className="pointer-events-none absolute inset-0 z-[130] min-h-0 min-w-0">
          <HUD canvasSurfaceRef={canvasSurfaceRef} />
        </div>
      </div>
      {showDowntown ? <Downtown /> : null}
    </div>
  );
}

const mainExit = {
  opacity: 0,
  scale: 1.05,
  filter: "blur(16px)",
};

const mainEnter = {
  opacity: 0,
  scale: 0.97,
  filter: "blur(10px)",
};

const subViewEnter = {
  opacity: 0,
  filter: "blur(6px)",
};

const transitionMain = { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };
const transitionGallery = { duration: 0.52, ease: [0.16, 1, 0.3, 1] as const };

export default function App() {
  const frameAllPlacements = useStore((s) => s.frameAllPlacements);
  const viewMode = useStore((s) => s.viewMode);
  const canvasSurfaceRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    let rafAttach = 0;
    let ro: ResizeObserver | null = null;
    let roFramePending = false;

    const tryFrame = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return;
      if (Object.keys(useStore.getState().placements).length === 0) return;
      frameAllPlacements(el);
    };

    const scheduleFrame = (el: HTMLElement) => {
      if (roFramePending) return;
      roFramePending = true;
      requestAnimationFrame(() => {
        roFramePending = false;
        if (!cancelled) tryFrame(el);
      });
    };

    const attach = () => {
      if (cancelled) return;
      const el = canvasSurfaceRef.current;
      if (!el) {
        rafAttach = requestAnimationFrame(attach);
        return;
      }
      scheduleFrame(el);
      ro = new ResizeObserver(() => scheduleFrame(el));
      ro.observe(el);
    };

    attach();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafAttach);
      ro?.disconnect();
    };
  }, [frameAllPlacements]);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {viewMode === "main" ? (
          <motion.div
            key="view-main"
            className="absolute inset-0 min-h-0"
            initial={mainEnter}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={mainExit}
            transition={transitionMain}
          >
            <MainSplitLayout canvasSurfaceRef={canvasSurfaceRef} />
          </motion.div>
        ) : null}

        {viewMode === "archive" ? (
          <motion.div
            key="view-archive"
            className="absolute inset-0 min-h-0 bg-[var(--color-canvas-bg)]"
            initial={subViewEnter}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={transitionGallery}
          >
            <ArchiveView />
          </motion.div>
        ) : null}

        {viewMode === "musee" ? (
          <motion.div
            key="view-musee"
            className="absolute inset-0 min-h-0"
            initial={subViewEnter}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(8px)" }}
            transition={transitionGallery}
          >
            <MuseeGalleryView />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AppSubViewChrome />
      <PlanningDragOverlay />
    </div>
  );
}
