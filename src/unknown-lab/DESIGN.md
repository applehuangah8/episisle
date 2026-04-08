# Unknown Lab — AlchemyBench (A2 warm candle) Design Spec

This doc is a **buildable** spec for the standalone `unknown.html` prototype (not wired into the main app yet).

## Principles (non-negotiable)
- **No whiteboard / Notion feel**: avoid sticky-note grids, dense lists, table layouts as the primary surface.
- **No content guidance at entry**: no random/contradiction/constraint buttons; user starts from *their* thought.
- **World switch**: first frame must feel like changing realms via **shape language + material + light/motion**.
- **A2 tone**: *mysterious, premium, restrained*; warm highlight is localized; environment stays slow.
- **Vacation is an overlay**: it never disables tools; it only changes mood layers & collectibles.

## Single-screen layout
- **Center**: WebGL scene “AlchemyBench” (dark frosted-glass desk) + ore objects.
- **Right-bottom cluster**: Traveler character + `Postcards` (scene switching affordance).
- **Under traveler**: `PassportStamps` (ritual “stamp” confirmation, also switches scenes).
- **Left-bottom corner**: `WanderJots` (Traveler notes book; can “sprinkle back” into ore).
- **Text**: 1-line fog label only on hover/selection; long text only inside `SpecimenCase` panel.

## Core objects (shape language)
- **IdeaOre**: irregular ore / rounded shards. Primary unit on desk.
- **CrucibleRing**: floating glass ring (merge/transform ritual surface).
- **RefinedGem**: “cleaner facet” result of merging ores; still frosted-glass family.
- **SpecimenCase**: specimen tray / recipe case container for a direction-kit.

## Visual tokens (Unknown-scoped)
Unknown should be scoped via a root class (e.g. `.unknownRoot`) and CSS variables.

### Color bias
- **Dark base**: charcoal/blue-gray with mist.
- **Warm highlight**: amber candlelight; only near interaction.
- **Cold rim**: extremely subtle moon support (keeps edges readable in dark).

### Materials
- **Frosted glass**: subtle blur + thin translucent stroke (0.5–1px).
- **Pearl veil**: faint overlay, but in dark mode (not white pearl).
- **Hairline scratches**: ultra-low-contrast micro texture on desk + objects.
- **Contact shadow**: objects must feel “placed” on the desk.

### Motion
- **Environment slow**: float, twinkle, gentle parallax.
- **Interaction slightly faster**: but always soft easing (no hard cuts).

## Interaction state machine (buildable)
### Entry
- User **types anywhere** → a tiny input bubble appears near the cursor (DOM overlay).
- Confirm (Enter) → spawns `IdeaOre` at that point; input bubble fades.

### Explore (MindScatter)
- Drag to move ore; subtle “sticky” inertial feel.
- Hover/select shows a 1-line fog label.

### Transform (Crucible)
- Drag multiple ore into ring → hold briefly → merge into a `RefinedGem`.
- Feedback: localized warm pulse + optional ultra-soft ritual sound.

### Collect (SpecimenCase)
- Select a gem → open a specimen case panel (glass tray UI).
- Minimal fields: “Need”, “Materials”, “Next micro step” (kept sparse).

### VacationOverlay (WorldMood)
Vacation never locks tools. It changes:
- background set dressing (V1/V2/V3)
- traveler pose & sunglasses reflection
- candle breathing rhythm
- availability of the 3 collectibles

## Vacation: 3 scene “signal packs” (no text)
### V1 SeasideCabin
- window frame silhouette (fog)
- very slow night-ocean wave
- 2–4 warm distant dots
- subtle blanket fabric noise in darks

### V2 RooftopLounge
- faint railing highlight line
- many tiny city light dots
- slight cloth/air drift (slow)

### V3 IslandBeach
- ultra-faint sand ripple flow
- one arc shade shadow
- slightly brighter horizon line (still dark base)

## Vacation: the 3-piece set (no text)
### Postcards (peek corners)
- 3 corners visible; each has abstract symbol:
  - V1: window-corner + horizon line
  - V2: scattered dots
  - V3: shade arc + sand ripple
- Active: corner peeks 1–2mm more + rim light (no “UI highlight” glow)

### PassportStamps (ritual)
- 3 stamp slots with embossed shapes:
  - V1: concentric ripples
  - V2: star dots + faint arc
  - V3: sand flow lines
- Switching animation: press (0.18s) → seep (0.45s) → dry (0.9s)

### WanderJots (Traveler notes)
- a small frosted-glass notebook at desk corner, no placeholder text.
- Add a jot (user typed while Vacation on) → spine amber glints briefly.
- “Sprinkle back” converts a jot into an `IdeaOre` (optional affordance later).

