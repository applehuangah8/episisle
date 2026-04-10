import type { CSSProperties, ReactNode, RefObject } from "react";
import { useEffect, useId, useRef, useState } from "react";

import { motion, useReducedMotion } from "framer-motion";

import type {
  ArtifactFinish,
  DropItem,
  DropMode,
  Project,
  StudioArtifact,
  SurfaceKind,
  WakeNote,
  World,
  ZoneId,
} from "../../domain/types";
import { inferStudioArtifact, SURFACE_KINDS } from "../../domain/studio";
import { salonSpring, salonSpringSoft } from "../motion/salonMotion";

import { SpacemanGlbCanvas } from "../scene/SpacemanGlbCanvas";
import { AddProjectSalon } from "./AddProjectSalon";
import { EditProjectMetaSalon } from "./EditProjectMetaSalon";
import { SeaGlassArtifactSvg } from "./SeaGlassArtifactSvg";
import { SurfaceFormMotif } from "./surfaceFormMotifs";
import { getFinishRecipe } from "./materialFinish";
import "./salon-shell.css";

const worldPalette: Record<
  string,
  { core: string; highlight: string; sheen: string; kind: "sphere" | "sphere-matte" | "drop" }
> = {
  "world-oceanus": {
    core: "hsl(210 62% 72%)",
    highlight: "hsl(200 85% 94%)",
    sheen: "hsl(195 70% 88%)",
    kind: "sphere",
  },
  "world-arid": {
    core: "hsl(92 22% 48%)",
    highlight: "hsl(88 28% 62%)",
    sheen: "hsl(75 24% 54%)",
    kind: "sphere-matte",
  },
  "world-crystal": {
    core: "hsl(32 62% 58%)",
    highlight: "hsl(38 80% 76%)",
    sheen: "hsl(28 45% 48%)",
    kind: "drop",
  },
};

function paletteForWorld(id: string) {
  return worldPalette[id] ?? { core: "hsl(280 22% 76%)", highlight: "#f5f0ff", sheen: "#c4bdd8", kind: "sphere" as const };
}

/** Orbit charm anchors (within `.salon-orbit`). Center slot sits in the former hint band under masthead. */
const charmSlots: { left: string; top: string }[] = [
  { left: "11%", top: "29%" },
  { left: "50%", top: "10%" },
  { left: "89%", top: "29%" },
];

type Props = {
  projects: Project[];
  currentProject: Project;
  worlds: World[];
  activeWorld: World | null;
  wake: WakeNote;
  pourText: string;
  onPourText: (text: string) => void;
  onPourCommit: () => void;
  draftZone: ZoneId;
  draftMode: DropMode;
  draftSurface: SurfaceKind;
  draftSurfaceTint?: string;
  draftSurfaceVariant?: string;
  draftTextColor: string;
  draftTextFont: "etching" | "serif" | "script";
  onDraftZone: (z: ZoneId) => void;
  onDraftMode: (m: DropMode) => void;
  onDraftSurface: (s: SurfaceKind) => void;
  onDraftSurfaceTint: (t: string) => void;
  onDraftSurfaceVariant: (v: string) => void;
  onDraftTextColor: (c: string) => void;
  onDraftTextFont: (f: "etching" | "serif" | "script") => void;
  palaceDrops: DropItem[];
  onOpenPalais: () => void;
  onOpenTray: () => void;
  onConfirmNewProject: (opts: {
    name: string;
    subtitle?: string;
    status?: string;
    studioArtifact: StudioArtifact;
    defaultSurface: SurfaceKind;
    artifactTint?: string;
    artifactFinish?: ArtifactFinish;
  }) => void;
  onUpdateProjectMeta: (
    projectId: string,
    patch: { name: string; subtitle: string; status: string }
  ) => void;
  onDeleteProject: (id: string) => void;
  onSelectProject: (id: string) => void;
  onSelectWorld: (id: string) => void;
  /** Every project: touch the large centerpiece to cycle room ambiance (Project A cabochon = same). */
  onCenterpieceInteract: () => void;
};

export const DROP_ZONES: { id: ZoneId; label: string; hint: string }[] = [
  { id: "Pocket", label: "口袋", hint: "收存一片念頭" },
  { id: "Thread", label: "線索", hint: "串起下一步行動" },
  { id: "Mirror", label: "鏡面", hint: "對照與反照" },
  { id: "Spark", label: "火花", hint: "靈光一閃" },
];

/** Four drop zones + capture mode — same model for every project (outline: Pocket / Thread / Mirror / Spark). */
export function TrayWorkspaceStrip({
  zone,
  mode,
  onZone,
  onMode,
  reduce,
}: {
  zone: ZoneId;
  mode: DropMode;
  onZone: (z: ZoneId) => void;
  onMode: (m: DropMode) => void;
  reduce: boolean;
}) {
  return (
    <div className="salon-tray__studio" role="toolbar" aria-label="Drop zones and capture mode">
      <div className="salon-tray__zones" role="group" aria-label="Drop zones">
        {DROP_ZONES.map((z) => (
          <motion.button
            key={z.id}
            type="button"
            className={`salon-tray__zone scenography-type type-zone-chip ${zone === z.id ? "is-active" : ""}`}
            onClick={() => onZone(z.id)}
            aria-pressed={zone === z.id}
            aria-label={`${z.label} 區 · ${z.hint}`}
            title={z.hint}
            whileHover={reduce ? undefined : { y: -2, transition: salonSpring }}
            whileTap={reduce ? undefined : { scale: 0.98, transition: salonSpring }}
          >
            <span className="salon-tray__zone-label">{z.label}</span>
            <span className="salon-tray__zone-hint type-elegant-micro">{z.hint}</span>
          </motion.button>
        ))}
      </div>
      <div className="salon-tray__mode" role="group" aria-label="Capture mode">
        <motion.button
          type="button"
          className={`salon-tray__mode-btn scenography-type ${mode === "RawPour" ? "is-active" : ""}`}
          onClick={() => onMode("RawPour")}
          aria-pressed={mode === "RawPour"}
          whileHover={reduce ? undefined : { y: -2, transition: salonSpring }}
        >
          長注
        </motion.button>
        <motion.button
          type="button"
          className={`salon-tray__mode-btn scenography-type ${mode === "QuickDrop" ? "is-active" : ""}`}
          onClick={() => onMode("QuickDrop")}
          aria-pressed={mode === "QuickDrop"}
          whileHover={reduce ? undefined : { y: -2, transition: salonSpring }}
        >
          快記
        </motion.button>
      </div>
    </div>
  );
}

