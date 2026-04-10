# Spatial Salon Pilot (Independent Lab)

Independent prototype for a space-first project workflow.
This lab does not connect to the existing app.

## Goal

Validate four core capabilities before any integration:

1. Project switch in 3-5 seconds
2. World switch inside Project E in <= 2 clicks
3. RawPour capture for long unprocessed input
4. Wake-up note re-entry for fast context recovery

## Run

```bash
npm install
npm run dev
```

Default URL: [http://127.0.0.1:5181/](http://127.0.0.1:5181/)

## Architecture

- `src/domain`: pure types and policies
- `src/application`: state orchestration and use cases
- `src/ui`: visual composition and interactions (`parts/`, `tokens.css`, `pilotVisual.ts`)

See:
- `docs/ARCHITECTURE.md`
- `docs/DESIGN_AESTHETIC.md`
- `docs/STEP1_EXECUTION.md`
- `docs/STEP15_USABILITY_CHECKLIST.md`
- `docs/STEP2_REPOSITORY.md`
- `docs/STEP3_SNAPSHOT_IO.md`
- `docs/STEP4_UI_LAYOUT.md`
- `docs/STEP5_MOTION.md`
