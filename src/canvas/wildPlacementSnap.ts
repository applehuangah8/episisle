import { getStudioZone, getTownVisualRect, getWildZone } from "@/canvas/districtLayout";
import { rectsOverlapWorld } from "@/canvas/worldDistrictHitTest";
import { placementToRect } from "@/core/transform";
import type { DistrictZoneDefinition, Placement, PlacementID } from "@/core/types";

function pointInWorldRect(wx: number, wy: number, r: { x: number; y: number; width: number; height: number }) {
  return wx >= r.x && wx <= r.x + r.width && wy >= r.y && wy <= r.y + r.height;
}

/**
 * 離開專注「原野」後：將仍標為 wild、且與城鎮／Studio 重疊或中心不在 Wild 矩形內的積木，收進 Wild 區邊界內。
 */
export function snapWildPlacementsAfterFocusWild(
  placements: Record<PlacementID, Placement>,
  zones: DistrictZoneDefinition[]
): Record<PlacementID, Placement> | null {
  const wild = getWildZone(zones);
  const town = getTownVisualRect(zones);
  const studio = getStudioZone(zones);
  let changed = false;
  const next: Record<PlacementID, Placement> = { ...placements };

  for (const id of Object.keys(placements)) {
    const p = placements[id];
    if (!p || p.parentContainerId) continue;
    if (p.district !== "wild") continue;
    const r = placementToRect(p);
    const cx = r.x + r.width / 2;
    const cy = r.y + r.height / 2;
    const overlapsTown = rectsOverlapWorld(r, town);
    const overlapsStudio = rectsOverlapWorld(r, studio);
    const centerInWild = pointInWorldRect(cx, cy, wild);
    if (!overlapsTown && !overlapsStudio && centerInWild) continue;

    const nx = Math.min(
      wild.x + wild.width - r.width,
      Math.max(wild.x, p.position.x)
    );
    const ny = Math.min(
      wild.y + wild.height - r.height,
      Math.max(wild.y, p.position.y)
    );
    if (nx !== p.position.x || ny !== p.position.y) {
      next[id] = { ...p, position: { x: nx, y: ny } };
      changed = true;
    }
  }
  return changed ? next : null;
}
