import type { BlockRenderProps } from "@/core/types";
import { WildFlipCard } from "@/components/blocks/WildFlipCard";

export function WildBlock(props: BlockRenderProps) {
  return <WildFlipCard model={props.model} />;
}
