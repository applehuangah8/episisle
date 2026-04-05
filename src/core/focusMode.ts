import type { Block, BlockLifecycle, DistrictType, Placement } from "@/core/types";

export type FocusRealm = "wild" | "town" | "studio";

export type FocusLifecyclePreset = "all" | BlockLifecycle;

export function placementMatchesFocusRealm(district: DistrictType, realm: FocusRealm): boolean {
  if (realm === "wild") return district === "wild";
  if (realm === "town") return district === "instagram" || district === "youtube";
  if (realm === "studio") return district === "studio";
  return false;
}

export function blockMatchesFocusLifecycle(block: Block, filter: FocusLifecyclePreset): boolean {
  if (filter === "all") return true;
  return block.lifecycle === filter;
}

export function shouldShowPlacementInFocusMode(
  p: Placement,
  block: Block,
  opts: { realm: FocusRealm; lifecycle: FocusLifecyclePreset }
): boolean {
  if (p.parentContainerId) return false;
  if (!placementMatchesFocusRealm(p.district, opts.realm)) return false;
  return blockMatchesFocusLifecycle(block, opts.lifecycle);
}
