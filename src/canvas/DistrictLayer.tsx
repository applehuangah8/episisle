import type { CSSProperties } from "react";
import { useMemo } from "react";

import { getStudioZone, getTownVisualRect, getWildZone } from "@/canvas/districtLayout";
import { useAreaDetection } from "@/canvas/useAreaDetection";
import { WildGrassMark } from "@/components/WildGrassMark";
import { useStore } from "@/store/useStore";

const HEADER_H = 24;

function zoneBox(rect: { x: number; y: number; width: number; height: number }): CSSProperties {
  return {
    position: "absolute",
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

const headerShell: CSSProperties = {
  height: HEADER_H,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  paddingLeft: 12,
  paddingRight: 12,
  background: "transparent",
  borderBottomWidth: 0.5,
  borderBottomStyle: "solid",
  borderBottomColor: "rgba(90, 96, 102, 0.22)",
  backdropFilter: "blur(10px) saturate(1.05)",
  WebkitBackdropFilter: "blur(10px) saturate(1.05)",
};

const headerText: CSSProperties = {
  fontFamily: "var(--epis-font-district)",
  fontWeight: 500,
  fontStyle: "italic",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(90, 96, 102, 0.48)",
  pointerEvents: "none",
  whiteSpace: "nowrap",
  fontSize: 11,
  lineHeight: 1,
};

/**
 * 地景層：與積木同在世界容器內。IG 規劃格已移至右欄，此處仍顯示 Downtown／Wild 等世界區域框線。
 */
export function DistrictLayer() {
  const { zones } = useAreaDetection();
  const downtownMode = useStore((s) => s.aestheticsHubMode);
  const viewMode = useStore((s) => s.viewMode);

  const focusMode = useStore((s) => s.focusModeActive);

  const { wild, town, studio } = useMemo(() => {
    const w = getWildZone(zones);
    const townRect = getTownVisualRect(zones);
    const st = getStudioZone(zones);
    return { wild: w, town: townRect, studio: st };
  }, [zones]);

  if (viewMode !== "main" || focusMode) {
    return null;
  }

  const blankLike = downtownMode === "blank";

  const edgeInner = `
    inset 0 1px 0 rgba(255,255,255,0.22),
    inset 0 -2px 10px rgba(0,0,0,0.04)
  `;

  return (
    <div className="pointer-events-none absolute left-0 top-0 z-0" aria-hidden>
      {/* The Wild：無框線／陰影，視覺上向四方延伸 */}
      <div
        className="pointer-events-none flex flex-col overflow-visible"
        style={{
          ...zoneBox(wild),
          background: "transparent",
          boxShadow: "none",
          border: "none",
        }}
      >
        <div
          style={{
            height: HEADER_H,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            paddingLeft: 12,
            paddingRight: 12,
            background: "transparent",
          }}
        >
          <span className="max-w-[min(200px,40vw)] truncate" style={headerText}>
            The Wild
          </span>
        </div>
        <div className="pl-3 pr-2 pt-0.5">
          <WildGrassMark />
        </div>
      </div>

      {/* Downtown */}
      <div
        className={`flex flex-col overflow-hidden rounded-[3px] border border-[var(--color-stroke)]/20 ${
          blankLike ? "bg-transparent" : "bg-[rgba(255,255,255,0.14)]"
        }`}
        style={{
          ...zoneBox(town),
          boxShadow: `
            0 12px 32px -10px rgba(0,0,0,0.07),
            inset 0 1px 0 rgba(255,255,255,0.4),
            inset 0 3px 0 rgba(255,255,255,0.12),
            ${edgeInner}
          `,
        }}
      >
        <div style={{ ...headerShell, justifyContent: "flex-end" }}>
          <span className="max-w-[220px] truncate text-right" style={headerText}>
            Downtown
          </span>
        </div>
      </div>

      {/* Studio：規劃行程／推進計畫（地景區）；靈感博物館為 HUD 畫廊 */}
      <div
        className="flex flex-col overflow-hidden rounded-[2px] border border-[var(--color-stroke)]/30"
        style={{
          ...zoneBox(studio),
          background: blankLike
            ? "rgba(232,238,244,0.12)"
            : "linear-gradient(145deg, rgba(232,238,244,0.48) 0%, rgba(198,214,228,0.28) 42%, rgba(210,204,228,0.22) 100%)",
          backdropFilter: blankLike ? "none" : "blur(12px) saturate(1.04)",
          WebkitBackdropFilter: blankLike ? "none" : "blur(12px) saturate(1.04)",
          boxShadow: `
            inset 0 3px 12px rgba(0,0,0,0.035),
            inset 0 1px 0 rgba(255,255,255,0.4),
            ${edgeInner}
          `,
        }}
      >
        <div style={headerShell}>
          <span className="max-w-[200px] truncate" style={headerText}>
            Studio
          </span>
        </div>
      </div>
    </div>
  );
}
