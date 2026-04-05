import type { BlockRenderProps } from "@/core/types";
import { DistrictBlockShell } from "@/components/blocks/DistrictBlockShell";

export function YoutubeBlock(props: BlockRenderProps) {
  return (
    <DistrictBlockShell
      {...props}
      fallbackTitle="YouTube"
      tintClass="bg-[var(--epis-zone-youtube-tint)]"
    />
  );
}
