import type { ComponentType } from "react";

// —— 識別碼 ——
export type BlockID = string;
export type PlacementID = string;

/** 葉片可選底色（邊框／文字統一為 #3A3F47） */
export const IDENTITY_LEAF_BG_PALETTE = [
  "#DBCAC9",
  "#BFD0CB",
  "#D7BFA9",
  "#BCC3CF",
  "#CCBFD1",
] as const;

/** 預設五色之一（{@link IDENTITY_LEAF_BG_PALETTE}）或自訂 `#RRGGBB` */
export type IdentityLeafBgColor = string;

/** User Isle 卡片內可新增的葉片備忘（座標相對於葉片區左上角） */
export interface IdentityLeaf {
  id: string;
  text: string;
  imageUrl: string | null;
  /** 圖片縮放（1 = 填滿裁切區基準） */
  imageScale: number;
  /** 圖片平移（px，與 scale 搭配） */
  imagePanX: number;
  imagePanY: number;
  /** 葉片底色（選單其一） */
  accentBg: IdentityLeafBgColor;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 空白畫布分類標籤：預設外形（貼紙感，約十字以內單行為主） */
export const BLANK_RING_LABEL_SHAPES = ["pill", "round", "tag", "banner", "ticket"] as const;
export type BlankRingLabelShape = (typeof BLANK_RING_LABEL_SHAPES)[number];

/** 空白畫布上的分類標籤（畫布世界座標內可拖移；字體偏大、像貼標） */
export interface BlankStoryRing {
  id: string;
  text: string;
  /** 畫布世界座標：標籤主體（文字區）左緣 px */
  positionX: number;
  /** 畫布世界座標：標籤主體上緣 px（舊存檔無此欄時載入會補預設） */
  positionY?: number;
  /** 底色：五選一，預設 {@link IDENTITY_LEAF_BG_PALETTE}[0] */
  accentBg?: IdentityLeafBgColor;
  /** 標籤外形預設之一，預設 pill */
  labelShape?: BlankRingLabelShape;
  /** @deprecated 已改為 labelShape，載入時忽略 */
  ringScale?: number;
}

// —— 區域／畫布 district（驅動 blockRegistry 與 Placement）——
export type DistrictType = "wild" | "instagram" | "youtube" | "studio" | "neutral";

/** 區域檢測：落在任一 district 矩形內，否則 neutral */
export type DistrictZoneHint = DistrictType | "neutral";

export type BlockLifecycle = "idea" | "developing" | "planned" | "archived";

// —— 領域實體（與畫布位置解耦）——
export interface Block {
  id: BlockID;
  lifecycle: BlockLifecycle;
  modules: BlockModule[];
  createdAt: number;
  updatedAt: number;
}

/**
 * 內建模組 + 可擴充分支（`unknown` 取代 `any`）。
 * 渲染時請用 blockView 的型別守衛窄化，避免 `type: string` 聯集干擾 switch。
 */
export type BlockModule =
  | { type: "content"; content: string }
  | { type: "task"; status: "todo" | "doing" | "done" }
  /** 自由文字「下一步／接下來」欄（原行程時刻已廢止，舊資料於載入時遷移） */
  | { type: "next"; text: string }
  /** @deprecated 載入時轉成 `next` */
  | { type: "schedule"; start?: number }
  | { type: string; data: unknown };

export interface Placement {
  id: PlacementID;
  blockId: BlockID;
  district: DistrictType;
  position: { x: number; y: number };
  /** 若設為 Downtown 容器 id，此積木由面板網格渲染，不佔主畫布 */
  parentContainerId?: string;
  /** 在 `parentContainerId` 網格內的 0-based 索引（由左到右、由上而下） */
  gridIndex?: number;
  ui?: {
    width?: number;
    height?: number;
    variant?: "raw" | "refined";
    hidden?: boolean;
    /** Town／Wild 翻面卡立面底部短文（未存檔時由元件帶入預設測試句） */
    frontBlurb?: string;
  };
}

/** `archive`：典籍按鈕封存；`musee`：拖入畫布上 🏛️ Portal */
export type MuseeChannel = "archive" | "musee";

export interface MuseeEntry {
  blockId: BlockID;
  archivedAt: number;
  /** 未帶入時視為 `archive`（舊資料相容） */
  channel?: MuseeChannel;
}

// —— 畫布幾何 ——
export interface WorldRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DistrictZoneDefinition extends WorldRect {
  id: DistrictType;
  label: string;
}

/**
 * 轉譯後給 React district 組件：Placement + Block + 幾何與區域提示。
 */
export interface RenderBlock {
  placement: Placement;
  block: Block;
  rect: WorldRect;
  districtHint?: DistrictZoneHint;
}

export interface BlockRenderProps {
  model: RenderBlock;
}

export type BlockComponent = ComponentType<BlockRenderProps>;
