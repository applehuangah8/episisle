import type { Block, Placement } from "@/core/types";

/** 身分方塊固定實體 id，不可刪除／封存／入館 */
export const IDENTITY_BLOCK_ID = "epis-identity-block";

export const IDENTITY_PLACEMENT_ID = "epis-identity-placement";

export function isIdentityBlockId(blockId: string): boolean {
  return blockId === IDENTITY_BLOCK_ID;
}

export function isIdentityPlacementId(placementId: string): boolean {
  return placementId === IDENTITY_PLACEMENT_ID;
}

const now = () => Date.now();

export function createIdentityBlock(): Block {
  const t = now();
  return {
    id: IDENTITY_BLOCK_ID,
    lifecycle: "developing",
    modules: [{ type: "content", content: "" }],
    createdAt: t,
    updatedAt: t,
  };
}

export function createIdentityPlacement(): Placement {
  return {
    id: IDENTITY_PLACEMENT_ID,
    blockId: IDENTITY_BLOCK_ID,
    district: "neutral",
    position: { x: 20, y: 88 },
    ui: { width: 300, height: 168, variant: "refined" },
  };
}
