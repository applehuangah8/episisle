/**
 * Shared motion presets: slow, soft, tactile — not app-UI snappy.
 */
/** Slow, heavy spring — gummy / diorama objects (spec: stiffness 60, damping 20). */
export const auraSpringHeavy = {
  type: "spring" as const,
  stiffness: 60,
  damping: 20,
  mass: 1,
};

export const auraSpringSoft = {
  type: "spring" as const,
  stiffness: 120,
  damping: 22,
  mass: 1.1,
};

export const auraSpringLift = {
  type: "spring" as const,
  stiffness: 180,
  damping: 26,
  mass: 0.95,
};

export const auraEaseSlow = [0.25, 0.1, 0.25, 1] as const;

export const auraTransitionExpand = {
  duration: 0.55,
  ease: auraEaseSlow,
};
