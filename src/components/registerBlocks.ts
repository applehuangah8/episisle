import { InstagramBlock } from "@/components/blocks/InstagramBlock";
import { MuseeBlock } from "@/components/blocks/MuseeBlock";
import { WildBlock } from "@/components/blocks/WildBlock";
import { YoutubeBlock } from "@/components/blocks/YoutubeBlock";
import { registerDistrict } from "@/core/blockRegistry";

let registered = false;

export function ensureBlocksRegistered(): void {
  if (registered) return;
  registerDistrict("wild", WildBlock);
  registerDistrict("instagram", InstagramBlock);
  registerDistrict("youtube", YoutubeBlock);
  registerDistrict("studio", MuseeBlock);
  registered = true;
}
