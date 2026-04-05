import { IDENTITY_LEAF_BG_PALETTE } from "@/core/types";

const PRESET_SET = new Set<string>(IDENTITY_LEAF_BG_PALETTE);

/** 合法自訂色：#RRGGBB（大小寫皆可） */
export function isValidCustomHex(s: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(s.trim());
}

/** 預設五色之一或自訂 hex；無效則回第一個預設色 */
export function normalizeLeafAccent(c: string | undefined | null): string {
  const fallback = IDENTITY_LEAF_BG_PALETTE[0];
  if (c == null || c === "") return fallback;
  const t = c.trim();
  if (PRESET_SET.has(t)) return t;
  if (isValidCustomHex(t)) return t.toUpperCase();
  return fallback;
}

export function isPresetLeafAccent(c: string): boolean {
  return PRESET_SET.has(c);
}

export type Hsv = { h: number; s: number; v: number };

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9A-Fa-f]{6})$/.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (x: number) =>
    Math.max(0, Math.min(255, Math.round(x)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** RGB 0–255 → HSV（h 0–360，s、v 0–1） */
export function rgbToHsv(r: number, g: number, b: number): Hsv {
  const R = r / 255;
  const G = g / 255;
  const B = b / 255;
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d > 1e-6) {
    switch (max) {
      case R:
        h = ((G - B) / d + (G < B ? 6 : 0)) / 6;
        break;
      case G:
        h = ((B - R) / d + 2) / 6;
        break;
      default:
        h = ((R - G) / d + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s, v };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360;
  const S = clamp01(s);
  const V = clamp01(v);
  const c = V * S;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = V - c;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hh < 60) {
    rp = c;
    gp = x;
  } else if (hh < 120) {
    rp = x;
    gp = c;
  } else if (hh < 180) {
    gp = c;
    bp = x;
  } else if (hh < 240) {
    gp = x;
    bp = c;
  } else if (hh < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

export function hexToHsv(hex: string): Hsv | null {
  const rgb = hexToRgb(normalizeLeafAccent(hex));
  if (!rgb) return null;
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

export function hsvToHex(h: number, s: number, v: number): string {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

/** sRGB 相對亮度 0–1（WCAG），供標籤／按鈕上文字對比 */
export function relativeLuminanceFromHex(hex: string): number {
  const rgb = hexToRgb(normalizeLeafAccent(hex));
  if (!rgb) return 0.88;
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

/** 淺底用深字、深底用淺字（空白畫布分類標籤等） */
export function readableInkOnAccent(accentHex: string): { color: string; textShadow?: string } {
  const L = relativeLuminanceFromHex(accentHex);
  if (L < 0.45) {
    return { color: "#f4f6f8", textShadow: "0 1px 2px rgba(0,0,0,0.55)" };
  }
  return { color: "#3A3F47" };
}
