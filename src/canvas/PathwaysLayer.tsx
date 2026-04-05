import { memo, useId, useMemo } from "react";

import type { MuseeIndex } from "@/core/museeArchivePolicy";
import { placementToRect } from "@/core/transform";
import type { Placement, PlacementID } from "@/core/types";
import { useStore } from "@/store/useStore";

const MAX_LINK_DIST = 440;

type Segment = { x1: number; y1: number; x2: number; y2: number };

function computeSegments(placements: Record<PlacementID, Placement>, musee: MuseeIndex): Segment[] {
  const list = Object.values(placements).filter(
    (p) => !p.ui?.hidden && !(p.blockId in musee) && !p.parentContainerId
  );
  if (list.length < 2) return [];

  const centers = list.map((p) => {
    const r = placementToRect(p);
    return { cx: r.x + r.width / 2, cy: r.y + r.height / 2 };
  });

  const max2 = MAX_LINK_DIST * MAX_LINK_DIST;
  const out: Segment[] = [];
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      const dx = centers[i].cx - centers[j].cx;
      const dy = centers[i].cy - centers[j].cy;
      if (dx * dx + dy * dy <= max2) {
        out.push({
          x1: centers[i].cx,
          y1: centers[i].cy,
          x2: centers[j].cx,
          y2: centers[j].cy,
        });
      }
    }
  }
  return out;
}

/**
 * 靈感流向：鄰近積木中心以極細虛線＋微光連結。
 * 僅此層訂閱「位置簽名」，避免每塊積木因路徑重算而連動重繪。
 */
export const PathwaysLayer = memo(function PathwaysLayer() {
  const focusMode = useStore((s) => s.focusModeActive);

  const signature = useStore((s) => {
    const list = Object.values(s.placements).filter(
      (p) => !p.ui?.hidden && !(p.blockId in s.musee) && !p.parentContainerId
    );
    return list
      .map(
        (p) =>
          `${p.id}:${Math.round(p.position.x)}:${Math.round(p.position.y)}:${p.ui?.width ?? 280}:${p.ui?.height ?? 220}`
      )
      .sort()
      .join("|");
  });

  const filterId = useId().replace(/:/g, "");

  const segments = useMemo(() => {
    const s = useStore.getState();
    return computeSegments(s.placements, s.musee);
  }, [signature]);

  if (focusMode) return null;
  if (segments.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute left-0 top-0 z-[0] overflow-visible"
      width={4800}
      height={4800}
      viewBox="-400 -400 4800 4800"
      aria-hidden
    >
      <defs>
        <filter id={`epis-path-glow-${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {segments.map((seg, i) => (
        <line
          key={`${seg.x1}-${seg.y1}-${seg.x2}-${seg.y2}-${i}`}
          x1={seg.x1}
          y1={seg.y1}
          x2={seg.x2}
          y2={seg.y2}
          fill="none"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth={0.65}
          strokeDasharray="2 6"
          strokeLinecap="round"
          filter={`url(#epis-path-glow-${filterId})`}
          opacity={0.85}
        />
      ))}
    </svg>
  );
});
