# Step 5 — Framer Motion: depth, orbit, silk transitions

## Why Framer (not Three.js) here

Three.js excels at full diorama scenes; this pilot prioritises **editorial UI**, quick iteration, and **object-like motion** without WebGL weight. Framer Motion gives:

- spring physics for a calm French cadence
- layout / shared transitions
- pointer-driven tilt with `useSpring`
- `useReducedMotion` for accessibility

Three.js remains an option if we later mount a **single hero diorama** behind this chrome.

## What shipped

- **`src/ui/motion/salonMotion.ts`**: easing, springs, staggered page reveal.
- **`src/ui/motion/StageTilt.tsx`**: subtle **3D tilt** of the main stage from pointer position (disabled when reduced motion).
- **Orrery ring**: imperceptibly slow **360°** rotation (140s loop) + hub **breathing** float.
- **Project shelf**: staggered entrance blur→sharp, hover lift + light `rotateX`, active halo opacity.
- **World orbs**: spring hover lift, active dot scale.
- **Tool charms**: staggered fade + hover nudge.
- **Wake card**: entrance slide; **AnimatePresence** on wake copy when `updatedAt` / saved note changes.
- **Clutter tray**: lifts on hover/focus (`rotateX` + translate), velvet **sheen** overlay, sprung zone pills + primary button.
- **Recent drops**: `layout` + `AnimatePresence` for list refinement.
- **Page shell**: `salonRevealContainer` stagger so the screen never feels like a flat paste.

## Domain fix (motion stability)

`deriveWakeNote` fallback `updatedAt` no longer calls `Date.now()` every render (uses latest drop `createdAt` or `0`) so wake transitions do not thrash.

## Dependency

`framer-motion` ^11.x added to this lab only.
