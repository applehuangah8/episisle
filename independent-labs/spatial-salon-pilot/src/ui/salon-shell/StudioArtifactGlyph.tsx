import { useId } from "react";

import type { ArtifactFinish, StudioArtifact } from "../../domain/types";

import { SeaGlassArtifactSvg } from "./SeaGlassArtifactSvg";

export function StudioArtifactGlyph({
  kind,
  tint,
  finish,
}: {
  kind: StudioArtifact;
  tint: string;
  finish: ArtifactFinish;
}) {
  const uid = useId().replace(/:/g, "");
  const g = (s: string) => `glyph-${uid}-${s}`;

  switch (kind) {
    case "brass-orrery":
      return (
        <svg viewBox="0 0 96 96" width="100%" height="100%" aria-hidden>
          <defs>
            <linearGradient id={g("gold")} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f4e4cc" />
              <stop offset="40%" stopColor="#c9a66d" />
              <stop offset="100%" stopColor="#7d6540" />
            </linearGradient>
            <linearGradient id={g("enam")} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fffefb" />
              <stop offset="100%" stopColor="#e8e2dc" />
            </linearGradient>
            <radialGradient id={g("boss")} cx="32%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#fffffc" />
              <stop offset="52%" stopColor={tint} />
              <stop offset="100%" stopColor="#e8dcc8" />
            </radialGradient>
          </defs>
          <ellipse
            cx="48"
            cy="52"
            rx="34"
            ry="11"
            fill="none"
            stroke={`url(#${g("gold")})`}
            strokeWidth="1.35"
            strokeLinecap="round"
          />
          <ellipse
            cx="48"
            cy="52"
            rx="28"
            ry="30"
            fill="none"
            stroke={`url(#${g("enam")})`}
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
            stroke={`url(#${g("gold")})`}
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
            stroke={`url(#${g("gold")})`}
            strokeWidth="0.75"
            opacity="0.78"
            transform="rotate(-38 48 52)"
          />
          <circle cx="48" cy="52" r="5.5" fill={`url(#${g("boss")})`} opacity="0.98" />
          <circle cx="48" cy="52" r="5.5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.35" />
          <circle cx="46.2" cy="50" r="1.1" fill="rgba(255,255,255,0.55)" />
        </svg>
      );
    case "glass-cloche":
      return (
        <svg viewBox="0 0 96 96" width="100%" height="100%" aria-hidden>
          <defs>
            <linearGradient id={g("obs")} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2a2830" />
              <stop offset="45%" stopColor="#45404c" />
              <stop offset="100%" stopColor="#1c1a22" />
            </linearGradient>
            <linearGradient id={g("glass")} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.82)" />
              <stop offset="36%" stopColor="rgba(240, 248, 255, 0.22)" />
              <stop offset="68%" stopColor="rgba(220, 232, 248, 0.14)" />
              <stop offset="100%" stopColor="rgba(200,205,215,0.1)" />
            </linearGradient>
            <radialGradient id={g("tint")} cx="52%" cy="62%" r="58%">
              <stop
                offset="0%"
                stopColor={tint}
                stopOpacity={
                  finish === "frost" ? "0.22" : finish === "crystal" ? "0.3" : finish === "sea-glass" ? "0.28" : "0.26"
                }
              />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <linearGradient id={g("rim")} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.18)" />
              <stop offset="52%" stopColor="rgba(255,255,255,0.68)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.22)" />
            </linearGradient>
            <radialGradient id={g("sheen")} cx="32%" cy="24%" r="60%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.78)" />
              <stop offset="48%" stopColor="rgba(255,255,255,0.14)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <radialGradient id={g("prism")} cx="62%" cy="44%" r="66%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
              <stop offset="38%" stopColor="rgba(200, 242, 255, 0.14)" />
              <stop offset="70%" stopColor="rgba(225, 210, 255, 0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <linearGradient id={g("silk")} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="22%" stopColor="rgba(255,255,255,0.58)" />
              <stop offset="46%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="66%" stopColor="rgba(255,255,255,0.46)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
            </linearGradient>
            <filter id={g("fog")} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" />
            </filter>
          </defs>
          <path d="M18 78 L78 78 L82 88 L14 88 Z" fill={`url(#${g("obs")})`} opacity="0.92" />
          <path
            d="M22 78c0-30 14-56 26-56s26 26 26 56"
            fill={`url(#${g("glass")})`}
            opacity={finish === "crystal" ? "0.92" : finish === "frost" ? "0.78" : "0.86"}
            filter={finish === "frost" ? `url(#${g("fog")})` : undefined}
          />
          <path d="M22 78c0-30 14-56 26-56s26 26 26 56" fill={`url(#${g("tint")})`} opacity="0.82" />
          <path d="M22 78c0-30 14-56 26-56s26 26 26 56" fill={`url(#${g("sheen")})`} opacity="0.7" />
          {finish === "silk" ? (
            <path d="M22 78c0-30 14-56 26-56s26 26 26 56" fill={`url(#${g("silk")})`} opacity="0.78" />
          ) : null}
          <path
            d="M22 78c0-30 14-56 26-56s26 26 26 56"
            fill={`url(#${g("prism")})`}
            opacity={finish === "crystal" ? "0.88" : finish === "sea-glass" ? "0.82" : finish === "opal" ? "0.7" : "0.62"}
          />
          <path d="M22 78c0-30 14-56 26-56s26 26 26 56" fill="none" stroke={`url(#${g("rim")})`} strokeWidth="0.72" opacity="0.85" />
          <ellipse cx="48" cy="84" rx="30" ry="9" fill="rgba(0,0,0,0.07)" />
        </svg>
      );
    case "sea-glass":
      return <SeaGlassArtifactSvg uid={`${uid}-sea`} tint={tint} finish={finish} />;
    case "fluted-column":
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
            <radialGradient id={g("tint")} cx="50%" cy="55%" r="60%">
              <stop offset="0%" stopColor={tint} stopOpacity={finish === "brass" ? "0.18" : finish === "frost" ? "0.22" : "0.26"} />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <ellipse cx="48" cy="88" rx="30" ry="7.5" fill="rgba(38,32,42,0.085)" />
          <path d="M28 88 L29.5 80 L66.5 80 L68 88 Z" fill="#e7e0d6" opacity="0.96" />
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
            opacity="0.98"
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
        </svg>
      );
    case "frosted-pyramid":
    default:
      return (
        <svg viewBox="0 0 96 96" width="100%" height="100%" aria-hidden>
          <defs>
            <linearGradient id={g("py")} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(220,214,232,0.55)" />
              <stop offset="50%" stopColor="rgba(255,252,248,0.75)" />
              <stop offset="100%" stopColor="rgba(200,192,218,0.45)" />
            </linearGradient>
            <radialGradient id={g("tint")} cx="50%" cy="62%" r="62%">
              <stop offset="0%" stopColor={tint} stopOpacity={finish === "frost" ? "0.22" : "0.28"} />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <ellipse cx="48" cy="80" rx="30" ry="9" fill="rgba(40,36,48,0.06)" />
          <path d="M48 18 L78 72 L18 72 Z" fill={`url(#${g("py")})`} opacity="0.92" />
          <path d="M48 18 L78 72 L18 72 Z" fill={`url(#${g("tint")})`} opacity="0.95" />
        </svg>
      );
  }
}

