/** 圖鑑預覽遮罩：花瓣＝原預設；原圖框＝與新增預覽相同的圓角矩形。 */
export const CODEX_IMAGE_MASKS = ["petal", "frame", "circle", "arch", "gem"] as const;
export type CodexImageMask = (typeof CODEX_IMAGE_MASKS)[number];

export function isCodexImageMask(v: string): v is CodexImageMask {
  return (CODEX_IMAGE_MASKS as readonly string[]).includes(v);
}

export type CodexEntry = {
  id: string;
  worldId: string;
  title: string;
  description: string;
  /** 使用者自填分類／標籤 */
  category?: string;
  image?: string;
  imageMask?: CodexImageMask;
  createdAt: number;
};
