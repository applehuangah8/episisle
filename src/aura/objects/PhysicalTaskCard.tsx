import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useId, useState } from "react";

import { auraSpringLift, auraSpringSoft, auraTransitionExpand } from "@/aura/motion/auraMotion";

export type PhysicalTaskCardProps = {
  title: string;
  body: string;
  /** Stacking order inside diorama */
  layerIndex?: number;
};

/**
 * A single “thing” in the diorama: thick paper, soft hover lift, click to unfold.
 */
export function PhysicalTaskCard({ title, body, layerIndex = 2 }: PhysicalTaskCardProps) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const baseId = useId();

  const restShadow = `
    0 2px 0 rgba(255, 252, 248, 0.35),
    0 14px 28px var(--aura-shadow-soft),
    0 28px 56px var(--aura-shadow-deep)
  `;
  const hoverShadow = `
    0 4px 0 rgba(255, 252, 248, 0.42),
    0 22px 44px var(--aura-shadow-soft),
    0 40px 72px var(--aura-shadow-deep)
  `;

  return (
    <motion.article
      layout
      className="relative cursor-pointer select-none rounded-[3px] border outline-none"
      style={{
        zIndex: layerIndex,
        width: "min(100%, 280px)",
        borderWidth: "0.5px",
        borderColor: "var(--aura-paper-edge)",
        background: `
          linear-gradient(145deg, var(--aura-paper) 0%, #ddd8cf 48%, #d8d3c8 100%)
        `,
        boxShadow: restShadow,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, y: 18, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 4 }}
      transition={auraSpringSoft}
      whileHover={{
        y: -7,
        rotateX: 2,
        scale: 1.02,
        boxShadow: hoverShadow,
        transition: auraSpringLift,
      }}
      whileTap={{ scale: 0.985, transition: { duration: 0.35, ease: auraTransitionExpand.ease } }}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-controls={`${baseId}-detail`}
      aria-label={`${title}. ${open ? "收合" : "展開"}內容`}
    >
      {/* Paper fiber / subtle texture simulation */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[3px] opacity-[0.14]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E")`,
          mixBlendMode: "multiply",
        }}
      />

      <div className="relative px-5 pb-4 pt-5">
        <p
          className="text-[10px] font-medium uppercase tracking-[0.28em]"
          style={{ color: "var(--aura-ink-muted)" }}
        >
          待辦 · 物
        </p>
        <h2
          className="mt-2 font-serif text-[1.05rem] font-normal leading-snug tracking-tight"
          style={{ color: "var(--aura-ink)", fontFamily: "var(--epis-font-district), Georgia, serif" }}
        >
          {title}
        </h2>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              id={`${baseId}-detail`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={auraTransitionExpand}
              className="overflow-hidden"
            >
              <motion.p
                initial={{ y: 6 }}
                animate={{ y: 0 }}
                exit={{ y: 4 }}
                transition={auraTransitionExpand}
                className="mt-4 border-t border-[var(--aura-paper-edge)] pt-4 text-[13px] leading-relaxed"
                style={{ color: "var(--aura-ink-muted)" }}
              >
                {body}
              </motion.p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}
