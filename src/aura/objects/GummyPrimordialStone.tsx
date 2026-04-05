import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { useCallback, useState } from "react";

import { auraSpringHeavy } from "@/aura/motion/auraMotion";
import { lockGlobalTextSelection, unlockGlobalTextSelection } from "@/dom/globalTextSelectionLock";

const GUMMY_BG = "#DBCAC9";

const shadowRest =
  "0 1px 0 rgba(255, 252, 248, 0.38), 0 32px 56px -14px rgba(42, 34, 30, 0.13), 0 72px 120px -36px rgba(32, 24, 20, 0.09)";
const shadowHover =
  "0 3px 0 rgba(255, 252, 248, 0.5), 0 42px 76px -10px rgba(42, 34, 30, 0.17), 0 96px 150px -36px rgba(32, 24, 20, 0.12)";

const dragTransition = { bounceStiffness: 60, bounceDamping: 20 };

const DRAG_BOUNDS = { top: 100, left: 140, right: 140, bottom: 100 };

type GummyPrimordialStoneProps = {
  zIndex?: number;
};

export function GummyPrimordialStone({ zIndex = 5 }: GummyPrimordialStoneProps) {
  const [open, setOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const toggleOpen = useCallback(() => setOpen((o) => !o), []);

  return (
    <motion.div
      className="relative flex w-full max-w-[320px] flex-col items-center justify-center"
      style={{ zIndex }}
      initial={{ opacity: 0, scale: 0.82, y: 22 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={auraSpringHeavy}
    >
      <motion.div
        drag
        dragConstraints={DRAG_BOUNDS}
        dragElastic={0.07}
        dragTransition={dragTransition}
        style={{
          x,
          y,
          zIndex,
          boxShadow: shadowRest,
        }}
        className="relative w-[132px] cursor-grab select-none rounded-[12px] border-[0.5px] border-solid border-[rgba(0,0,0,0.1)] active:cursor-grabbing"
        animate={{
          scale: open ? 1.07 : 1,
        }}
        transition={auraSpringHeavy}
        whileHover={
          dragging || open
            ? { transition: auraSpringHeavy }
            : {
                scale: 1.03,
                boxShadow: shadowHover,
                transition: auraSpringHeavy,
              }
        }
        whileTap={{ scale: open ? 1.02 : 0.985 }}
        onDragStart={() => {
          lockGlobalTextSelection();
          setDragging(true);
        }}
        onDragEnd={() => {
          setDragging(false);
          unlockGlobalTextSelection();
        }}
        onTap={toggleOpen}
        layout
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[12px]"
          style={{
            backgroundColor: GUMMY_BG,
            opacity: 0.9,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 rounded-[12px] opacity-[0.55]"
          style={{
            background:
              "linear-gradient(152deg, rgba(255,255,255,0.38) 0%, transparent 45%, rgba(0,0,0,0.035) 100%)",
          }}
        />

        <div className="relative flex min-h-[132px] w-[132px] flex-col items-center justify-center px-3 py-3">
          <span
            className="text-center text-[11px] font-medium uppercase tracking-[0.22em]"
            style={{ color: "rgba(58, 56, 52, 0.42)" }}
          >
            原石
          </span>
          <span
            className="mt-1 text-center text-[12px] leading-snug"
            style={{
              color: "rgba(58, 56, 52, 0.72)",
              fontFamily: "var(--epis-font-district), Georgia, serif",
            }}
          >
            輕觸展開 · 可拖移
          </span>
        </div>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="gummy-inner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={auraSpringHeavy}
              className="relative overflow-hidden border-t border-[rgba(0,0,0,0.07)]"
            >
              <motion.p
                initial={{ y: 8 }}
                animate={{ y: 0 }}
                exit={{ y: 6 }}
                transition={auraSpringHeavy}
                className="max-w-[132px] px-3 pb-3 pt-2 text-center text-[11px] leading-relaxed"
                style={{ color: "rgba(58, 56, 52, 0.52)" }}
              >
                一顆還在呼吸的形狀——像小動森裡的物件，卻留給大人靜靜摸。
              </motion.p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
