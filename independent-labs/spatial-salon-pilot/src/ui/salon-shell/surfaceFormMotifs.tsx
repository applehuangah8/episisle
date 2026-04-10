import { useId } from "react";

import type { SurfaceKind } from "../../domain/types";

type Variant = "pour" | "swatch" | "exhibit";

function cls(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function bouquetLinePalette(f: string) {
  switch (f) {
    case "bouquet-baby-blue":
      return { a: "rgba(95, 125, 185, 0.52)", b: "rgba(175, 210, 250, 0.42)", c: "rgba(65, 90, 145, 0.36)" };
    case "bouquet-apricot-lily":
      return { a: "rgba(195, 110, 88, 0.48)", b: "rgba(245, 200, 175, 0.4)", c: "rgba(130, 85, 105, 0.38)" };
    case "bouquet-lavender-mist":
      return { a: "rgba(140, 110, 165, 0.48)", b: "rgba(220, 200, 235, 0.42)", c: "rgba(95, 75, 125, 0.36)" };
    case "bouquet-spring-meadow":
      return { a: "rgba(95, 145, 105, 0.45)", b: "rgba(200, 235, 210, 0.4)", c: "rgba(70, 110, 95, 0.34)" };
    default:
      return { a: "rgba(155, 125, 150, 0.46)", b: "rgba(235, 220, 232, 0.42)", c: "rgba(105, 90, 125, 0.36)" };
  }
}

/** Curatorial motifs: each surface form reads as object / material — not flat swatches. */
export function SurfaceFormMotif({
  kind,
  variant,
  flavor,
  className,
}: {
  kind: SurfaceKind;
  variant: Variant;
  flavor?: string;
  className?: string;
}) {
  const base = cls("surface-form-motif", `surface-form-motif--${kind}`, `surface-form-motif--${variant}`, className);
  const bouquetId = `bv${useId().replace(/:/g, "")}`;

  switch (kind) {
    case "frosted-plaque":
      if (variant === "swatch") {
        const g = `fp${bouquetId}`;
        return (
          <svg className={base} viewBox="0 0 120 48" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={`${g}-wash`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(252, 250, 255, 0.94)" />
                <stop offset="100%" stopColor="rgba(232, 228, 248, 0.78)" />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="108" height="36" rx="14" fill={`url(#${g}-wash)`} opacity="0.96" />
            <path
              d="M14 36 C 24 10 44 14 60 30 S 90 42 108 18"
              fill="none"
              stroke="rgba(105, 100, 155, 0.45)"
              strokeWidth="1.15"
              strokeLinecap="round"
            />
            <path
              d="M20 40 C 34 20 52 16 70 32 S 96 44 114 24"
              fill="none"
              stroke="rgba(155, 150, 200, 0.32)"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
            <path
              d="M46 42 Q 54 22 62 12 Q 70 8 78 16 Q 72 28 60 34"
              fill="none"
              stroke="rgba(85, 82, 125, 0.4)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        );
      }
      if (variant === "exhibit") {
        // Exhibit should read as material only (no drawn lines)
        const g = `fpx${bouquetId}`;
        return (
          <svg className={base} viewBox="0 0 120 48" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={`${g}-paper`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(252, 252, 252, 0.94)" />
                <stop offset="55%" stopColor="rgba(242, 246, 252, 0.92)" />
                <stop offset="100%" stopColor="rgba(248, 250, 255, 0.94)" />
              </linearGradient>
              <filter id={`${g}-fiber`} x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" stitchTiles="stitch" />
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.12 0" />
                <feBlend mode="multiply" in2="SourceGraphic" />
              </filter>
            </defs>
            <path
              d="M8,12 Q18,4 32,8 T56,6 T88,10 T112,8 L114,30 Q110,38 114,46 L110,44 Q94,46 82,44 T56,46 T30,44 Q14,42 10,34 Z"
              fill={`url(#${g}-paper)`}
              filter={`url(#${g}-fiber)`}
              opacity="0.95"
            />
          </svg>
        );
      }
      {
        const g = `fppour${bouquetId}`;
        return (
          <svg className={base} viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id={`${g}-wash`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(250, 248, 255, 0.38)" />
                <stop offset="100%" stopColor="rgba(220, 216, 240, 0.24)" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="120" height="44" fill={`url(#${g}-wash)`} />
            <path
              d="M6 32 C 20 6 42 12 62 26 S 94 40 116 16"
              fill="none"
              stroke="rgba(105, 100, 155, 0.26)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M10 36 C 26 16 46 14 64 28 S 98 38 114 22"
              fill="none"
              stroke="rgba(140, 135, 185, 0.2)"
              strokeWidth="0.85"
              strokeLinecap="round"
            />
          </svg>
        );
      }
    case "etching-parchment": {
      const g = `ep${bouquetId}`;

      if (variant === "swatch") {
        return (
          <svg className={base} viewBox="0 0 120 48" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={`${g}-wash`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(252, 246, 236, 0.95)" />
                <stop offset="100%" stopColor="rgba(236, 226, 238, 0.82)" />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="108" height="36" rx="14" fill={`url(#${g}-wash)`} opacity="0.97" />
            <path
              d="M12 38 C 22 14 38 12 56 28 S 84 44 110 22"
              fill="none"
              stroke="rgba(72, 62, 88, 0.42)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M18 40 C 30 22 48 18 66 32 S 94 42 112 26"
              fill="none"
              stroke="rgba(120, 100, 125, 0.32)"
              strokeWidth="0.88"
              strokeLinecap="round"
            />
            <path
              d="M48 40 Q 56 20 66 14 Q 76 12 84 22 Q 76 34 62 38"
              fill="none"
              stroke="rgba(55, 48, 72, 0.38)"
              strokeWidth="0.95"
              strokeLinecap="round"
            />
          </svg>
        );
      }

      return (
        <svg className={base} viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id={`${g}-p`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 250, 242, 0.4)" />
              <stop offset="100%" stopColor="rgba(230, 218, 228, 0.22)" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="120" height="44" fill={`url(#${g}-p)`} />
          <path
            d="M4 34 C 18 8 40 14 60 28 S 92 42 118 14"
            fill="none"
            stroke="rgba(72, 62, 88, 0.28)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M8 36 C 24 18 42 16 62 30 S 96 40 114 20"
            fill="none"
            stroke="rgba(110, 95, 118, 0.22)"
            strokeWidth="0.85"
            strokeLinecap="round"
          />
        </svg>
      );
    }
    case "time-capsule":
      return (
        <svg className={base} viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="tc-b" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="rgba(200,185,168,0.45)" />
              <stop offset="50%" stopColor="rgba(255,248,235,0.55)" />
              <stop offset="100%" stopColor="rgba(190,175,155,0.48)" />
            </linearGradient>
          </defs>
          <rect x="6" y="10" rx="14" ry="14" width="108" height="22" fill="url(#tc-b)" stroke="rgba(150,130,105,0.35)" strokeWidth="0.7" />
          <circle cx="60" cy="21" r="5" fill="rgba(120,95,75,0.2)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
          <path d="M58,19 L62,23 M62,19 L58,23" stroke="rgba(90,72,58,0.25)" strokeWidth="0.5" />
        </svg>
      );
    case "atelier-sketch":
      if (variant === "swatch") {
        const g = `as${bouquetId}`;
        return (
          <svg className={base} viewBox="0 0 120 48" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={`${g}-wash`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(252, 248, 238, 0.96)" />
                <stop offset="100%" stopColor="rgba(238, 228, 218, 0.85)" />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="108" height="36" rx="14" fill={`url(#${g}-wash)`} opacity="0.97" />
            <path
              d="M14 38 C 26 12 42 16 58 30 S 88 42 108 20"
              fill="none"
              stroke="rgba(62, 52, 48, 0.45)"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
            <path
              d="M22 40 C 34 22 50 18 68 32 S 96 40 114 26"
              fill="none"
              stroke="rgba(180, 110, 125, 0.38)"
              strokeWidth="0.85"
              strokeLinecap="round"
            />
            <path
              d="M32 18 C 48 10 62 14 74 26"
              fill="none"
              stroke="rgba(62, 52, 48, 0.22)"
              strokeWidth="0.75"
              strokeLinecap="round"
              strokeDasharray="3 4"
            />
          </svg>
        );
      }
      if (variant === "exhibit") {
        // Exhibit should read as paper texture only (no sketch lines)
        const g = `asx${bouquetId}`;
        return (
          <svg className={base} viewBox="0 0 120 48" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={`${g}-paper`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(252, 249, 242, 0.96)" />
                <stop offset="60%" stopColor="rgba(244, 238, 228, 0.94)" />
                <stop offset="100%" stopColor="rgba(252, 249, 242, 0.96)" />
              </linearGradient>
              <filter id={`${g}-grain`} x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" stitchTiles="stitch" />
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.14 0" />
                <feBlend mode="multiply" in2="SourceGraphic" />
              </filter>
            </defs>
            <path
              d="M8,12 Q18,4 32,8 T56,6 T88,10 T112,8 L114,30 Q110,38 114,46 L110,44 Q94,46 82,44 T56,46 T30,44 Q14,42 10,34 Z"
              fill={`url(#${g}-paper)`}
              filter={`url(#${g}-grain)`}
              opacity="0.95"
            />
          </svg>
        );
      }
      {
        const g = `aspour${bouquetId}`;
        return (
          <svg className={base} viewBox="0 0 120 44" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id={`${g}-wash`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(252, 246, 236, 0.35)" />
                <stop offset="100%" stopColor="rgba(230, 218, 205, 0.2)" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="120" height="44" fill={`url(#${g}-wash)`} />
            <path
              d="M4 34 C 22 6 46 12 68 28 S 102 44 118 16"
              fill="none"
              stroke="rgba(55, 48, 42, 0.26)"
              strokeWidth="1.15"
              strokeLinecap="round"
            />
            <path
              d="M8 36 C 28 16 48 14 70 30 S 100 38 116 22"
              fill="none"
              stroke="rgba(170, 100, 115, 0.24)"
              strokeWidth="0.88"
              strokeLinecap="round"
            />
          </svg>
        );
      }
    case "silk-ribbon": {
      const g = `sr${bouquetId}`;
      return (
        <svg className={base} viewBox="0 0 160 52" preserveAspectRatio="xMidYMid meet" aria-hidden>
          <defs>
            <linearGradient id={`${g}-silk`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.62)" />
              <stop offset="22%" stopColor="rgba(255, 255, 255, 0.18)" />
              <stop offset="46%" stopColor="rgba(255, 255, 255, 0.58)" />
              <stop offset="68%" stopColor="rgba(255, 255, 255, 0.12)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.42)" />
            </linearGradient>
          </defs>
          <path
            d="M6 30 C 32 4, 56 8, 84 28 C 108 44, 128 46, 154 24"
            fill="none"
            stroke="rgba(60, 52, 78, 0.12)"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d="M6 30 C 32 4, 56 8, 84 28 C 108 44, 128 46, 154 24"
            fill="none"
            stroke={`url(#${g}-silk)`}
            strokeWidth="6.5"
            strokeLinecap="round"
            opacity="0.88"
          />
          <path
            d="M10 26 C 34 8, 54 12, 84 28 C 110 42, 132 40, 150 22"
            fill="none"
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.68"
          />
          <path
            d="M102 34 C 118 24, 130 26, 148 38 C 154 42, 158 38, 158 32"
            fill="none"
            stroke="rgba(92, 85, 118, 0.14)"
            strokeWidth="5.5"
            strokeLinecap="round"
            opacity="0.45"
          />
          <path
            d="M104 32 C 120 22, 132 24, 146 34"
            fill="none"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.05"
            strokeLinecap="round"
            opacity="0.55"
          />
        </svg>
      );
    }
    case "bouquet-spray": {
      const b = bouquetId;
      const f = flavor ?? "bouquet-porcelain-pastel";

      const palette =
        f === "bouquet-baby-blue"
          ? {
              callaA: "rgba(255, 255, 255, 0.92)",
              callaB: "rgba(235, 246, 255, 0.9)",
              callaCore: "rgba(230, 190, 120, 0.32)",
              blueA: "rgba(175, 208, 255, 0.88)",
              blueB: "rgba(150, 190, 245, 0.84)",
              pinkA: "rgba(255, 235, 245, 0.8)",
              shadow: "rgba(72,58,48,0.11)",
              vaseA: "rgba(255, 255, 255, 0.92)",
              vaseB: "rgba(220, 228, 238, 0.45)",
            }
          : f === "bouquet-apricot-lily"
            ? {
                callaA: "rgba(255, 252, 246, 0.92)",
                callaB: "rgba(255, 236, 214, 0.9)",
                callaCore: "rgba(255, 160, 78, 0.38)",
                blueA: "rgba(235, 220, 255, 0.76)",
                blueB: "rgba(205, 182, 240, 0.72)",
                pinkA: "rgba(255, 232, 220, 0.78)",
                shadow: "rgba(72,58,48,0.115)",
                vaseA: "rgba(255, 255, 255, 0.92)",
                vaseB: "rgba(230, 218, 210, 0.4)",
              }
            : f === "bouquet-lavender-mist"
              ? {
                  callaA: "rgba(255, 252, 252, 0.9)",
                  callaB: "rgba(245, 236, 255, 0.88)",
                  callaCore: "rgba(220, 170, 210, 0.3)",
                  blueA: "rgba(220, 205, 255, 0.86)",
                  blueB: "rgba(185, 170, 235, 0.78)",
                  pinkA: "rgba(255, 232, 248, 0.78)",
                  shadow: "rgba(72,58,48,0.115)",
                  vaseA: "rgba(255, 255, 255, 0.92)",
                  vaseB: "rgba(224, 210, 236, 0.42)",
                }
              : f === "bouquet-spring-meadow"
                ? {
                    callaA: "rgba(255, 252, 246, 0.92)",
                    callaB: "rgba(242, 252, 230, 0.9)",
                    callaCore: "rgba(180, 220, 120, 0.26)",
                    blueA: "rgba(210, 238, 255, 0.76)",
                    blueB: "rgba(168, 222, 210, 0.72)",
                    pinkA: "rgba(255, 244, 220, 0.78)",
                    shadow: "rgba(72,58,48,0.11)",
                    vaseA: "rgba(255, 255, 255, 0.92)",
                    vaseB: "rgba(210, 232, 220, 0.42)",
                  }
                : {
                    callaA: "rgba(255,252,248,0.92)",
                    callaB: "rgba(255,252,248,0.9)",
                    callaCore: "rgba(245,230,190,0.45)",
                    blueA: "rgba(182, 205, 248, 0.88)",
                    blueB: "rgba(165, 195, 245, 0.86)",
                    pinkA: "rgba(255,236,245,0.9)",
                    shadow: "rgba(72,58,48,0.12)",
                    vaseA: "rgba(255, 255, 255, 0.92)",
                    vaseB: "rgba(220, 228, 238, 0.42)",
                  };

      const lc = bouquetLinePalette(f);
      const stemD =
        f === "bouquet-spring-meadow"
          ? "M56 46 Q 46 30 50 14 M 64 46 Q 78 32 72 16"
          : f === "bouquet-lavender-mist"
            ? "M58 46 Q 48 28 52 12 M 66 46 Q 82 30 74 14"
            : "M60 46 Q 52 28 56 14 M 68 46 Q 80 30 70 16";

      const blooms = (
        <>
          <path d={stemD} fill="none" stroke={lc.c} strokeWidth="1.05" strokeLinecap="round" opacity="0.62" />
          <path
            d="M42 34 C 46 18 58 14 68 24 S 82 38 92 26"
            fill="none"
            stroke={lc.a}
            strokeWidth="1.15"
            strokeLinecap="round"
          />
          <path
            d="M38 28 Q 52 8 66 20 T 88 18"
            fill="none"
            stroke={lc.b}
            strokeWidth="0.95"
            strokeLinecap="round"
            opacity="0.82"
          />
          <path
            d="M48 40 C 56 24 64 22 72 32 C 64 42 52 44 48 40"
            fill="none"
            stroke={lc.a}
            strokeWidth="0.88"
            strokeLinecap="round"
            opacity="0.72"
          />
          <path
            d="M52 20 C 60 12 72 16 78 28"
            fill="none"
            stroke={lc.c}
            strokeWidth="0.78"
            strokeLinecap="round"
            opacity="0.52"
          />
        </>
      );

      if (variant === "swatch") {
        return (
          <svg className={base} viewBox="0 0 120 48" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={`${b}-bqwash`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 252, 255, 0.9)" />
                <stop offset="100%" stopColor="rgba(240, 232, 248, 0.78)" />
              </linearGradient>
            </defs>
            <rect x="6" y="6" width="108" height="36" rx="14" fill={`url(#${b}-bqwash)`} opacity="0.94" />
            <g transform="translate(0 2) scale(0.92) translate(6 0)">{blooms}</g>
          </svg>
        );
      }

      if (variant === "pour") {
        return (
          <svg className={base} viewBox="0 0 120 54" preserveAspectRatio="xMidYMid meet" aria-hidden>
            <defs>
              <linearGradient id={`${b}-pourwash`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 253, 252, 0.28)" />
                <stop offset="100%" stopColor="rgba(236, 228, 242, 0.16)" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="120" height="54" fill={`url(#${b}-pourwash)`} />
            <g transform="translate(4 4)">{blooms}</g>
          </svg>
        );
      }

      // Exhibit: place the bouquet into an urn + add grounding shadow.
      return (
        <svg className={base} viewBox="0 0 120 54" preserveAspectRatio="xMidYMid meet" aria-hidden>
          <defs>
            <linearGradient id={`${b}-ceramic`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={palette.vaseA} />
              <stop offset="55%" stopColor={palette.vaseB} />
              <stop offset="100%" stopColor="rgba(210, 214, 222, 0.24)" />
            </linearGradient>
            <radialGradient id={`${b}-sheen`} cx="35%" cy="22%" r="65%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <radialGradient id={`${b}-bloom-a`} cx="35%" cy="32%" r="55%">
              <stop offset="0%" stopColor="rgba(255,248,252,0.95)" />
              <stop offset="45%" stopColor="rgba(245,220,232,0.88)" />
              <stop offset="100%" stopColor="rgba(220,185,205,0.45)" />
            </radialGradient>
            <radialGradient id={`${b}-bloom-b`} cx="50%" cy="35%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,250,0.98)" />
              <stop offset="42%" stopColor="rgba(252,238,225,0.9)" />
              <stop offset="100%" stopColor="rgba(235,205,175,0.35)" />
            </radialGradient>
            <filter id={`${b}-soft`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="b" />
              <feOffset dx="0" dy="1.8" in="b" result="o" />
              <feComponentTransfer in="o" result="a">
                <feFuncA type="linear" slope="0.35" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="a" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Ground contact shadow */}
          <ellipse cx="60" cy="49" rx="22" ry="4" fill={palette.shadow} />
          {/* Decorative ribbon spiral hint (silhouette only, not readable text) */}
          <path
            d="M8,38 Q24,22 42,28 T72,24 T102,30"
            fill="none"
            stroke="rgba(255,252,255,0.22)"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M10,40 Q28,26 48,32 T78,28 T108,34"
            fill="none"
            stroke="rgba(220,210,235,0.12)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {blooms}
          {/* White ceramic vase — like a small porcelain vessel */}
          <path
            d="M44,50 Q46,38 50,33 Q52,30 54,28 L66,28 Q68,30 70,33 Q74,38 76,50 Q60,52 44,50 Z"
            fill={`url(#${b}-ceramic)`}
            opacity="0.98"
          />
          <path
            d="M50,34 Q60,36 70,34"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="0.8"
            opacity="0.9"
            strokeLinecap="round"
          />
          <path
            d="M48,46 Q60,48 72,46"
            fill="none"
            stroke="rgba(170, 175, 190, 0.22)"
            strokeWidth="1.2"
            opacity="0.8"
            strokeLinecap="round"
          />
          <ellipse cx="60" cy="30" rx="16" ry="3.3" fill="rgba(255,252,248,0.26)" opacity="0.95" />
          <ellipse cx="56" cy="33" rx="11.5" ry="7.5" fill={`url(#${b}-sheen)`} opacity="0.5" />
        </svg>
      );
    }
    default:
      return null;
  }
}
