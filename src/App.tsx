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
  return (
    <div data-epis-main-column className="flex h-full min-h-0 w-full flex-row">
      {/* z-index 高於右欄，讓身分卡拖曳到 Downtown 上方時仍看得見（右欄維持可點擊，因畫布僅佔左欄寬） */}
      <div className="relative z-[100] min-h-0 min-w-0 flex-1 overflow-visible">
        <Canvas ref={canvasSurfaceRef as never} />
        <HUD canvasSurfaceRef={canvasSurfaceRef} />
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
