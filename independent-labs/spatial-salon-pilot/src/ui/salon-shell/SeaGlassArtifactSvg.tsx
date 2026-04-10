import type { ArtifactFinish } from "../../domain/types";

import { getFinishRecipe } from "./materialFinish";

/** Project A — same faceted cabochon as main hero / shelf (single source of truth). */
export function SeaGlassArtifactSvg({
  uid,
  tint,
  finish,
}: {
  uid: string;
  tint?: string;
  finish?: ArtifactFinish;
}) {
  const r = getFinishRecipe(finish);
  return (
    <svg viewBox="0 0 96 96" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-body`} x1="18%" y1="0%" x2="82%" y2="100%">
          <stop offset="0%" stopColor="rgba(235, 252, 255, 0.55)" />
          <stop offset="26%" stopColor="rgba(175, 232, 248, 0.32)" />
          <stop offset="62%" stopColor="rgba(120, 195, 225, 0.25)" />
          <stop offset="100%" stopColor="rgba(70, 150, 190, 0.35)" />
        </linearGradient>
        <linearGradient id={`${uid}-deep`} x1="0%" y1="100%" x2="90%" y2="0%">
          <stop offset="0%" stopColor="rgba(50, 110, 150, 0.22)" />
          <stop offset="100%" stopColor="rgba(230, 250, 255, 0.06)" />
        </linearGradient>
        <linearGradient id={`${uid}-rim`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="rgba(255, 246, 232, 0.28)" />
          <stop offset="52%" stopColor="rgba(255, 255, 255, 0.82)" />
          <stop offset="100%" stopColor="rgba(240, 220, 190, 0.26)" />
        </linearGradient>
        <radialGradient id={`${uid}-sheen`} cx="28%" cy="22%" r="55%">
          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.75)" />
          <stop offset="45%" stopColor="rgba(255, 255, 255, 0.15)" />
          <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
        </radialGradient>
        <linearGradient id={`${uid}-silk`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="22%" stopColor="rgba(255,255,255,0.58)" />
          <stop offset="46%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="66%" stopColor="rgba(255,255,255,0.46)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
        </linearGradient>
        <radialGradient id={`${uid}-caustic`} cx="56%" cy="70%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.34)" />
          <stop offset="42%" stopColor="rgba(200,240,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id={`${uid}-tint`} cx="52%" cy="62%" r="60%">
          <stop
            offset="0%"
            stopColor={tint ?? "rgba(170, 160, 190, 0.55)"}
            stopOpacity={String(r.tintOpacity)}
          />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <path
        d="M48 12 L72 28 L78 58 L62 84 L34 88 L14 62 L18 32 Z"
        fill={`url(#${uid}-body)`}
        filter="drop-shadow(0 10px 18px rgba(45, 85, 110, 0.2))"
      />
      <path d="M48 12 L72 28 L78 58 L62 84 L34 88 L14 62 L18 32 Z" fill={`url(#${uid}-tint)`} opacity="0.95" />
      {finish === "silk" ? (
        <path
          d="M48 12 L72 28 L78 58 L62 84 L34 88 L14 62 L18 32 Z"
          fill={`url(#${uid}-silk)`}
          opacity={r.sheenOpacity}
        />
      ) : null}
      <path
        d="M48 12 L72 28 L78 58 L62 84 L34 88 L14 62 L18 32 Z"
        fill={`url(#${uid}-caustic)`}
        opacity={r.causticOpacity}
      />
      <path d="M48 12 L38 48 L18 32 Z" fill={`url(#${uid}-deep)`} />
      <path d="M72 28 L62 84 L78 58 Z" fill="rgba(255,255,255,0.12)" />
      <path d="M34 88 L14 62 L38 48 L48 78 Z" fill="rgba(165, 210, 232, 0.25)" />
      <path
        d="M48 12 L72 28 L78 58 L62 84 L34 88 L14 62 L18 32 Z"
        fill="none"
        stroke={`url(#${uid}-rim)`}
        strokeWidth="0.85"
        opacity="0.58"
      />
      <path d="M48 12 L38 48 L18 32 Z" fill={`url(#${uid}-sheen)`} opacity="0.55" />
      <path
        d="M30 56c5-18 20-30 32-26"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.18"
      />
    </svg>
  );
}
