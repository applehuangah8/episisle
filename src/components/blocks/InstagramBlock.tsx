import type { BlockRenderProps } from "@/core/types";
import { DistrictBlockShell } from "@/components/blocks/DistrictBlockShell";

export function InstagramBlock(props: BlockRenderProps) {
  return (
    <DistrictBlockShell
      {...props}
      fallbackTitle="Downtown"
      tintClass="bg-[var(--epis-zone-instagram-tint)]"
    />
  );
}
