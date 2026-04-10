import type { Transition } from "framer-motion";

/** Editorial ease — calm deceleration */
export const salonEase = [0.22, 1, 0.36, 1] as const;

/** Physical switch — elastic, not a snap cut */
export const salonSpring: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 26,
  mass: 0.92,
};

export const salonSpringSoft: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 22,
  mass: 1.05,
};

export const salonRevealContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

export const salonRevealItem = {
  hidden: { opacity: 0, y: 24, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.72, ease: salonEase },
  },
};

/* Legacy exports used elsewhere */
export const salonFloat: Transition = salonSpringSoft;

export const staggerSalon = salonRevealContainer;

export const riseItem = salonRevealItem;