export function TraySurfaceSwatches({
  surface,
  surfaceVariant,
  onSurface,
  reduce,
}: {
  surface: SurfaceKind;
  surfaceVariant?: string;
  onSurface: (s: SurfaceKind) => void;
  reduce: boolean;
}) {
  return (
    <div className="salon-tray__surfaces" role="group" aria-label="Surface preview">
      <div className="salon-tray__surfaces-row">
        {SURFACE_KINDS.map((s) => (
          <motion.button
            key={s.id}
            type="button"
            className={`salon-tray__surface-swatch ${surface === s.id ? "is-active" : ""}`}
            onClick={() => onSurface(s.id)}
            aria-pressed={surface === s.id}
            aria-label={s.label}
            title={s.label}
            whileHover={reduce ? undefined : { scale: 1.06, transition: salonSpring }}
            whileTap={reduce ? undefined : { scale: 0.96, transition: salonSpring }}
          >
            <SurfaceFormMotif
              kind={s.id}
              variant="swatch"
              className="salon-tray__surface-swatch-motif"
              flavor={s.id === "bouquet-spray" ? (surfaceVariant ?? "bouquet-porcelain-pastel") : undefined}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function heroCenterpiece(kind: StudioArtifact, heroAccent: string, finish: ArtifactFinish | undefined, uid: string) {
  switch (kind) {
    case "brass-orrery":
      return <HeroOrreryScene accent={heroAccent} uid={`armillary-${uid}`} />;
    case "sea-glass":
      return <HeroObsidianScene uid={uid} tint={heroAccent} finish={finish} />;
    case "fluted-column":
      return <HeroColumnScene uid={uid} tint={heroAccent} finish={finish} />;
    case "frosted-pyramid":
      return <HeroPyramidScene uid={uid} tint={heroAccent} finish={finish} />;
    case "glass-cloche":
    default:
      return <HeroCloche uid={`hero-${uid}`} tint={heroAccent} finish={finish} />;
  }
}

function shelfArtifactMesh(project: Project, uid: string) {
  const u = `shelf-${uid}`;
  const kind = inferStudioArtifact(project.id, project);
  const tint = project.artifactTint;
  const finish = project.artifactFinish;
  switch (kind) {
    case "sea-glass":
      return <SeaGlassArtifactSvg uid={u} tint={tint} finish={finish} />;
    case "fluted-column":
      return <ArtifactColumnFragment uid={u} tint={tint} finish={finish} />;
    case "frosted-pyramid":
      return <ArtifactFrostedPyramid uid={u} tint={tint} finish={finish} />;
    case "brass-orrery":
      return <ArtifactBrassOrrery uid={u} tint={tint} finish={finish} />;
    case "glass-cloche":
    default:
      return <ArtifactGlassCloche uid={u} tint={tint} finish={finish} />;
  }
}

/** Same meshes as shelf/hero — use in Compose so Project A sea-glass matches the main room. */
export function studioArtifactMeshForProject(project: Project, uid: string) {
  return shelfArtifactMesh(project, uid);
}

/** Fluted column — limestone read, shallow grooves + specular ribs (not toy blocks). */
function ArtifactColumnFragment({ uid, tint, finish }: { uid: string; tint?: string; finish?: ArtifactFinish }) {
  const g = (s: string) => `${uid}-${s}`;
  return (
    <svg viewBox="0 0 96 96" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id={g("shaft")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c4bbb0" />
          <stop offset="14%" stopColor="#ece6de" />
          <stop offset="42%" stopColor="#faf7f2" />
          <stop offset="58%" stopColor="#efe8df" />
          <stop offset="78%" stopColor="#ddd3c8" />
          <stop offset="100%" stopColor="#b0a698" />
        </linearGradient>
        <linearGradient id={g("flute")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,252,248,0.14)" />
          <stop offset="42%" stopColor="rgba(42,36,32,0.11)" />
          <stop offset="100%" stopColor="rgba(255,252,248,0.08)" />
        </linearGradient>
        <linearGradient id={g("plinth")} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f2ece4" />
          <stop offset="100%" stopColor="#d8cfc4" />
        </linearGradient>
        <radialGradient id={g("tint")} cx="50%" cy="55%" r="60%">
          <stop
            offset="0%"
            stopColor={tint ?? "rgba(170, 160, 190, 0.55)"}
            stopOpacity={finish === "brass" ? "0.18" : finish === "frost" ? "0.24" : "0.28"}
          />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <filter id={g("contact")} x="-12%" y="-8%" width="124%" height="116%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.45" result="b" />
          <feOffset dx="0" dy="1.2" in="b" result="o" />
          <feComponentTransfer in="o" result="a">
            <feFuncA type="linear" slope="0.18" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="a" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="48" cy="88" rx="30" ry="7.5" fill="rgba(38,32,42,0.085)" />
      <path d="M28 88 L29.5 80 L66.5 80 L68 88 Z" fill={`url(#${g("plinth")})`} opacity="0.96" />
      <path d="M31 80 L32 73 L64 73 L65 80 Z" fill="#e7e0d6" />
      <path
        d="M 36 73
           C 35.2 56 35.2 40 36.2 29.5
           C 37 25.5 42 23.5 48 23.5
           C 54 23.5 59 25.5 59.8 29.5
           C 60.8 40 60.8 56 60 73
           C 56.5 75.2 52 75.8 48 75.8
           C 44 75.8 39.5 75.2 36 73 Z"
        fill={`url(#${g("shaft")})`}
        filter={`url(#${g("contact")})`}
      />
      <path
        d="M 36 73
           C 35.2 56 35.2 40 36.2 29.5
           C 37 25.5 42 23.5 48 23.5
           C 54 23.5 59 25.5 59.8 29.5
           C 60.8 40 60.8 56 60 73
           C 56.5 75.2 52 75.8 48 75.8
           C 44 75.8 39.5 75.2 36 73 Z"
        fill={`url(#${g("tint")})`}
        opacity="0.9"
      />
      {[
        [39, 1.65],
        [42.2, 1.58],
        [45.4, 1.52],
        [48.6, 1.52],
        [51.8, 1.56],
        [55, 1.62],
        [57.8, 1.58],
      ].map(([cx, rx], i) => (
        <ellipse key={i} cx={cx} cy={50} rx={rx} ry={23.5} fill={`url(#${g("flute")})`} opacity={0.5} />
      ))}
      {[40.2, 43.6, 47.2, 50.6, 54.2].map((cx, i) => (
        <path
          key={`rib-${i}`}
          d={`M ${cx} 28 L ${cx + 0.45} 70`}
          stroke="rgba(255,252,248,0.2)"
          strokeWidth="0.75"
          strokeLinecap="round"
          fill="none"
        />
      ))}
      <path
        d="M 36.5 31 Q 34.2 49 36.5 69"
        fill="none"
        stroke="rgba(255,255,255,0.32)"
        strokeWidth="1.05"
        strokeLinecap="round"
        opacity="0.38"
      />
      <ellipse cx="48" cy="24.5" rx="14.5" ry="4.6" fill="#f4efe8" opacity="0.98" />
      <ellipse cx="48" cy="23.2" rx="11.8" ry="2.9" fill="rgba(255,255,255,0.45)" opacity="0.35" />
      <path
        d="M40.5 24 Q48 20.2 55.5 24"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="0.45"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

/** Frosted glass pyramid — Project C */
function ArtifactFrostedPyramid({ uid, tint, finish }: { uid: string; tint?: string; finish?: ArtifactFinish }) {
  const r = getFinishRecipe(finish);
  return (
    <svg viewBox="0 0 96 96" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-py`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(220,214,232,0.55)" />
          <stop offset="50%" stopColor="rgba(255,252,248,0.75)" />
          <stop offset="100%" stopColor="rgba(200,192,218,0.45)" />
        </linearGradient>
        <linearGradient id={`${uid}-py-face`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="100%" stopColor="rgba(180,175,200,0.25)" />
        </linearGradient>
        <radialGradient id={`${uid}-tint`} cx="50%" cy="62%" r="62%">
          <stop
            offset="0%"
            stopColor={tint ?? "rgba(170, 160, 190, 0.55)"}
            stopOpacity={String(r.tintOpacity)}
          />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id={`${uid}-spark`} cx="58%" cy="30%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.34)" />
          <stop offset="40%" stopColor="rgba(200, 242, 255, 0.18)" />
          <stop offset="70%" stopColor="rgba(225, 210, 255, 0.14)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <filter id={`${uid}-fog`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={r.fogBlur} />
        </filter>
      </defs>
      <ellipse cx="48" cy="80" rx="30" ry="9" fill="rgba(40,36,48,0.06)" />
      <path d="M48 18 L78 72 L18 72 Z" fill={`url(#${uid}-py)`} opacity="0.92" />
      <path d="M48 18 L78 72 L18 72 Z" fill={`url(#${uid}-tint)`} opacity="0.95" />
      <path
        d="M48 18 L78 72 L18 72 Z"
        fill={`url(#${uid}-spark)`}
        opacity={r.prismOpacity}
        filter={r.fogBlur > 0.2 ? `url(#${uid}-fog)` : undefined}
      />
      <path d="M48 18 L78 72 L62 72 L48 36 Z" fill={`url(#${uid}-py-face)`} opacity="0.55" />
      <path d="M48 18 L18 72 L34 72 L48 36 Z" fill="rgba(255,255,255,0.2)" opacity="0.4" />
      <path d="M48 22 L48 68" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" opacity="0.6" />
    </svg>
  );
}

function ArtifactGlassCloche({ uid, tint, finish }: { uid: string; tint?: string; finish?: ArtifactFinish }) {
  const r = getFinishRecipe(finish);
  return (
    <svg viewBox="0 0 96 96" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-obs`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2a2830" />
          <stop offset="45%" stopColor="#45404c" />
          <stop offset="100%" stopColor="#1c1a22" />
        </linearGradient>
        <linearGradient id={`${uid}-glass`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.82)" />
          <stop offset="36%" stopColor="rgba(240, 248, 255, 0.22)" />
          <stop offset="68%" stopColor="rgba(220, 232, 248, 0.14)" />
          <stop offset="100%" stopColor="rgba(200,205,215,0.1)" />
        </linearGradient>
        <radialGradient id={`${uid}-tint`} cx="52%" cy="62%" r="58%">
          <stop
            offset="0%"
            stopColor={tint ?? "rgba(180, 168, 200, 0.55)"}
            stopOpacity={String(r.tintOpacity)}
          />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id={`${uid}-rim`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={finish === "brass" ? "rgba(255,255,255,0.26)" : "rgba(255,255,255,0.18)"} />
          <stop offset="52%" stopColor="rgba(255,255,255,0.68)" />
          <stop offset="100%" stopColor={finish === "brass" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.22)"} />
        </linearGradient>
        <radialGradient id={`${uid}-sheen`} cx="32%" cy="24%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="48%" stopColor="rgba(255,255,255,0.14)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <linearGradient id={`${uid}-silk`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="22%" stopColor="rgba(255,255,255,0.58)" />
          <stop offset="46%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="66%" stopColor="rgba(255,255,255,0.46)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
        </linearGradient>
        <radialGradient id={`${uid}-prism`} cx="62%" cy="44%" r="66%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="38%" stopColor="rgba(200, 242, 255, 0.14)" />
          <stop offset="70%" stopColor="rgba(225, 210, 255, 0.1)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <filter id={`${uid}-fog`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={r.fogBlur} />
        </filter>
      </defs>
      <path d="M18 78 L78 78 L82 88 L14 88 Z" fill={`url(#${uid}-obs)`} opacity="0.92" />
      {/* Rounder dome silhouette */}
      <path
        d="M22 78c0-30 14-56 26-56s26 26 26 56"
        fill={`url(#${uid}-glass)`}
        opacity={0.9}
        filter={r.fogBlur > 0.2 ? `url(#${uid}-fog)` : undefined}
      />
      <path d="M22 78c0-30 14-56 26-56s26 26 26 56" fill={`url(#${uid}-tint)`} opacity="0.82" />
      <path d="M22 78c0-30 14-56 26-56s26 26 26 56" fill={`url(#${uid}-sheen)`} opacity="0.7" />
      {finish === "silk" ? (
        <path d="M22 78c0-30 14-56 26-56s26 26 26 56" fill={`url(#${uid}-silk)`} opacity={r.sheenOpacity} />
      ) : null}
      <path d="M22 78c0-30 14-56 26-56s26 26 26 56" fill={`url(#${uid}-prism)`} opacity={r.prismOpacity} />
      <path d="M22 78c0-30 14-56 26-56s26 26 26 56" fill="none" stroke={`url(#${uid}-rim)`} strokeWidth="0.72" opacity="0.85" />
      <path d="M33 76c2-22 12-42 15-42" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" strokeLinecap="round" opacity="0.35" />
      <path d="M40 70c3-18 11-34 14-36" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="0.55" opacity="0.16" strokeLinecap="round" />
      <path d="M62 76c-1-24-10-45-14-46" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.75" strokeLinecap="round" opacity="0.18" />
      <ellipse cx="48" cy="24" rx="26" ry="9.2" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.5" opacity="0.7" />
      <ellipse cx="48" cy="24" rx="26" ry="9.2" fill="none" stroke={`url(#${uid}-rim)`} strokeWidth="0.35" opacity="0.55" />
      <ellipse cx="48" cy="84" rx="30" ry="9" fill="rgba(0,0,0,0.07)" />
      <path d="M46 20 L50 14 L54 20" fill="none" stroke="rgba(196,165,116,0.4)" strokeWidth="0.5" strokeLinecap="round" />
    </svg>
  );
}

function ArtifactBrassOrrery({ uid, tint, finish }: { uid: string; tint?: string; finish?: ArtifactFinish }) {
  return (
    <svg viewBox="0 0 96 96" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f4e4cc" />
          <stop offset="40%" stopColor="#c9a66d" />
          <stop offset="100%" stopColor="#7d6540" />
        </linearGradient>
        <linearGradient id={`${uid}-enam`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffefb" />
          <stop offset="100%" stopColor="#e8e2dc" />
        </linearGradient>
        <radialGradient id={`${uid}-boss`} cx="32%" cy="28%" r="65%">
          <stop offset="0%" stopColor="#fffffc" />
          <stop offset="52%" stopColor={tint ?? "#b7a9c6"} stopOpacity={finish === "brass" ? "0.75" : "0.92"} />
          <stop offset="100%" stopColor="#e8dcc8" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="52" rx="34" ry="11" fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="1.35" strokeLinecap="round" />
      <ellipse
        cx="48"
        cy="52"
        rx="28"
        ry="30"
        fill="none"
        stroke={`url(#${uid}-enam)`}
        strokeWidth="1.05"
        opacity="0.88"
        transform="rotate(62 48 52)"
      />
      <ellipse
        cx="48"
        cy="52"
        rx="28"
        ry="30"
        fill="none"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="0.45"
        opacity="0.5"
        transform="rotate(62 48 52)"
      />
      <ellipse
        cx="48"
        cy="52"
        rx="20"
        ry="34"
        fill="none"
        stroke={`url(#${uid}-gold)`}
        strokeWidth="0.75"
        opacity="0.78"
        transform="rotate(-38 48 52)"
      />
      <circle cx="48" cy="52" r="5.5" fill={`url(#${uid}-boss)`} opacity="0.98" />
      <circle cx="48" cy="52" r="5.5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.35" />
      <circle cx="46.2" cy="50" r="1.1" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

function HeroObsidianScene({ uid, tint, finish }: { uid: string; tint?: string; finish?: ArtifactFinish }) {
  return (
    <div className="salon-hero__centerpiece salon-hero__centerpiece--obsidian">
      <SeaGlassArtifactSvg uid={`hs-${uid}`} tint={tint} finish={finish} />
    </div>
  );
}

function HeroColumnScene({ uid, tint, finish }: { uid: string; tint?: string; finish?: ArtifactFinish }) {
  return (
    <div className="salon-hero__centerpiece salon-hero__centerpiece--column">
      <ArtifactColumnFragment uid={`hc-${uid}`} tint={tint} finish={finish} />
    </div>
  );
}

function HeroPyramidScene({ uid, tint, finish }: { uid: string; tint?: string; finish?: ArtifactFinish }) {
  return (
    <div className="salon-hero__centerpiece salon-hero__centerpiece--pyramid">
      <ArtifactFrostedPyramid uid={`hp-${uid}`} tint={tint} finish={finish} />
    </div>
  );
}

function HeroCloche({ uid, tint, finish }: { uid: string; tint?: string; finish?: ArtifactFinish }) {
  const r = getFinishRecipe(finish);
  return (
    <svg className="salon-hero__mesh" viewBox="0 0 280 280" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-obs`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2a2830" />
          <stop offset="50%" stopColor="#3e3a44" />
          <stop offset="100%" stopColor="#1a1820" />
        </linearGradient>
        <linearGradient id={`${uid}-glass`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.82)" />
          <stop offset="38%" stopColor="rgba(240, 248, 255, 0.22)" />
          <stop offset="70%" stopColor="rgba(220, 232, 248, 0.14)" />
          <stop offset="100%" stopColor="rgba(210,202,192,0.16)" />
        </linearGradient>
        <radialGradient id={`${uid}-tint`} cx="52%" cy="62%" r="58%">
          <stop offset="0%" stopColor={tint ?? "rgba(180, 168, 200, 0.55)"} stopOpacity={r.tintOpacity} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id={`${uid}-sheen`} cx="35%" cy="28%" r="55%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.62)" />
          <stop offset="46%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id={`${uid}-prism`} cx="62%" cy="42%" r="62%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="35%" stopColor="rgba(200, 242, 255, 0.12)" />
          <stop offset="65%" stopColor="rgba(225, 210, 255, 0.09)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <filter id={`${uid}-fog`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={r.fogBlur} />
        </filter>
      </defs>
      <ellipse cx="140" cy="228" rx="72" ry="14" fill="rgba(40,36,48,0.08)" />
      <path
        d="M48 228c0-88 42-130 92-130s92 42 92 130"
        fill={`url(#${uid}-glass)`}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.1"
        filter={r.fogBlur > 0.2 ? `url(#${uid}-fog)` : undefined}
      />
      <path d="M56 228 L68 236 L212 236 L224 228" fill={`url(#${uid}-obs)`} opacity="0.95" />
      <path
        d="M48 228c0-88 42-130 92-130s92 42 92 130"
        fill={`url(#${uid}-tint)`}
        opacity="0.85"
      />
      <path
        d="M48 228c0-88 42-130 92-130s92 42 92 130"
        fill={`url(#${uid}-sheen)`}
        opacity="0.72"
      />
      <path
        d="M48 228c0-88 42-130 92-130s92 42 92 130"
        fill={`url(#${uid}-prism)`}
        opacity={r.prismOpacity}
      />
      <ellipse cx="140" cy="96" rx="92" ry="24" fill="none" stroke="rgba(255,255,255,0.46)" strokeWidth="0.75" />
      <ellipse cx="140" cy="96" rx="92" ry="24" fill={`url(#${uid}-sheen)`} opacity="0.3" />
      <path
        d="M108 216c6-62 30-108 44-110"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.22"
      />
    </svg>
  );
}

/**
 * French armillary relief — champagne fog-gold + white enamel rings (SVG only, no icon grid).
 * Whole assembly drifts in a very slow rotation (CSS, respects reduced motion).
 */
function HeroArmillaryRelief({ accent, uid }: { accent: string; uid: string }) {
  const g = (s: string) => `${uid}-${s}`;
  return (
    <div className="salon-armillary-relief" aria-hidden>
      <div className="salon-armillary-relief__spin">
        <svg className="salon-armillary-relief__svg" viewBox="0 0 400 400" fill="none">
          <defs>
            <linearGradient id={g("gold-a")} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8ecd8" />
              <stop offset="22%" stopColor="#e8d4b4" />
              <stop offset="45%" stopColor="#c9a66d" />
              <stop offset="62%" stopColor="#a88452" />
              <stop offset="82%" stopColor="#d9c49a" />
              <stop offset="100%" stopColor="#8f7346" />
            </linearGradient>
            <linearGradient id={g("gold-b")} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#efe2cc" />
              <stop offset="35%" stopColor="#b89258" />
              <stop offset="70%" stopColor="#f2e6d2" />
              <stop offset="100%" stopColor="#7a623e" />
            </linearGradient>
            <linearGradient id={g("enamel")} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffefb" />
              <stop offset="35%" stopColor="#f4f0ea" />
              <stop offset="55%" stopColor="#ebe4dc" />
              <stop offset="78%" stopColor="#f8f6f2" />
              <stop offset="100%" stopColor="#e8eef5" />
            </linearGradient>
            <linearGradient id={g("enamel-edge")} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="100%" stopColor="rgba(210,218,228,0.35)" />
            </linearGradient>
            <radialGradient id={g("core")} cx="32%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#fffffc" />
              <stop offset="42%" stopColor={accent} />
              <stop offset="100%" stopColor="#c4b8a8" />
            </radialGradient>
            <radialGradient id={g("ground")} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(196, 165, 116, 0.14)" />
              <stop offset="55%" stopColor="rgba(60, 52, 48, 0.08)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <filter id={g("soft")} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b" />
              <feOffset dx="0" dy="4" in="b" result="o" />
              <feComponentTransfer in="o" result="a">
                <feFuncA type="linear" slope="0.22" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="a" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse cx="200" cy="312" rx="118" ry="22" fill={`url(#${g("ground")})`} />

          <g filter={`url(#${g("soft")})`}>
            <ellipse
              cx="200"
              cy="198"
              rx="158"
              ry="52"
              stroke={`url(#${g("gold-a")})`}
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <ellipse
              cx="200"
              cy="198"
              rx="158"
              ry="52"
              stroke={`url(#${g("enamel-edge")})`}
              strokeWidth="1.2"
              opacity="0.55"
              transform="translate(0 -1)"
            />
          </g>

          <g opacity="0.92">
            <ellipse
              cx="200"
              cy="198"
              rx="132"
              ry="138"
              transform="rotate(58 200 198)"
              stroke={`url(#${g("enamel")})`}
              strokeWidth="4.2"
              strokeLinecap="round"
            />
            <ellipse
              cx="200"
              cy="198"
              rx="132"
              ry="138"
              transform="rotate(58 200 198)"
              stroke={`url(#${g("gold-b")})`}
              strokeWidth="1.4"
              opacity="0.45"
            />
          </g>

          <g opacity="0.88">
            <ellipse
              cx="200"
              cy="198"
              rx="108"
              ry="124"
              transform="rotate(-38 200 198)"
              stroke={`url(#${g("gold-a")})`}
              strokeWidth="3.6"
              strokeLinecap="round"
            />
            <ellipse
              cx="200"
              cy="198"
              rx="108"
              ry="124"
              transform="rotate(-38 200 198)"
              stroke={`url(#${g("enamel")})`}
              strokeWidth="1.5"
              opacity="0.42"
            />
          </g>

          <ellipse
            cx="200"
            cy="198"
            rx="86"
            ry="90"
            transform="rotate(18 200 198)"
            stroke={`url(#${g("enamel")})`}
            strokeWidth="2.4"
            opacity="0.55"
          />

          <ellipse
            cx="200"
            cy="198"
            rx="86"
            ry="90"
            transform="rotate(18 200 198)"
            stroke={`url(#${g("gold-b")})`}
            strokeWidth="1.1"
            opacity="0.4"
          />

          <circle cx="200" cy="198" r="26" fill={`url(#${g("core")})`} opacity="0.98" />
          <circle cx="200" cy="198" r="26" fill="none" stroke={`url(#${g("enamel-edge")})`} strokeWidth="1.2" opacity="0.65" />
          <ellipse cx="188" cy="186" rx="10" ry="6" fill="rgba(255,255,255,0.42)" opacity="0.55" transform="rotate(-28 188 186)" />
        </svg>
      </div>
    </div>
  );
}

function HeroOrreryScene({ accent, uid }: { accent: string; uid: string }) {
  return <HeroArmillaryRelief accent={accent} uid={uid} />;
}

function OrbitCanopy({ uid }: { uid: string }) {
  return (
    <svg className="salon-orbit-canopy" viewBox="0 0 400 400" aria-hidden>
      <defs>
        <filter id={`${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse
        cx="200"
        cy="188"
        rx="168"
        ry="108"
        fill="none"
        stroke="rgba(255, 252, 248, 0.42)"
        strokeWidth="1.35"
        filter={`url(#${uid}-glow)`}
        transform="rotate(-8 200 188)"
      />
      <ellipse
        cx="200"
        cy="188"
        rx="152"
        ry="96"
        fill="none"
        stroke="rgba(255, 252, 248, 0.55)"
        strokeWidth="0.75"
        opacity="0.92"
        transform="rotate(14 200 188)"
      />
      <path
        d="M 48 176 Q 200 52 352 176"
        fill="none"
        stroke="rgba(255, 250, 242, 0.38)"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CharmGem({ worldId }: { worldId: string }) {
  const p = paletteForWorld(worldId);
  if (p.kind === "drop") {
    return (
      <svg viewBox="0 0 44 52" width="100%" height="100%" className="salon-charm-svg" aria-hidden>
        <defs>
          <linearGradient id={`dg-${worldId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={p.highlight} />
            <stop offset="55%" stopColor={p.core} />
            <stop offset="100%" stopColor={p.sheen} />
          </linearGradient>
        </defs>
        <path
          d="M22 4 C32 18 40 32 38 40 C36 48 28 50 22 48 C16 50 8 48 6 40 C4 32 12 18 22 4Z"
          fill={`url(#dg-${worldId})`}
          opacity="0.92"
        />
        <ellipse cx="18" cy="22" rx="6" ry="10" fill="rgba(255,255,255,0.35)" opacity="0.5" transform="rotate(-18 18 22)" />
      </svg>
    );
  }
  const flat = p.kind === "sphere-matte";
  const silverLoop =
    worldId === "world-oceanus" && !flat ? (
      <path
        d="M12 8 Q22 1 32 8"
        fill="none"
        stroke="rgba(228, 234, 248, 0.95)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    ) : null;
  return (
    <svg viewBox="0 0 44 44" width="100%" height="100%" className="salon-charm-svg" aria-hidden>
      <defs>
        <radialGradient id={`sg-${worldId}`} cx="32%" cy="28%" r="65%">
          <stop offset="0%" stopColor={p.highlight} stopOpacity={flat ? 0.5 : 0.95} />
          <stop offset="100%" stopColor={p.core} />
        </radialGradient>
      </defs>
      <circle cx="22" cy="22" r="18" fill={`url(#sg-${worldId})`} />
      {!flat ? <ellipse cx="16" cy="16" rx="10" ry="6" fill="rgba(255,255,255,0.45)" opacity="0.7" transform="rotate(-25 16 16)" /> : null}
      {silverLoop}
    </svg>
  );
}

export function ClutterPour({
  text,
  onChange,
  onCommit,
  surface,
  surfaceTint,
  onSurfaceTint,
  surfaceVariant,
  onSurfaceVariant,
  textColor,
  textFont,
  onTextColor,
  onTextFont,
  reduce,
  leadingSlot,
  editorRef,
  pulseHighlight,
}: {
  text: string;
  onChange: (t: string) => void;
  onCommit: () => void;
  surface: SurfaceKind;
  surfaceTint?: string;
  onSurfaceTint?: (t: string) => void;
  surfaceVariant?: string;
  onSurfaceVariant?: (v: string) => void;
  textColor: string;
  textFont: "etching" | "serif" | "script";
  onTextColor?: (c: string) => void;
  onTextFont?: (f: "etching" | "serif" | "script") => void;
  reduce: boolean;
  leadingSlot?: ReactNode;
  editorRef?: RefObject<HTMLDivElement>;
  pulseHighlight?: boolean;
}) {
  const fallbackRef = useRef<HTMLDivElement>(null);
  const ref = editorRef ?? fallbackRef;
  const [pourH, setPourH] = useState(180);

  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    if (el.innerText !== text) el.innerText = text;
  }, [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // scrollHeight gives us the real content height incl. wrapping.
    const h = Math.max(160, Math.min(520, el.scrollHeight || 0));
    setPourH(h);
  }, [text]);

  const empty = !text.trim();
  const inkColor = textColor;
  const inkFont =
    textFont === "etching"
      ? `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`
      : textFont === "script"
        ? `"Bickham Script Pro", "Edwardian Script ITC", "Palace Script MT", "Segoe Script", cursive`
        : `var(--font-serif)`;

  const presetInkForFont: Record<"etching" | "serif" | "script", string> = {
    etching: "#26344e",
    serif: "#3a2d28",
    script: "#5a2c3a",
  };

  const bouquetVariants: { id: string; aria: string }[] = [
    { id: "bouquet-porcelain-pastel", aria: "花束變體：柔霧奶白與桃橙" },
    { id: "bouquet-baby-blue", aria: "花束變體：寶寶藍與白" },
    { id: "bouquet-apricot-lily", aria: "花束變體：杏橙百合" },
    { id: "bouquet-lavender-mist", aria: "花束變體：薰衣草霧紫" },
    { id: "bouquet-spring-meadow", aria: "花束變體：春野黃綠" },
  ];

  return (
    <div className="salon-tray__compose-row">
      {leadingSlot ?? null}
      <div className={`salon-tray__pour-glass salon-tray__pour-glass--stretch ${pulseHighlight ? "is-atelier-pulse" : ""}`}>
        <div
          className={`salon-tray__pour-wrap surface-${surface} ${empty ? "is-empty" : ""}`}
          style={
            ({
              ...(surface === "silk-ribbon" && surfaceTint ? { ["--ribbon" as never]: surfaceTint } : null),
              ["--pourH" as never]: `${pourH}px`,
            } as CSSProperties)
          }
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          onMouseDown={(e) => {
            // Only intercept clicks on the wrapper (or decorative layers),
            // otherwise we'll break caret placement inside contentEditable.
            if (e.button !== 0) return;
            const target = e.target as Node | null;
            const editor = ref.current;
            if (editor && target && editor.contains(target)) return;
            e.preventDefault();
            ref.current?.focus();
          }}
        >
          {surface === "bouquet-spray" ? (
            <>
              <div className="salon-tray__bouquet-rail" role="group" aria-label="Bouquet variants">
                {bouquetVariants.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className={`salon-tray__bouquet-chip ${surfaceVariant === b.id ? "is-active" : ""}`}
                    aria-label={b.aria}
                    aria-pressed={surfaceVariant === b.id}
                    onClick={() => onSurfaceVariant?.(b.id)}
                  >
                    <SurfaceFormMotif kind="bouquet-spray" variant="swatch" flavor={b.id} />
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <div className="salon-tray__penbar" role="group" aria-label="Pen choices">
            <button
              type="button"
              className={`salon-tray__pencharm ${textFont === "etching" ? "is-active" : ""}`}
              onClick={() => {
                onTextFont?.("etching");
                onTextColor?.(presetInkForFont.etching);
              }}
              aria-label="蝕刻字感"
              title="蝕刻字感"
            />
            <button
              type="button"
              className={`salon-tray__pencharm ${textFont === "serif" ? "is-active" : ""}`}
              onClick={() => {
                onTextFont?.("serif");
                onTextColor?.(presetInkForFont.serif);
              }}
              aria-label="襯線"
              title="襯線"
            />
            <button
              type="button"
              className={`salon-tray__pencharm ${textFont === "script" ? "is-active" : ""}`}
              onClick={() => {
                onTextFont?.("script");
                onTextColor?.(presetInkForFont.script);
              }}
              aria-label="手寫"
              title="手寫"
            />
            <button
              type="button"
              className="salon-tray__inkcharm"
              aria-label="墨色"
              title="墨色"
              style={{ ["--ink" as never]: textColor } as CSSProperties}
            >
              <input
                type="color"
                value={textColor}
                onChange={(e) => onTextColor?.(e.target.value)}
                aria-label="選擇墨色"
              />
            </button>
            {surface === "silk-ribbon" ? (
              <button
                type="button"
                className="salon-tray__dyecharm"
                aria-label="緞帶染色"
                title="緞帶染色"
                style={{ ["--ribbon" as never]: surfaceTint ?? "#c4a574" } as CSSProperties}
              >
                <input
                  type="color"
                  value={surfaceTint ?? "#c4a574"}
                  onChange={(e) => onSurfaceTint?.(e.target.value)}
                  aria-label="選擇緞帶顏色"
                />
              </button>
            ) : null}
          </div>
          <div className="salon-tray__pour-motif" aria-hidden>
            <SurfaceFormMotif kind={surface} variant="pour" flavor={surface === "bouquet-spray" ? surfaceVariant : undefined} />
          </div>
          <div
            ref={ref}
            className="salon-tray__pour salon-tray__pour--preview"
            contentEditable
            suppressContentEditableWarning
            tabIndex={0}
            style={{ color: inkColor, caretColor: inkColor, fontFamily: inkFont } as CSSProperties}
            role="textbox"
            aria-multiline
            aria-label="Clutter pour — live surface preview"
            onInput={() => {
              const el = ref.current;
              if (el) {
                const h = Math.max(160, Math.min(520, el.scrollHeight || 0));
                setPourH(h);
              }
              onChange(ref.current?.innerText?.replace(/\r\n/g, "\n") ?? "");
            }}
            onBlur={() => {
              const el = ref.current;
              if (!el) return;
              if (el.innerText !== text) onChange(el.innerText ?? "");
            }}
            spellCheck={false}
          />
        </div>
      </div>
      <motion.button
        type="button"
        className="salon-tray__commit-btn scenography-type"
        onClick={onCommit}
        whileHover={reduce ? undefined : { y: -3, transition: salonSpring }}
        whileTap={reduce ? undefined : { scale: 0.98, transition: salonSpring }}
      >
        安放
      </motion.button>
    </div>
  );
}

export function SalonSpatialShell({
  projects,
  currentProject,
  worlds,
  activeWorld,
  wake,
  pourText: _pourText,
  onPourText: _onPourText,
  onPourCommit: _onPourCommit,
  draftZone: _draftZone,
  draftMode: _draftMode,
  draftSurface: _draftSurface,
  draftSurfaceTint: _draftSurfaceTint,
  draftSurfaceVariant: _draftSurfaceVariant,
  draftTextColor: _draftTextColor,
  draftTextFont: _draftTextFont,
  onDraftZone: _onDraftZone,
  onDraftMode: _onDraftMode,
  onDraftSurface: _onDraftSurface,
  onDraftSurfaceTint: _onDraftSurfaceTint,
  onDraftSurfaceVariant: _onDraftSurfaceVariant,
  onDraftTextColor: _onDraftTextColor,
  onDraftTextFont: _onDraftTextFont,
  palaceDrops: _palaceDrops,
  onOpenPalais,
  onOpenTray,
  onConfirmNewProject,
  onUpdateProjectMeta,
  onDeleteProject,
  onSelectProject,
  onSelectWorld,
  onCenterpieceInteract,
}: Props) {
  const reduce = useReducedMotion();
  const [addOpen, setAddOpen] = useState(false);
  const [metaEditOpen, setMetaEditOpen] = useState(false);
  const [spacemanYawDeg] = useState<number>(() => {
    try {
      const raw = window.localStorage.getItem("salon::spacemanYawDeg");
      const n = raw ? Number(raw) : NaN;
      if (!Number.isFinite(n)) return 0;
      return ((n % 360) + 360) % 360;
    } catch {
      return 0;
    }
  });
  const uid = useId().replace(/:/g, "");
  const heroAccent = currentProject.artifactTint ?? (activeWorld ? paletteForWorld(activeWorld.id).core : "#a59bb0");
  const heroKind = inferStudioArtifact(currentProject.id, currentProject);
  const showOrbit = heroKind === "brass-orrery" && worlds.length > 0;

  return (
    <div
      className="salon-room"
      data-ambient={currentProject.ambientState}
      style={
        {
          ["--salon-accent" as never]: heroAccent,
        } as CSSProperties
      }
    >
      <div className="salon-room__atmosphere" aria-hidden />
      <div className="salon-room__window" aria-hidden />
      <div className="salon-room__air" aria-hidden />
      <div className="salon-room__curtain" aria-hidden />
      <div className="salon-room__floor-mist" aria-hidden />
      <div className="salon-room__grain" aria-hidden />

      <header className="salon-veil">Spatial salon</header>

      <div className="salon-spaceman">
        <SpacemanGlbCanvas
          className="salon-spaceman__gl"
          accentColor={heroAccent}
          yaw={(spacemanYawDeg * Math.PI) / 180}
        />
      </div>

      <div className="salon-shelf-zone">
        <div className="shelf-toolbar">
          <p className="shelf-eyebrow scenography-type type-elegant-caps">手邊清單</p>
          <div className="shelf-toolbar-actions">
            <motion.button
              type="button"
              className="shelf-curio scenography-type"
              onClick={onOpenPalais}
              whileHover={reduce ? undefined : { y: -3, transition: salonSpring }}
              whileTap={reduce ? undefined : { scale: 0.98, transition: salonSpring }}
            >
              Palais
            </motion.button>
            <motion.button
              type="button"
              className="shelf-meta scenography-type type-elegant-caps"
              onClick={() => setMetaEditOpen(true)}
              whileHover={reduce ? undefined : { y: -3, transition: salonSpring }}
              whileTap={reduce ? undefined : { scale: 0.98, transition: salonSpring }}
            >
              編輯專案
            </motion.button>
            <motion.button
              type="button"
              className="shelf-add scenography-type"
              onClick={() => setAddOpen(true)}
              whileHover={reduce ? undefined : { y: -3, transition: salonSpring }}
              whileTap={reduce ? undefined : { scale: 0.98, transition: salonSpring }}
            >
              Add project
            </motion.button>
          </div>
        </div>
        <div className="shelf-assembly">
          <div className="shelf-space">
            <div className="shelf-objects">
              {projects.map((p, idx) => (
                <motion.div
                  key={p.id}
                  className="shelf-object-wrap"
                  animate={reduce ? undefined : { y: [0, -3, 0] }}
                  transition={
                    reduce ? undefined : { duration: 11 + idx * 1.1, repeat: Infinity, ease: "easeInOut" }
                  }
                >
                  <motion.button
                    type="button"
                    className={`salon-artifact ${p.id === currentProject.id ? "is-chosen" : ""}`}
                    onClick={() => onSelectProject(p.id)}
                    aria-pressed={p.id === currentProject.id}
                    whileHover={reduce ? undefined : { y: -5, transition: salonSpring }}
                    whileTap={reduce ? undefined : { scale: 0.98, transition: salonSpring }}
                  >
                    <span className="salon-artifact__mesh">{shelfArtifactMesh(p, `${uid}-${p.id}`)}</span>
                    <span className="salon-artifact__caption scenography-type type-elegant-caption">
                      <span className="salon-artifact__title">{p.name}</span>
                      {p.subtitle?.trim() ? (
                        <span className="type-elegant-sub">{p.subtitle.trim()}</span>
                      ) : null}
                      {p.status?.trim() ? (
                        <span className="salon-artifact__status type-elegant-caps">{p.status.trim()}</span>
                      ) : null}
                    </span>
                  </motion.button>
                  {projects.length > 1 ? (
                    <button
                      type="button"
                      className="salon-artifact__remove type-elegant-caps"
                      aria-label={`移除專案 ${p.name}`}
                      title="移除此專案與其紀錄"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDeleteProject(p.id);
                      }}
                    >
                      <span aria-hidden>×</span>
                    </button>
                  ) : null}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="salon-hero">
        <div className="salon-hero__ambient" aria-hidden />
        <div className="salon-hero__masthead">
          <p className="salon-hero__label scenography-type type-hero-title">{currentProject.name}</p>
          {currentProject.subtitle?.trim() ? (
            <p className="salon-hero__tagline type-elegant-sub">{currentProject.subtitle.trim()}</p>
          ) : null}
          {currentProject.status?.trim() ? (
            <p className="salon-hero__status-chip type-elegant-caps">{currentProject.status.trim()}</p>
          ) : null}
        </div>
        <motion.div
          className="salon-hero__float"
          animate={
            reduce
              ? undefined
              : {
                  y: [0, -5, 0],
                  scale: [1, 1.02, 1],
                }
          }
          transition={
            reduce
              ? undefined
              : { duration: 10, repeat: Infinity, ease: [0.42, 0, 0.58, 1] }
          }
        >
          <button
            type="button"
            className="salon-hero__touch"
            onClick={onCenterpieceInteract}
            aria-label="Shift salon ambiance — touch the studio centerpiece"
          >
            {heroCenterpiece(heroKind, heroAccent, currentProject.artifactFinish, uid)}
          </button>
        </motion.div>

        {showOrbit ? (
          <div className="salon-orbit">
            <OrbitCanopy uid={`orbit-${uid}`} />
            {worlds.map((w, i) => {
              const slot = charmSlots[i] ?? charmSlots[0];
              const active = activeWorld?.id === w.id;
              const isDrop = paletteForWorld(w.id).kind === "drop";
              return (
                <button
                  key={w.id}
                  type="button"
                  className="salon-charm-hit"
                  style={
                    {
                      left: slot.left,
                      top: slot.top,
                      transform: "translate(-50%, -50%)",
                    } as CSSProperties
                  }
                  onClick={() => onSelectWorld(w.id)}
                  aria-pressed={active}
                >
                  <span style={{ display: "block" }}>
                    <span className={`salon-charm-bowl ${active ? "is-active" : ""} ${isDrop ? "is-drop" : ""}`}>
                      <span className="salon-charm-bowl__glass" />
                      <CharmGem worldId={w.id} />
                    </span>
                  </span>
                  <span className="salon-charm-name scenography-type">{w.symbol}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <aside className="salon-wake salon-wake--schematic" aria-label="上一則速記（示意）">
        <div className="salon-wake__head">
          <p className="salon-wake__eyebrow scenography-type type-elegant-caps">速記</p>
          <motion.button
            type="button"
            className="salon-wake__cta scenography-type type-elegant-caps"
            aria-label="開啟 Palais 全覽"
            onClick={onOpenPalais}
            whileHover={reduce ? undefined : { y: -4, transition: salonSpring }}
            whileTap={reduce ? undefined : { scale: 0.98, transition: salonSpring }}
          >
            Palais 見
          </motion.button>
        </div>
        <motion.div
          className="salon-wake__schematic-sheet"
          initial={reduce ? false : { opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={salonSpringSoft}
        >
          <div className="salon-wake__schematic-top">
            <div className="salon-wake__form-column">
              {wake.lastSurfaceKind ? (
                <span className="salon-wake__form-chip" aria-hidden>
                  <SurfaceFormMotif kind={wake.lastSurfaceKind} variant="swatch" />
                </span>
              ) : (
                <>
                  <span className="salon-wake__form-chip salon-wake__form-chip--empty" aria-hidden />
                  <span className="salon-wake__form-legend salon-wake__form-legend--muted type-elegant-caps">載體</span>
                </>
              )}
            </div>
            <p className="salon-wake__snippet type-wake-body">{wake.lastTouch}</p>
          </div>
        </motion.div>
      </aside>

      <motion.button
        type="button"
        className="salon-compose-fab"
        aria-label="Compose — open writing panel"
        onClick={onOpenTray}
        whileHover={reduce ? undefined : { y: -4, transition: salonSpring }}
        whileTap={reduce ? undefined : { scale: 0.98, transition: salonSpring }}
      >
        <span className="salon-compose-fab__ic" aria-hidden>
          <svg viewBox="0 0 96 96" width="100%" height="100%">
            <defs>
              <linearGradient id={`q-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
                <stop offset="38%" stopColor="rgba(230, 235, 248, 0.68)" />
                <stop offset="100%" stopColor="rgba(196,165,116,0.55)" />
              </linearGradient>
              <radialGradient id={`qv-${uid}`} cx="28%" cy="18%" r="70%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                <stop offset="40%" stopColor="rgba(255,255,255,0.22)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
            {/* Scroll */}
            <path
              d="M18 30c0-6 6-10 14-10h26c10 0 18 6 18 14v34c0 6-6 10-14 10H36c-10 0-18-6-18-14V30Z"
              fill="rgba(255,252,248,0.62)"
              opacity="0.95"
            />
            <path d="M30 28c0-6 6-10 14-10h18c10 0 18 6 18 14" fill="none" stroke="rgba(196,165,116,0.55)" strokeWidth="1.2" opacity="0.7" />
            {/* Quill */}
            <path
              d="M68 22c8 6 10 14 5 22-5 8-12 10-20 6 2-2 4-5 5-8-6 6-12 9-18 10 6-6 9-12 10-18-3 1-6 3-8 5 0-8 2-15 10-20 8-5 16-3 16 3Z"
              fill={`url(#q-${uid})`}
              opacity="0.95"
            />
            <path
              d="M52 52c3-2 6-6 8-10"
              fill="none"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path d="M18 30c0-6 6-10 14-10h26c10 0 18 6 18 14v34c0 6-6 10-14 10H36c-10 0-18-6-18-14V30Z" fill={`url(#qv-${uid})`} opacity="0.8" />
          </svg>
        </span>
      </motion.button>

      <AddProjectSalon
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={(opts) => {
          onConfirmNewProject(opts);
          setAddOpen(false);
        }}
        reduce={Boolean(reduce)}
      />
      <EditProjectMetaSalon
        open={metaEditOpen}
        project={currentProject}
        onClose={() => setMetaEditOpen(false)}
        onSave={(patch) => onUpdateProjectMeta(currentProject.id, patch)}
        reduce={Boolean(reduce)}
      />
    </div>
  );
}
