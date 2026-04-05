import type { BlockRenderProps } from "@/core/types";
import { DistrictBlockShell } from "@/components/blocks/DistrictBlockShell";

export function MuseeBlock(props: BlockRenderProps) {
  return (
    <DistrictBlockShell
      {...props}
      fallbackTitle="展間"
      tintClass="bg-[var(--epis-zone-musee-tint)]"
    />
  );
}
