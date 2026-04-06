import type { CSSProperties } from "react";

import type { CodexImageMask } from "./codexTypes";

const matteShadow =
  "inset 0 0 48px rgba(255,252,248,0.28), inset 0 0 120px rgba(142,180,196,0.08), 0 16px 48px -18px rgba(48,62,56,0.18)";

export type CodexImageMaskShellOptions = {
  /** Fills fixed-aspect tiles (grid / modal) without browse min-heights. */
  compact?: boolean;
};

/** Outer box for image / placeholder — matches browse, grid, and modal when `compact`. */
export function codexImageMaskShell(
  mask: CodexImageMask | undefined,
  options?: CodexImageMaskShellOptions,
): {
  className: string;
  style: CSSProperties;
  wrapClass?: string;
} {
  const c = options?.compact === true;
  const m = mask ?? "petal";
  switch (m) {
    case "petal":
      return {
        className: c
          ? "relative h-full min-h-0 w-full flex-1 overflow-hidden p-0.5"
          : "relative h-full min-h-[280px] w-full flex-1 overflow-hidden p-1 md:min-h-0",
        style: {
          borderRadius: "28% 72% 68% 32% / 38% 40% 60% 62%",
          boxShadow: matteShadow,
        },
      };
    case "frame":
      return {
        className: c
          ? "relative h-full min-h-0 w-full flex-1 overflow-hidden"
          : "relative h-full min-h-[280px] w-full flex-1 overflow-hidden md:min-h-0",
        style: {
          borderRadius: 24,
          boxShadow: matteShadow,
        },
      };
    case "circle":
      return {
        className: c
          ? "relative mx-auto aspect-square h-full max-h-full min-h-0 w-full max-w-full flex-shrink-0 overflow-hidden"
          : "relative mx-auto aspect-square h-auto min-h-[220px] w-full max-h-[min(52vh,520px)] max-w-[min(100%,min(52vh,520px))] flex-shrink-0 overflow-hidden md:min-h-[280px]",
        style: {
          borderRadius: "50%",
          boxShadow: matteShadow,
        },
      };
    case "arch":
      return {
        className: c
          ? "relative h-full min-h-0 w-full flex-1 overflow-hidden"
          : "relative h-full min-h-[280px] w-full flex-1 overflow-hidden md:min-h-0",
        style: {
          borderRadius: "48% 48% 18px 18px / 40% 40% 14px 14px",
          boxShadow: matteShadow,
        },
      };
    case "gem":
      return {
        wrapClass: c
          ? "flex h-full min-h-0 w-full flex-1 items-stretch justify-center [filter:drop-shadow(0_14px_28px_rgba(48,62,56,0.14))]"
          : "flex h-full min-h-[280px] w-full flex-1 items-stretch justify-center [filter:drop-shadow(0_14px_28px_rgba(48,62,56,0.14))] md:min-h-0",
        className: c
          ? "relative h-full min-h-0 w-full max-w-full flex-1 overflow-hidden"
          : "relative h-full min-h-[280px] w-full max-w-full flex-1 overflow-hidden md:min-h-0",
        style: {
          clipPath: "polygon(50% 0%, 100% 36%, 82% 100%, 18% 100%, 0% 36%)",
        },
      };
    default:
      return codexImageMaskShell("petal", options);
  }
}

export const CODEX_MASK_OPTIONS: { id: CodexImageMask; label: string }[] = [
  { id: "petal", label: "花瓣" },
  { id: "frame", label: "原圖框" },
  { id: "circle", label: "圓鏡" },
  { id: "arch", label: "拱門" },
  { id: "gem", label: "晶形" },
];

export function codexMaskThumbnailStyle(id: CodexImageMask): CSSProperties {
  switch (id) {
    case "petal":
      return { borderRadius: "36% 64% 62% 38% / 42% 38% 62% 58%" };
    case "frame":
      return { borderRadius: 6 };
    case "circle":
      return { borderRadius: "50%" };
    case "arch":
      return { borderRadius: "46% 46% 5px 5px / 36% 36% 5px 5px" };
    case "gem":
      return { clipPath: "polygon(50% 4%, 92% 38%, 76% 92%, 24% 92%, 8% 38%)" };
    default:
      return {};
  }
}
