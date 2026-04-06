import { useCallback, useId, useState } from "react";

import type { AuraIslandId } from "./auraWorldIslandTypes";
import {
  getAuraIslandPlateNameUpper,
  getAuraIslandSettledModeSuffix,
  getAuraIslandStatusAccentColor,
  getAuraIslandUiStatus,
} from "./auraIslandMetadata";
import { useAuraIslandHoverOverlay } from "./auraIslandHoverOverlayStore";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

/** Text-style sparkle (U+2747 + U+FE0E), tinted in UI. */
const PLATE_SPARKLE = "\u2747\uFE0E";

/** Lead paths in local SVG space (y downward); bottom y = island anchor, top toward label. */
const LEAD_GEOMETRY: Record<
  AuraIslandId,
  {
    d: string;
    w: number;
    h: number;
    labelPadY: number;
    /** Harbor: pure vertical + 0.5px often vanishes; use slightly wider stroke. */
    strokeWidth: number;
  }
> = {
  /* Slight jog so the stroke isn’t a degenerate 1D vertical for rasterization */
  harbor: {
    d: "M 40 118 L 40 62 L 40.85 62 L 40.85 6",
    w: 80,
    h: 124,
    labelPadY: 4,
    strokeWidth: 1,
  },
  anchor: {
    d: "M 40 118 L 40 52 L 64 52 L 64 6",
    w: 80,
    h: 124,
    labelPadY: 4,
    strokeWidth: 0.5,
  },
  citadel: {
    d: "M 40 118 L 40 72 L 14 72 L 14 38 L 40 38 L 40 6",
    w: 80,
    h: 124,
    labelPadY: 4,
    strokeWidth: 0.5,
  },
};

const SILVER_STROKE = "rgba(236, 238, 242, 0.92)";

/**
 * Museum-style screen annotations: horizontal serif plate, vertical lead variants per isle,
 * glass blur panel; hover strengthens opacity and adds a soft line glow.
 */
export function AuraIslandHoverScreenOverlay() {
  const isEnteredWorld = useAuraWorldSelection((s) => s.isEntered);
  /** Subscribe so plate copy refreshes when world names change. */
  useAuraWorldSelection((s) => s.worldMetaById);
  const anchor = useAuraIslandHoverOverlay((s) => s.anchor);
  const [hovered, setHovered] = useState(false);
  const uid = useId();
  const glowFilterId = `aura-ann-glow-${uid.replace(/:/g, "")}`;

  const hoverIslandId = anchor?.id;
  const onOverlayEnter = useCallback(() => {
    if (hoverIslandId == null) return;
    useAuraWorldSelection.getState().setHovered(hoverIslandId);
    setHovered(true);
  }, [hoverIslandId]);

  const onOverlayLeave = useCallback(() => {
    if (hoverIslandId != null) useAuraWorldSelection.getState().scheduleHoverClearFrom(hoverIslandId);
    setHovered(false);
  }, [hoverIslandId]);

  const geo = anchor ? LEAD_GEOMETRY[anchor.id] : null;
  const plateName = anchor ? getAuraIslandPlateNameUpper(anchor.id) : "";
  const status = anchor ? getAuraIslandUiStatus(anchor.id) : "floating";
  const statusLabel =
    status === "settled"
      ? `settled${anchor ? getAuraIslandSettledModeSuffix(anchor.id) : ""}`
      : "floating";
  const statusColor = anchor ? getAuraIslandStatusAccentColor(anchor.id) : "#153B78";

  if (isEnteredWorld || !anchor || !geo) return null;

  const { x: ax, y: ay } = anchor;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[75] overflow-visible"
      aria-hidden={false}
      data-aura-island-hover-overlay
    >
      <div
        className="pointer-events-auto absolute flex flex-col items-center"
        style={{
          left: ax,
          top: ay,
          transform: "translate(-50%, calc(-100% + 18px))",
          opacity: hovered ? 1 : 0.7,
          transition: "opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
          /* Widen hover target so small moves don’t drop the label. */
          padding: "22px 30px",
          margin: "-22px -30px",
        }}
        onMouseEnter={onOverlayEnter}
        onMouseLeave={onOverlayLeave}
        role="status"
      >
        <div
          style={{
            marginBottom: geo.labelPadY,
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transformOrigin: "50% 100%",
            transition: "transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div
            style={{
              padding: "11px 20px 12px",
              maxWidth: 320,
              background:
                "linear-gradient(165deg, rgba(255, 255, 255, 0.52) 0%, rgba(244, 248, 246, 0.46) 100%)",
              backdropFilter: "blur(14px) saturate(1.08)",
              WebkitBackdropFilter: "blur(14px) saturate(1.08)",
              border: "0.5px solid rgba(218, 226, 234, 0.32)",
              borderRadius: 3,
              boxShadow: hovered
                ? "0 1px 0 rgba(255, 255, 255, 0.22) inset, 0 0 0 1px rgba(220, 230, 240, 0.2), 0 0 22px rgba(210, 222, 232, 0.38), 0 0 48px rgba(198, 212, 224, 0.2), 0 10px 28px -12px rgba(15, 42, 32, 0.14)"
                : "0 1px 0 rgba(255, 255, 255, 0.18) inset, 0 0 0 1px rgba(220, 230, 240, 0.16), 0 0 18px rgba(210, 222, 232, 0.32), 0 0 40px rgba(200, 214, 226, 0.16), 0 8px 24px -14px rgba(15, 42, 32, 0.12)",
            }}
          >
            <div
              style={{
                fontFamily: '"Playfair Display", "Times New Roman", Times, serif',
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.45,
                color: "rgba(10, 14, 16, 0.96)",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  color: "#407E84",
                  marginRight: "0.28em",
                  letterSpacing: 0,
                  textShadow:
                    "0 0 10px rgba(64, 126, 132, 0.42), 0 0 22px rgba(64, 126, 132, 0.18), 0 1px 2px rgba(0, 0, 0, 0.08)",
                }}
              >
                {PLATE_SPARKLE}
              </span>
              <span style={{ letterSpacing: "0.2em" }}>{plateName}</span>
            </div>
            <div
              style={{
                marginTop: 7,
                fontFamily: '"Cormorant Garamond", "Times New Roman", Times, serif',
                fontSize: 11,
                fontWeight: 500,
                fontStyle: "italic",
                letterSpacing: "0.14em",
                textTransform: "none",
                color: statusColor,
                textAlign: "center",
                whiteSpace: "nowrap",
                textShadow: `0 0.5px 0 rgba(255, 255, 255, 0.55), 0 1px 3px rgba(0, 0, 0, 0.12), 0 0 10px ${statusColor}44`,
              }}
            >
              status: {statusLabel}
            </div>
          </div>
        </div>

        <svg
          width={geo.w}
          height={geo.h}
          viewBox={`0 0 ${geo.w} ${geo.h}`}
          style={{ display: "block", overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <filter
              id={glowFilterId}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation={hovered ? 1.35 : 0.01} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={geo.d}
            fill="none"
            stroke={SILVER_STROKE}
            strokeWidth={geo.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect={geo.strokeWidth <= 0.55 ? "non-scaling-stroke" : undefined}
            filter={hovered ? `url(#${glowFilterId})` : undefined}
            style={{
              transition: "filter 0.28s ease",
            }}
          />
        </svg>
      </div>
    </div>
  );
}
