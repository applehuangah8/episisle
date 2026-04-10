# Step 4 — UI structure + salon visual pass

## Code structure

UI is split into focused parts under `src/ui/parts/`:

- `ProjectShelf.tsx` — project vessels + ambient hint classes
- `SalonStage.tsx` — orrery field, world orbs, tool charms, wake card
- `ClutterTray.tsx` — velvet tray + zone pills + RawPour / QuickDrop
- `RecentDrops.tsx` — scoped drop cards
- `LabPanels.tsx` — snapshot IO, readiness, event tail

Tokens live in `src/ui/tokens.css`; visual helpers in `src/ui/pilotVisual.ts` (orbit accents, ambient classes).

## Visual intent (this pass)

- Wall vignette background (cream / dust violet / sage wash)
- Floating shelf rail with velvet strip
- Stage with soft **conic** orbit halo keyed to active world accent
- World selectors as **orbs** with gemstone dots
- **Tool charms** surfaced for the active world (Active vs Dormant)
- Wake card as **pinned paper** (slight rotation)
- Clutter tray with **velvet rim** + tactile **zone pills**

## Fonts

`Cormorant Garamond` + `Jost` loaded from Google Fonts in `index.html`.
