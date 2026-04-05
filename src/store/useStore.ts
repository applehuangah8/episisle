import { nanoid } from "nanoid";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  computeViewportToFitFocusSubset,
  computeViewportToFitPlacements,
} from "@/canvas/focusViewport";
import {
  DEFAULT_BLOCK_PLACEMENT_HEIGHT,
  DEFAULT_BLOCK_PLACEMENT_WIDTH,
  PLACEMENT_HEIGHT_MAX,
  PLACEMENT_HEIGHT_MIN,
  PLACEMENT_WIDTH_MAX,
  PLACEMENT_WIDTH_MIN,
} from "@/canvas/viewportMath";
import type { MuseeIndex } from "@/core/museeArchivePolicy";
import { normalizeMuseeEntry } from "@/core/museeArchivePolicy";
import {
  DEFAULT_DISTRICT_ZONES,
  getCanvasWorldBackgroundRect,
  getWildZone,
} from "@/canvas/districtLayout";
import { snapWildPlacementsAfterFocusWild } from "@/canvas/wildPlacementSnap";
import { detectDistrictForRectCenterWorld } from "@/canvas/worldDistrictHitTest";
import { DOWNTOWN_BLANK_WORLD_H, DOWNTOWN_BLANK_WORLD_W } from "@/core/downtownBlankBounds";
import { normalizeLeafAccent } from "@/core/accentColor";
import {
  DOWNTOWN_BLANK_CONTAINER_ID,
  DOWNTOWN_IG_CONTAINER_ID,
  DOWNTOWN_PLAN_FRAME_DEFAULT_WIDTH_PX,
  DOWNTOWN_PLAN_FRAME_MAX_WIDTH_PX,
  DOWNTOWN_PLAN_FRAME_MIN_WIDTH_PX,
  DOWNTOWN_SLOT_PX,
  DOWNTOWN_YT_CONTAINER_ID,
} from "@/core/downtown";
import type { FocusLifecyclePreset, FocusRealm } from "@/core/focusMode";
import {
  createIdentityBlock,
  createIdentityPlacement,
  IDENTITY_BLOCK_ID,
  IDENTITY_PLACEMENT_ID,
  isIdentityBlockId,
  isIdentityPlacementId,
} from "@/core/identityBlock";
import { normalizeBlockModules, placementToRect, transformBlockForDistrict } from "@/core/transform";
import {
  BLANK_RING_LABEL_SHAPES,
  IDENTITY_LEAF_BG_PALETTE,
  type BlankRingLabelShape,
  type BlankStoryRing,
  type Block,
  type BlockID,
  type DistrictType,
  type DistrictZoneDefinition,
  type IdentityLeaf,
  type IdentityLeafBgColor,
  type MuseeEntry,
  type Placement,
  type PlacementID,
} from "@/core/types";
import { SEED_BLOCKS, SEED_PLACEMENTS } from "@/store/seedWorld";

export type AppViewMode = "main" | "archive" | "musee";

/** 規劃格／空白畫布拖向主畫布時，螢幕層浮層（不寫入 persist） */
export type PlanningDragVisual = {
  placementId: PlacementID;
  clientX: number;
  clientY: number;
  width: number;
  height: number;
  kind: "slot-ig" | "slot-yt" | "blank";
};

export type AestheticsHubMode = "instagram" | "youtube" | "blank";

export type DowntownPlanFrameChannel = "instagram" | "youtube";

export type DowntownPlanFrameRect = {
  x: number;
  y: number;
  width: number;
};

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 2.5;

const DOWNTOWN_BLANK_SCALE_MIN = 0.35;
const DOWNTOWN_BLANK_SCALE_MAX = 2.35;

/** IG／YouTube Downtown 工作區內容縮放（與平移搭配，需能縮小看滿版 grid） */
const DOWNTOWN_CONTENT_SCALE_MIN = 0.18;
const DOWNTOWN_CONTENT_SCALE_MAX = 3.8;

export function clampDowntownContentScale(n: number): number {
  return Math.min(DOWNTOWN_CONTENT_SCALE_MAX, Math.max(DOWNTOWN_CONTENT_SCALE_MIN, n));
}

const IDENTITY_LEAF_W_MIN = 52;
const IDENTITY_LEAF_W_MAX = 200;
const IDENTITY_LEAF_H_MIN = 40;
const IDENTITY_LEAF_H_MAX = 140;
const IDENTITY_LEAF_MAX = 16;
/** 葉片可拖移的邏輯範圍（與身分卡內葉片區約略對齊） */
const IDENTITY_LEAF_GARDEN_W = 300;
const IDENTITY_LEAF_GARDEN_H = 240;

const IDENTITY_LEAF_IMAGE_SCALE_MIN = 0.45;
const IDENTITY_LEAF_IMAGE_SCALE_MAX = 2.8;

function createDefaultBlankStoryRings(): BlankStoryRing[] {
  return [];
}

const BLANK_LABEL_TEXT_MAX = 14;

function normalizeBlankRingLabelShape(v: unknown): BlankRingLabelShape {
  return typeof v === "string" && (BLANK_RING_LABEL_SHAPES as readonly string[]).includes(v)
    ? (v as BlankRingLabelShape)
    : "pill";
}

function clampIdentityLeaf(prev: IdentityLeaf, patch: Partial<IdentityLeaf>): IdentityLeaf {
  const w = Math.round(
    Math.min(
      IDENTITY_LEAF_W_MAX,
      Math.max(IDENTITY_LEAF_W_MIN, patch.width ?? prev.width)
    )
  );
  const h = Math.round(
    Math.min(
      IDENTITY_LEAF_H_MAX,
      Math.max(IDENTITY_LEAF_H_MIN, patch.height ?? prev.height)
    )
  );
  const x = Math.round(
    Math.min(IDENTITY_LEAF_GARDEN_W - w, Math.max(0, patch.x ?? prev.x))
  );
  const y = Math.round(
    Math.min(IDENTITY_LEAF_GARDEN_H - h, Math.max(0, patch.y ?? prev.y))
  );
  const imageScale = Math.min(
    IDENTITY_LEAF_IMAGE_SCALE_MAX,
    Math.max(IDENTITY_LEAF_IMAGE_SCALE_MIN, patch.imageScale ?? prev.imageScale ?? 1)
  );
  const imagePanX = Number.isFinite(patch.imagePanX ?? prev.imagePanX)
    ? (patch.imagePanX ?? prev.imagePanX ?? 0)
    : 0;
  const imagePanY = Number.isFinite(patch.imagePanY ?? prev.imagePanY)
    ? (patch.imagePanY ?? prev.imagePanY ?? 0)
    : 0;
  const accentBg: IdentityLeafBgColor = normalizeLeafAccent(
    patch.accentBg ?? prev.accentBg ?? IDENTITY_LEAF_BG_PALETTE[0]
  );
  return {
    ...prev,
    ...patch,
    x,
    y,
    width: w,
    height: h,
    imageScale,
    imagePanX,
    imagePanY,
    accentBg,
    text: patch.text !== undefined ? patch.text.slice(0, 400) : prev.text,
    imageUrl: patch.imageUrl !== undefined ? patch.imageUrl : prev.imageUrl,
  };
}

function duplicateBlockEntity(b: Block, newId: string): Block {
  const now = Date.now();
  try {
    const c = structuredClone(b) as Block;
    return normalizeBlockModules({ ...c, id: newId, createdAt: now, updatedAt: now });
  } catch {
    return normalizeBlockModules({
      ...b,
      id: newId,
      createdAt: now,
      updatedAt: now,
      modules: JSON.parse(JSON.stringify(b.modules)) as Block["modules"],
    });
  }
}

function asBlockRecord(input: Block[] | Record<BlockID, Block>): Record<BlockID, Block> {
  const raw = Array.isArray(input) ? Object.fromEntries(input.map((b) => [b.id, b])) : input;
  return Object.fromEntries(
    Object.entries(raw).map(([id, b]) => [id, normalizeBlockModules(b)])
  );
}

function asPlacementRecord(
  input: Placement[] | Record<PlacementID, Placement>
): Record<PlacementID, Placement> {
  return Array.isArray(input) ? Object.fromEntries(input.map((p) => [p.id, p])) : input;
}

/** 舊存檔 `district: musee` → 下方規劃區改為 `studio`（靈感博物館為畫廊，非此 id） */
function normalizePlacementDistricts(
  placements: Record<PlacementID, Placement>
): Record<PlacementID, Placement> {
  return Object.fromEntries(
    Object.entries(placements).map(([id, p]) => {
      const d = p.district as string;
      if (d === "musee") return [id, { ...p, district: "studio" as Placement["district"] }] as const;
      return [id, p] as const;
    })
  );
}

function mergeIdentityIntoState(
  blocks: Record<BlockID, Block>,
  placements: Record<PlacementID, Placement>
): { blocks: Record<BlockID, Block>; placements: Record<PlacementID, Placement> } {
  const b = { ...blocks };
  const p = { ...placements };
  if (!b[IDENTITY_BLOCK_ID]) b[IDENTITY_BLOCK_ID] = createIdentityBlock();
  if (!p[IDENTITY_PLACEMENT_ID]) p[IDENTITY_PLACEMENT_ID] = createIdentityPlacement();
  else {
    const ip = p[IDENTITY_PLACEMENT_ID]!;
    if (ip.district !== "neutral") {
      p[IDENTITY_PLACEMENT_ID] = { ...ip, district: "neutral" };
    }
  }
  return { blocks: b, placements: p };
}

export interface SetWorldPayload {
  blocks: Block[] | Record<BlockID, Block>;
  placements: Placement[] | Record<PlacementID, Placement>;
  /** 未傳入則保留現有 `musee` */
  musee?: MuseeIndex;
}

export interface EpisState {
  viewport: Viewport;
  blocks: Record<BlockID, Block>;
  placements: Record<PlacementID, Placement>;
  musee: MuseeIndex;
  selectedPlacementId: PlacementID | null;
  /** 主畫布／封存倉／博物館長廊 */
  viewMode: AppViewMode;
  /** 專注模式：全幅畫布、依區域與 lifecycle 篩選積木；結束時還原進入前視角 */
  focusModeActive: boolean;
  focusRealm: FocusRealm;
  focusLifecycle: FocusLifecyclePreset;
  viewportBeforeFocus: Viewport | null;
  /** 內容編輯中時鎖定該 placement 的拖拽 */
  editingPlacementId: PlacementID | null;
  /** 主畫面下方「美學館」預覽網格：IG / YouTube 版型 */
  aestheticsHubMode: AestheticsHubMode;
  /** New Block 後自動聚焦第一個內容模組（一次） */
  pendingContentFocusPlacementId: PlacementID | null;
  /** Downtown IG 網格總格數（3 欄；擴充時每次 +3） */
  downtownIgSlotCount: number;
  /** 主畫布積木拖經 Downtown slot 時的引導高亮 */
  downtownHighlightedSlotIndex: number | null;
  /** Blank 模式：自訂畫布背景圖（data URL 或 http） */
  blankCanvasBgUrl: string | null;
  blankCanvasBgOpacity: number;
  /** 1 = 原圖；低於 1 偏暗、高於 1 偏亮 */
  blankCanvasBgBrightness: number;
  /** 主欄右側 Downtown 欄寬占比（約 22–88，相對主列寬） */
  downtownPanelWidthPercent: number;
  /** Downtown 內容縮放（面板內等比） */
  downtownContentScale: number;
  downtownPanelCollapsed: boolean;
  /** Downtown 空白模式迷你畫布平移（螢幕座標系，與縮放錨點一致） */
  canvasPosition: { x: number; y: number };
  /** 空白迷你畫布內容縮放（與主欄 IG 的 downtownContentScale 分開） */
  downtownBlankScale: number;
  /** 與地景 DistrictLayer 一致的世界座標區域（矩形） */
  worldDistrictZones: DistrictZoneDefinition[];
  setWorldDistrictZones: (zones: DistrictZoneDefinition[]) => void;
  /** 身分方塊標題（與 IdentityBlock 同步） */
  projectTitle: string;
  setProjectTitle: (title: string) => void;
  /** 身分方塊簡介／社群總覽文案 */
  identityBio: string;
  setIdentityBio: (text: string) => void;
  /** 身分方塊裝飾貼圖（data URL 或 http） */
  identityStickerUrl: string | null;
  setIdentityStickerUrl: (url: string | null) => void;
  identityLeaves: IdentityLeaf[];
  selectedIdentityLeafId: string | null;
  setSelectedIdentityLeafId: (id: string | null) => void;
  addIdentityLeaf: () => void;
  updateIdentityLeaf: (leafId: string, patch: Partial<Omit<IdentityLeaf, "id">>) => void;
  removeIdentityLeaf: (leafId: string) => void;
  /** 僅顯示 User Isle 左側欄（收合主體） */
  identityCardCollapsed: boolean;
  setIdentityCardCollapsed: (collapsed: boolean) => void;
  /** 空白規劃格上方文字圈圈 */
  blankStoryRings: BlankStoryRing[];
  updateBlankStoryRing: (
    id: string,
    patch: Partial<Pick<BlankStoryRing, "text" | "positionX" | "positionY" | "accentBg" | "labelShape">>
  ) => void;
  removeBlankStoryRing: (id: string) => void;
  /** worldBodyPos：標籤「文字區」左上角之空白畫布世界座標；省略時用網格預設 */
  addBlankStoryRing: (
    labelShape?: BlankRingLabelShape,
    worldBodyPos?: { x: number; y: number }
  ) => void;
  /** IG／YT 規劃格上方限動圈圈自訂圖（各 5 個；data URL） */
  plannerStoryRingUrls: { instagram: (string | null)[]; youtube: (string | null)[] };
  setPlannerStoryRingUrl: (
    channel: "instagram" | "youtube",
    index: number,
    url: string | null
  ) => void;
  /** Downtown 工作區平移（像素，與 downtownContentScale 搭配） */
  downtownWorkspacePan: { x: number; y: number };
  panDowntownWorkspaceBy: (dx: number, dy: number) => void;
  resetDowntownWorkspacePan: () => void;
  /** 相對 Downtown 工作區左上角之局部座標 (lx,ly) 為縮放錨點，更新 scale 與 pan */
  zoomDowntownWorkspaceAt: (localX: number, localY: number, nextScale: number) => void;
  /** IG／YT 規劃格面板在工作區內的位置與寬度（高度由內容決定） */
  downtownPlanFrames: Record<DowntownPlanFrameChannel, DowntownPlanFrameRect>;
  panDowntownPlanFrameBy: (channel: DowntownPlanFrameChannel, dx: number, dy: number) => void;
  resizeDowntownPlanFrameByWidth: (channel: DowntownPlanFrameChannel, dWidth: number) => void;

  /** 更新積木視覺寬高（左上角不變）；含 User Isle 主卡 */
  setPlacementDimensions: (placementId: PlacementID, width: number, height: number) => void;
  /** 同時調整寬高與位置（邊緣拖拉）；含 User Isle 主卡 */
  setPlacementRect: (
    placementId: PlacementID,
    patch: Partial<{ x: number; y: number; width: number; height: number }>
  ) => void;
  /** Town／Wild 翻面卡立面底部可編輯短文 */
  setPlacementFrontBlurb: (placementId: PlacementID, frontBlurb: string) => void;

  /** 複製積木＋ placement 至主畫布（略偏移）；不可複製身分方塊 */
  duplicatePlacement: (placementId: PlacementID) => void;

  setViewport: (v: Partial<Viewport>) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAtScreen: (screenX: number, screenY: number, nextScale: number) => void;
  setWorld: (payload: SetWorldPayload) => void;
  setSelectedPlacementId: (id: PlacementID | null) => void;
  setViewMode: (mode: AppViewMode) => void;
  setFocusRealm: (realm: FocusRealm) => void;
  setFocusLifecycle: (lifecycle: FocusLifecyclePreset) => void;
  enterFocusMode: (realm: FocusRealm, canvasEl: HTMLElement | null) => void;
  exitFocusMode: () => void;
  /** 主畫布上正在拖曳的積木（專注模式篩選時仍須渲染，避免拖過區域邊界就消失） */
  draggingCanvasPlacementId: PlacementID | null;
  setDraggingCanvasPlacementId: (id: PlacementID | null) => void;
  /** 從 Downtown 拖向主畫布時的螢幕浮層預覽 */
  planningDragVisual: PlanningDragVisual | null;
  setPlanningDragVisual: (v: PlanningDragVisual | null) => void;
  /** 剛從規劃區釋放到主畫布時觸發一次落地強調 */
  canvasArrivalFlashPlacementId: PlacementID | null;
  refocusFocusViewport: (canvasEl: HTMLElement | null) => void;
  setEditingPlacementId: (id: PlacementID | null) => void;
  setAestheticsHubMode: (mode: AestheticsHubMode) => void;
  clearPendingContentFocus: () => void;
  setDowntownHighlightedSlot: (index: number | null) => void;
  setBlankCanvasBgUrl: (url: string | null) => void;
  setBlankCanvasBgOpacity: (n: number) => void;
  setBlankCanvasBgBrightness: (n: number) => void;
  setDowntownPanelWidthPercent: (n: number) => void;
  setDowntownContentScale: (n: number) => void;
  setDowntownPanelCollapsed: (collapsed: boolean) => void;
  setCanvasPosition: (p: Partial<{ x: number; y: number }>) => void;
  panCanvasBy: (dx: number, dy: number) => void;
  setDowntownBlankScale: (n: number) => void;
  /** 以指定螢幕點為錨縮放空白畫布（client 相對視窗，viewportEl 為空白畫布視窗） */
  zoomDowntownBlankAt: (
    clientX: number,
    clientY: number,
    viewportEl: HTMLElement,
    nextScale: number
  ) => void;

  /** 將積木收納進 Downtown IG／YT 網格指定格（與既有佔位 swap 或由畫布替換） */
  assignPlacementToDowntownSlot: (
    placementId: PlacementID,
    slotIndex: number,
    opts?: { occupantReleaseWorldCenter?: { x: number; y: number }; grid?: "ig" | "yt" }
  ) => void;
  /** 從 Downtown 釋放回主畫布（world 為游標對應的世界座標中心點） */
  releasePlacementFromDowntown: (
    placementId: PlacementID,
    worldCenterX: number,
    worldCenterY: number
  ) => void;
  addBlockToDowntownIgSlot: (slotIndex: number) => void;
  addBlockToDowntownYtSlot: (slotIndex: number) => void;
  /** 在空白迷你畫布座標系新增一塊（左上角 worldX, worldY） */
  addBlockToDowntownBlank: (worldX: number, worldY: number) => void;
  assignPlacementToDowntownBlank: (placementId: PlacementID, worldX: number, worldY: number) => void;
  expandDowntownIgGrid: () => void;
  /** 刪除 placement 與對應 block，並清理 musee／選取狀態 */
  deletePlacementAndBlock: (placementId: PlacementID) => void;

  createBlock: (x: number, y: number) => void;
  /**
   * 在指定世界座標建立 Wild 初始積木（與 `createBlock` 相同；名稱對齊 HUD）。
   * 座標為 placement 左上角；若要置中請先在外層用 viewport 換算。
   */
  addBlock: (worldX: number, worldY: number) => void;
  /** 在指定世界座標與區域新增積木（專注模式／HUD） */
  addBlockInDistrict: (worldX: number, worldY: number, district: DistrictType) => void;
  updateBlock: (id: BlockID, patch: Partial<Block>) => void;
  /** 更新指定序號的 `content` 或 `next` 模組文字 */
  updateBlockContent: (blockId: BlockID, moduleIndex: number, text: string) => void;
  moveBlock: (placementId: PlacementID, x: number, y: number) => void;
  /** 與 `moveBlock` 相同：拖拽結束後寫回 placement 世界座標（左上角） */
  updateBlockPosition: (placementId: PlacementID, x: number, y: number) => void;
  setDistrict: (placementId: PlacementID, district: Placement["district"]) => void;

  /** 典籍圖示：封存倉（channel: archive） */
  sendToArchiveFromButton: (blockId: BlockID) => void;
  /** 拖入 🏛️ Portal：博物館（channel: musee） */
  sendToMuseeFromPortal: (blockId: BlockID) => void;
  /** 從封存／博物館回到主畫布 */
  restoreFromHiddenStorage: (blockId: BlockID) => void;
  /** @deprecated 使用 `sendToArchiveFromButton` */
  archiveToMusee: (blockId: BlockID) => void;
  /** @deprecated 使用 `restoreFromHiddenStorage` */
  restoreMuseeFromArchive: (blockId: BlockID) => void;

  resetViewport: () => void;
  /** 將目前所有 placement 框入指定畫布 surface（初次載入／全覽） */
  frameAllPlacements: (canvasEl: HTMLElement) => void;
}

const defaultViewport: Viewport = { x: 0, y: 0, scale: 1 };

function clearDockFieldsForBlockId(
  placements: Record<PlacementID, Placement>,
  blockId: BlockID
): Record<PlacementID, Placement> {
  const next = { ...placements };
  for (const id of Object.keys(next)) {
    const pl = next[id];
    if (pl?.blockId === blockId) {
      next[id] = { ...pl, parentContainerId: undefined, gridIndex: undefined };
    }
  }
  return next;
}

function viewportNearlyEqual(a: Viewport, b: Viewport): boolean {
  return (
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.scale - b.scale) < 1e-4
  );
}

export const useStore = create<EpisState>()(
  persist(
    (set, get) => ({
  viewport: { ...defaultViewport },
  blocks: {},
  placements: {},
  musee: {},
  selectedPlacementId: null,
  viewMode: "main",
  focusModeActive: false,
  focusRealm: "wild",
  focusLifecycle: "all",
  viewportBeforeFocus: null,
  draggingCanvasPlacementId: null,
  planningDragVisual: null,
  canvasArrivalFlashPlacementId: null,
  editingPlacementId: null,
  aestheticsHubMode: "instagram",
  pendingContentFocusPlacementId: null,
  downtownIgSlotCount: 9,
  downtownHighlightedSlotIndex: null,
  blankCanvasBgUrl: null,
  blankCanvasBgOpacity: 1,
  blankCanvasBgBrightness: 1,
  downtownPanelWidthPercent: 34,
  downtownContentScale: 1,
  downtownPanelCollapsed: false,
  canvasPosition: { x: 0, y: 0 },
  downtownBlankScale: 1,
  worldDistrictZones: DEFAULT_DISTRICT_ZONES.map((z) => ({ ...z })),
  projectTitle: "User Isle",
  identityBio:
    "今天島上天氣剛好 ☀️\n記錄限動、長片靈感與小目標～\n歡迎路過留言一顆小石頭 ✿",
  identityStickerUrl: null,
  identityLeaves: [],
  selectedIdentityLeafId: null,
  identityCardCollapsed: false,
  blankStoryRings: createDefaultBlankStoryRings(),
  plannerStoryRingUrls: {
    instagram: [null, null, null, null, null],
    youtube: [null, null, null, null, null],
  },
  downtownWorkspacePan: { x: 0, y: 0 },
  downtownPlanFrames: {
    instagram: {
      x: 0,
      y: 0,
      width: DOWNTOWN_PLAN_FRAME_DEFAULT_WIDTH_PX,
    },
    youtube: {
      x: 0,
      y: 0,
      width: DOWNTOWN_PLAN_FRAME_DEFAULT_WIDTH_PX,
    },
  },

  setWorldDistrictZones: (worldDistrictZones) => set({ worldDistrictZones }),

  setProjectTitle: (title) => {
    const t = title.trim();
    set({
      projectTitle: t.length > 0 ? t.slice(0, 160) : "User Isle",
    });
  },

  setIdentityBio: (identityBio) =>
    set({ identityBio: identityBio.slice(0, 600) }),

  setIdentityStickerUrl: (identityStickerUrl) =>
    set({
      identityStickerUrl:
        identityStickerUrl == null
          ? null
          : identityStickerUrl.length > 2_400_000
            ? identityStickerUrl.slice(0, 2_400_000)
            : identityStickerUrl,
    }),

  setSelectedIdentityLeafId: (selectedIdentityLeafId) => set({ selectedIdentityLeafId }),

  addIdentityLeaf: () =>
    set((s) => {
      if (s.identityLeaves.length >= IDENTITY_LEAF_MAX) return s;
      const id = nanoid();
      const n = s.identityLeaves.length;
      const leaf: IdentityLeaf = {
        id,
        text: "新葉片",
        imageUrl: null,
        imageScale: 1,
        imagePanX: 0,
        imagePanY: 0,
        accentBg: IDENTITY_LEAF_BG_PALETTE[n % IDENTITY_LEAF_BG_PALETTE.length],
        x: 10 + (n % 4) * 14,
        y: 12 + (n % 3) * 16,
        width: 96,
        height: 72,
      };
      return {
        identityLeaves: [...s.identityLeaves, clampIdentityLeaf(leaf, {})],
        selectedIdentityLeafId: id,
      };
    }),

  updateIdentityLeaf: (leafId, patch) =>
    set((s) => {
      const i = s.identityLeaves.findIndex((l) => l.id === leafId);
      if (i < 0) return s;
      const prev = s.identityLeaves[i]!;
      const img = patch.imageUrl;
      const safePatch =
        img != null && img.length > 2_000_000 ? { ...patch, imageUrl: img.slice(0, 2_000_000) } : patch;
      const next = clampIdentityLeaf(prev, safePatch);
      const arr = [...s.identityLeaves];
      arr[i] = next;
      return { identityLeaves: arr };
    }),

  removeIdentityLeaf: (leafId) =>
    set((s) => ({
      identityLeaves: s.identityLeaves.filter((l) => l.id !== leafId),
      selectedIdentityLeafId:
        s.selectedIdentityLeafId === leafId ? null : s.selectedIdentityLeafId,
    })),

  setIdentityCardCollapsed: (identityCardCollapsed) => set({ identityCardCollapsed }),

  updateBlankStoryRing: (id, patch) =>
    set((s) => {
      const i = s.blankStoryRings.findIndex((r) => r.id === id);
      if (i < 0) return s;
      const prev = s.blankStoryRings[i]!;
      const text =
        patch.text !== undefined
          ? patch.text.slice(0, BLANK_LABEL_TEXT_MAX)
          : prev.text.slice(0, BLANK_LABEL_TEXT_MAX);
      const positionX =
        patch.positionX !== undefined ? patch.positionX : prev.positionX;
      const positionY =
        patch.positionY !== undefined ? patch.positionY : (prev.positionY ?? 52);
      const accentBg: IdentityLeafBgColor = normalizeLeafAccent(
        patch.accentBg !== undefined ? patch.accentBg : (prev.accentBg ?? IDENTITY_LEAF_BG_PALETTE[0])
      );
      const labelShape = normalizeBlankRingLabelShape(
        patch.labelShape !== undefined ? patch.labelShape : prev.labelShape
      );
      const nextRings = [...s.blankStoryRings];
      const { ringScale: _drop, ...prevRest } = prev as BlankStoryRing & { ringScale?: number };
      nextRings[i] = { ...prevRest, text, positionX, positionY, accentBg, labelShape };
      return { blankStoryRings: nextRings };
    }),

  removeBlankStoryRing: (id) =>
    set((s) => ({
      blankStoryRings: s.blankStoryRings.filter((r) => r.id !== id),
    })),

  addBlankStoryRing: (shapeArg, worldBodyPos) =>
    set((s) => {
      const stepX = 228;
      const stepY = 112;
      const id = nanoid();
      const n = s.blankStoryRings.length;
      const col = n % 5;
      const row = Math.floor(n / 5);
      const labelShape = normalizeBlankRingLabelShape(
        shapeArg !== undefined ? shapeArg : BLANK_RING_LABEL_SHAPES[n % BLANK_RING_LABEL_SHAPES.length]
      );
      const positionX =
        worldBodyPos != null ? worldBodyPos.x : 36 + col * stepX;
      const positionY =
        worldBodyPos != null ? worldBodyPos.y : 36 + row * stepY;
      return {
        blankStoryRings: [
          ...s.blankStoryRings,
          {
            id,
            text: "",
            positionX,
            positionY,
            accentBg: IDENTITY_LEAF_BG_PALETTE[n % IDENTITY_LEAF_BG_PALETTE.length],
            labelShape,
          },
        ],
      };
    }),

  setPlannerStoryRingUrl: (channel, index, url) =>
    set((s) => {
      if (index < 0 || index >= 5) return s;
      const row = [...s.plannerStoryRingUrls[channel]];
      row[index] =
        url != null && url.length > 1_800_000 ? url.slice(0, 1_800_000) : url;
      return {
        plannerStoryRingUrls: { ...s.plannerStoryRingUrls, [channel]: row },
      };
    }),

  panDowntownWorkspaceBy: (dx, dy) =>
    set((s) => ({
      downtownWorkspacePan: {
        x: s.downtownWorkspacePan.x + dx,
        y: s.downtownWorkspacePan.y + dy,
      },
    })),

  resetDowntownWorkspacePan: () =>
    set({
      downtownWorkspacePan: { x: 0, y: 0 },
    }),

  zoomDowntownWorkspaceAt: (localX, localY, nextScale) =>
    set((s) => {
      const scale = clampDowntownContentScale(nextScale);
      const prev = s.downtownContentScale > 1e-6 ? s.downtownContentScale : 1;
      const { x: panX, y: panY } = s.downtownWorkspacePan;
      const wx = (localX - panX) / prev;
      const wy = (localY - panY) / prev;
      return {
        downtownContentScale: scale,
        downtownWorkspacePan: {
          x: localX - wx * scale,
          y: localY - wy * scale,
        },
      };
    }),

  panDowntownPlanFrameBy: (channel, dx, dy) =>
    set((s) => {
      const cur = s.downtownPlanFrames[channel];
      return {
        downtownPlanFrames: {
          ...s.downtownPlanFrames,
          [channel]: { ...cur, x: cur.x + dx, y: cur.y + dy },
        },
      };
    }),

  resizeDowntownPlanFrameByWidth: (channel, dWidth) =>
    set((s) => {
      const cur = s.downtownPlanFrames[channel];
      const w = Math.round(
        Math.min(
          DOWNTOWN_PLAN_FRAME_MAX_WIDTH_PX,
          Math.max(DOWNTOWN_PLAN_FRAME_MIN_WIDTH_PX, cur.width + dWidth)
        )
      );
      return {
        downtownPlanFrames: {
          ...s.downtownPlanFrames,
          [channel]: { ...cur, width: w },
        },
      };
    }),

  setPlacementDimensions: (placementId, width, height) =>
    set((s) => {
      const p = s.placements[placementId];
      if (!p) return s;
      const w = Math.round(Math.min(PLACEMENT_WIDTH_MAX, Math.max(PLACEMENT_WIDTH_MIN, width)));
      const h = Math.round(Math.min(PLACEMENT_HEIGHT_MAX, Math.max(PLACEMENT_HEIGHT_MIN, height)));
      let px = p.position.x;
      let py = p.position.y;
      if (p.parentContainerId === DOWNTOWN_BLANK_CONTAINER_ID) {
        px = Math.min(DOWNTOWN_BLANK_WORLD_W - w, Math.max(0, px));
        py = Math.min(DOWNTOWN_BLANK_WORLD_H - h, Math.max(0, py));
      }
      return {
        placements: {
          ...s.placements,
          [placementId]: {
            ...p,
            position: { x: px, y: py },
            ui: { ...p.ui, width: w, height: h },
          },
        },
      };
    }),

  setPlacementRect: (placementId, patch) =>
    set((s) => {
      const p = s.placements[placementId];
      if (!p) return s;
      const dockedIgGrid =
        p.parentContainerId === DOWNTOWN_IG_CONTAINER_ID ||
        p.parentContainerId === DOWNTOWN_YT_CONTAINER_ID;
      const inBlank = p.parentContainerId === DOWNTOWN_BLANK_CONTAINER_ID;
      const w0 = p.ui?.width ?? DEFAULT_BLOCK_PLACEMENT_WIDTH;
      const h0 = p.ui?.height ?? DEFAULT_BLOCK_PLACEMENT_HEIGHT;
      const w =
        patch.width !== undefined
          ? Math.round(Math.min(PLACEMENT_WIDTH_MAX, Math.max(PLACEMENT_WIDTH_MIN, patch.width)))
          : w0;
      const h =
        patch.height !== undefined
          ? Math.round(Math.min(PLACEMENT_HEIGHT_MAX, Math.max(PLACEMENT_HEIGHT_MIN, patch.height)))
          : h0;
      let x = dockedIgGrid ? p.position.x : (patch.x ?? p.position.x);
      let y = dockedIgGrid ? p.position.y : (patch.y ?? p.position.y);
      if (inBlank) {
        x = Math.min(DOWNTOWN_BLANK_WORLD_W - w, Math.max(0, x));
        y = Math.min(DOWNTOWN_BLANK_WORLD_H - h, Math.max(0, y));
      }
      return {
        placements: {
          ...s.placements,
          [placementId]: {
            ...p,
            position: { x, y },
            ui: { ...p.ui, width: w, height: h },
          },
        },
      };
    }),

  setPlacementFrontBlurb: (placementId, frontBlurb) =>
    set((s) => {
      const p = s.placements[placementId];
      if (!p) return s;
      return {
        placements: {
          ...s.placements,
          [placementId]: {
            ...p,
            ui: { ...p.ui, frontBlurb },
          },
        },
      };
    }),

  setViewport: (partial) =>
    set((s) => {
      const scale =
        partial.scale !== undefined
          ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, partial.scale))
          : s.viewport.scale;
      return {
        viewport: {
          x: partial.x ?? s.viewport.x,
          y: partial.y ?? s.viewport.y,
          scale,
        },
      };
    }),

  panBy: (dx, dy) =>
    set((s) => ({
      viewport: {
        ...s.viewport,
        x: s.viewport.x + dx,
        y: s.viewport.y + dy,
      },
    })),

  zoomAtScreen: (screenX, screenY, nextScale) =>
    set((s) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      const { x: vx, y: vy, scale: prev } = s.viewport;
      const safePrev = prev > 1e-6 ? prev : 1;
      const worldX = (screenX - vx) / safePrev;
      const worldY = (screenY - vy) / safePrev;
      return {
        viewport: {
          scale,
          x: screenX - worldX * scale,
          y: screenY - worldY * scale,
        },
      };
    }),

  setWorld: ({ blocks, placements, musee: nextMusee }) =>
    set((s) => {
      const normalizedPlacements = normalizePlacementDistricts(asPlacementRecord(placements));
      const merged = mergeIdentityIntoState(asBlockRecord(blocks), normalizedPlacements);
      const baseMusee = nextMusee !== undefined ? { ...nextMusee } : { ...s.musee };
      if (IDENTITY_BLOCK_ID in baseMusee) {
        const { [IDENTITY_BLOCK_ID]: _removed, ...rest } = baseMusee;
        return {
          blocks: merged.blocks,
          placements: merged.placements,
          musee: rest,
        };
      }
      return {
        blocks: merged.blocks,
        placements: merged.placements,
        musee: baseMusee,
      };
    }),

  setSelectedPlacementId: (selectedPlacementId) => set({ selectedPlacementId }),

  setViewMode: (viewMode) => set({ viewMode }),

  setFocusRealm: (focusRealm) => set({ focusRealm }),

  setFocusLifecycle: (focusLifecycle) => set({ focusLifecycle }),

  refocusFocusViewport: (canvasEl) => {
    const st = get();
    if (!st.focusModeActive || !canvasEl) return;
    const { width, height } = canvasEl.getBoundingClientRect();
    if (width < 8 || height < 8) return;
    const next = computeViewportToFitFocusSubset(
      width,
      height,
      st.placements,
      st.blocks,
      st.musee,
      st.focusRealm,
      st.focusLifecycle
    );
    if (
      !Number.isFinite(next.x) ||
      !Number.isFinite(next.y) ||
      !Number.isFinite(next.scale) ||
      next.scale <= 0
    ) {
      return;
    }
    set({ viewport: next });
  },

  enterFocusMode: (realm, _canvasEl) => {
    const s = get();
    set({
      focusModeActive: true,
      focusRealm: realm,
      viewportBeforeFocus: { ...s.viewport },
      draggingCanvasPlacementId: null,
    });
  },

  exitFocusMode: () => {
    const s = get();
    const snap = s.viewportBeforeFocus;
    let placementsPatch: Record<PlacementID, Placement> | undefined;
    if (s.focusRealm === "wild") {
      const snapped = snapWildPlacementsAfterFocusWild(s.placements, s.worldDistrictZones);
      if (snapped) placementsPatch = snapped;
    }
    set({
      focusModeActive: false,
      viewportBeforeFocus: null,
      draggingCanvasPlacementId: null,
      ...(snap ? { viewport: { ...snap } } : {}),
      ...(placementsPatch ? { placements: placementsPatch } : {}),
    });
  },

  setDraggingCanvasPlacementId: (draggingCanvasPlacementId) => set({ draggingCanvasPlacementId }),
  setPlanningDragVisual: (planningDragVisual) => set({ planningDragVisual }),

  setEditingPlacementId: (editingPlacementId) => set({ editingPlacementId }),

  setAestheticsHubMode: (aestheticsHubMode) => set({ aestheticsHubMode }),

  clearPendingContentFocus: () => set({ pendingContentFocusPlacementId: null }),

  setDowntownHighlightedSlot: (downtownHighlightedSlotIndex) => set({ downtownHighlightedSlotIndex }),

  setBlankCanvasBgUrl: (blankCanvasBgUrl) => set({ blankCanvasBgUrl }),

  setBlankCanvasBgOpacity: (blankCanvasBgOpacity) =>
    set({ blankCanvasBgOpacity: Math.min(1, Math.max(0.04, blankCanvasBgOpacity)) }),

  setBlankCanvasBgBrightness: (blankCanvasBgBrightness) =>
    set({ blankCanvasBgBrightness: Math.min(1.35, Math.max(0.82, blankCanvasBgBrightness)) }),

  setDowntownPanelWidthPercent: (downtownPanelWidthPercent) =>
    set({
      /** 上限提高，避免寬螢幕右欄被壓扁、右側像浪費空白（仍保留主畫布最小空間） */
      downtownPanelWidthPercent: Math.min(88, Math.max(22, downtownPanelWidthPercent)),
    }),

  setDowntownContentScale: (downtownContentScale) =>
    set({
      downtownContentScale: clampDowntownContentScale(downtownContentScale),
    }),

  setDowntownPanelCollapsed: (downtownPanelCollapsed) => set({ downtownPanelCollapsed }),

  setCanvasPosition: (partial) =>
    set((s) => ({
      canvasPosition: {
        x: partial.x ?? s.canvasPosition.x,
        y: partial.y ?? s.canvasPosition.y,
      },
    })),

  panCanvasBy: (dx, dy) =>
    set((s) => ({
      canvasPosition: {
        x: s.canvasPosition.x + dx,
        y: s.canvasPosition.y + dy,
      },
    })),

  setDowntownBlankScale: (downtownBlankScale) =>
    set({
      downtownBlankScale: Math.min(
        DOWNTOWN_BLANK_SCALE_MAX,
        Math.max(DOWNTOWN_BLANK_SCALE_MIN, downtownBlankScale)
      ),
    }),

  zoomDowntownBlankAt: (clientX, clientY, viewportEl, nextScale) =>
    set((s) => {
      const scale = Math.min(
        DOWNTOWN_BLANK_SCALE_MAX,
        Math.max(DOWNTOWN_BLANK_SCALE_MIN, nextScale)
      );
      const prev = s.downtownBlankScale > 1e-6 ? s.downtownBlankScale : 1;
      const { x: posX, y: posY } = s.canvasPosition;
      const r = viewportEl.getBoundingClientRect();
      const ox = clientX - r.left;
      const oy = clientY - r.top;
      const ratio = scale / prev;
      return {
        downtownBlankScale: scale,
        canvasPosition: {
          x: ox - (ox - posX) * ratio,
          y: oy - (oy - posY) * ratio,
        },
      };
    }),

  assignPlacementToDowntownSlot: (placementId, slotIndex, opts) =>
    set((s) => {
      const grid = opts?.grid ?? "ig";
      const D = grid === "yt" ? DOWNTOWN_YT_CONTAINER_ID : DOWNTOWN_IG_CONTAINER_ID;
      const p = s.placements[placementId];
      if (!p || p.blockId in s.musee) return s;
      if (isIdentityPlacementId(placementId) || isIdentityBlockId(p.blockId)) return s;
      if (slotIndex < 0 || slotIndex >= s.downtownIgSlotCount) return s;
      if (p.parentContainerId === D && p.gridIndex === slotIndex) return s;

      const slotDistrict: "instagram" | "youtube" =
        grid === "yt" ? "youtube" : p.district === "youtube" ? "youtube" : "instagram";

      const next: Record<PlacementID, Placement> = { ...s.placements };
      const dockedUi = {
        width: DOWNTOWN_SLOT_PX,
        height: DOWNTOWN_SLOT_PX,
        variant: "refined" as const,
      };

      const occupantId = Object.keys(next).find(
        (id) =>
          id !== placementId &&
          next[id]!.parentContainerId === D &&
          next[id]!.gridIndex === slotIndex
      );

      let blocks = { ...s.blocks };

      if (occupantId) {
        const occ = next[occupantId]!;
        if (p.parentContainerId === D) {
          const gi = p.gridIndex ?? 0;
          next[occupantId] = { ...occ, gridIndex: gi };
          next[placementId] = {
            ...p,
            gridIndex: slotIndex,
            district: slotDistrict,
            ui: { ...p.ui, ...dockedUi },
          };
        } else {
          const releaseCenter = opts?.occupantReleaseWorldCenter;
          const prevWorld =
            releaseCenter != null
              ? {
                  x: releaseCenter.x - DEFAULT_BLOCK_PLACEMENT_WIDTH / 2,
                  y: releaseCenter.y - DEFAULT_BLOCK_PLACEMENT_HEIGHT / 2,
                }
              : { ...p.position };
          next[occupantId] = {
            ...occ,
            parentContainerId: undefined,
            gridIndex: undefined,
            position: prevWorld,
            ui: {
              ...occ.ui,
              width: occ.ui?.width ?? DEFAULT_BLOCK_PLACEMENT_WIDTH,
              height: occ.ui?.height ?? DEFAULT_BLOCK_PLACEMENT_HEIGHT,
              variant: occ.district === "wild" ? "raw" : "refined",
            },
          };
          next[placementId] = {
            ...p,
            parentContainerId: D,
            gridIndex: slotIndex,
            district: slotDistrict,
            ui: { ...p.ui, ...dockedUi },
          };
        }
      } else {
        next[placementId] = {
          ...p,
          parentContainerId: D,
          gridIndex: slotIndex,
          district: slotDistrict,
          ui: { ...p.ui, ...dockedUi },
        };
      }

      const dockedBlock = blocks[next[placementId]!.blockId];
      if (dockedBlock) {
        blocks = {
          ...blocks,
          [next[placementId]!.blockId]: transformBlockForDistrict(dockedBlock, slotDistrict),
        };
      }

      return { placements: next, blocks };
    }),

  releasePlacementFromDowntown: (placementId, worldCenterX, worldCenterY) => {
    const p0 = get().placements[placementId];
    const wasDocked =
      p0 &&
      (p0.parentContainerId === DOWNTOWN_IG_CONTAINER_ID ||
        p0.parentContainerId === DOWNTOWN_YT_CONTAINER_ID ||
        p0.parentContainerId === DOWNTOWN_BLANK_CONTAINER_ID);
    set((s) => {
      if (isIdentityPlacementId(placementId)) return s;
      const p = s.placements[placementId];
      if (!p) return s;
      const w = Math.min(
        PLACEMENT_WIDTH_MAX,
        Math.max(PLACEMENT_WIDTH_MIN, p.ui?.width ?? DEFAULT_BLOCK_PLACEMENT_WIDTH)
      );
      const h = Math.min(
        PLACEMENT_HEIGHT_MAX,
        Math.max(PLACEMENT_HEIGHT_MIN, p.ui?.height ?? DEFAULT_BLOCK_PLACEMENT_HEIGHT)
      );
      let nx = worldCenterX - w / 2;
      let ny = worldCenterY - h / 2;
      const bounds = getCanvasWorldBackgroundRect(s.worldDistrictZones, 14);
      nx = Math.min(bounds.x + bounds.width - w, Math.max(bounds.x, nx));
      ny = Math.min(bounds.y + bounds.height - h, Math.max(bounds.y, ny));
      let nextP: Placement = {
        ...p,
        parentContainerId: undefined,
        gridIndex: undefined,
        position: { x: nx, y: ny },
        ui: {
          ...p.ui,
          width: w,
          height: h,
        },
      };
      const hint = detectDistrictForRectCenterWorld(placementToRect(nextP), s.worldDistrictZones);
      const district = hint !== "neutral" ? hint : nextP.district;
      nextP = {
        ...nextP,
        district,
        ui: {
          ...nextP.ui,
          variant: district === "wild" ? "raw" : "refined",
        },
      };
      const block = s.blocks[p.blockId];
      if (!block) {
        return { placements: { ...s.placements, [placementId]: nextP } };
      }
      const transformed = transformBlockForDistrict(block, district);
      return {
        placements: { ...s.placements, [placementId]: nextP },
        blocks: { ...s.blocks, [block.id]: transformed },
      };
    });
    if (wasDocked) {
      queueMicrotask(() => {
        useStore.setState({ canvasArrivalFlashPlacementId: placementId });
        window.setTimeout(() => {
          useStore.setState((s) =>
            s.canvasArrivalFlashPlacementId === placementId ? { canvasArrivalFlashPlacementId: null } : {}
          );
        }, 700);
      });
    }
  },

  addBlockToDowntownIgSlot: (slotIndex) => {
    const id = nanoid();
    const placementId = nanoid();
    const now = Date.now();
    set((s) => {
      const D = DOWNTOWN_IG_CONTAINER_ID;
      if (slotIndex < 0 || slotIndex >= s.downtownIgSlotCount) return s;
      const occupied = Object.values(s.placements).some(
        (pl) => pl.parentContainerId === D && pl.gridIndex === slotIndex
      );
      if (occupied) return s;

      const rawBlock: Block = {
        id,
        lifecycle: "idea",
        modules: [
          { type: "content", content: "" },
          { type: "next", text: "" },
        ],
        createdAt: now,
        updatedAt: now,
      };
      const block = transformBlockForDistrict(rawBlock, "instagram");

      return {
        blocks: { ...s.blocks, [id]: block },
        placements: {
          ...s.placements,
          [placementId]: {
            id: placementId,
            blockId: id,
            district: "instagram",
            parentContainerId: D,
            gridIndex: slotIndex,
            position: { x: 0, y: 0 },
            ui: {
              width: DOWNTOWN_SLOT_PX,
              height: DOWNTOWN_SLOT_PX,
              variant: "refined",
            },
          },
        },
        pendingContentFocusPlacementId: placementId,
      };
    });
  },

  addBlockToDowntownYtSlot: (slotIndex) => {
    const id = nanoid();
    const placementId = nanoid();
    const now = Date.now();
    set((s) => {
      const D = DOWNTOWN_YT_CONTAINER_ID;
      if (slotIndex < 0 || slotIndex >= s.downtownIgSlotCount) return s;
      const occupied = Object.values(s.placements).some(
        (pl) => pl.parentContainerId === D && pl.gridIndex === slotIndex
      );
      if (occupied) return s;

      const rawBlock: Block = {
        id,
        lifecycle: "idea",
        modules: [
          { type: "content", content: "" },
          { type: "next", text: "" },
        ],
        createdAt: now,
        updatedAt: now,
      };
      const block = transformBlockForDistrict(rawBlock, "youtube");

      return {
        blocks: { ...s.blocks, [id]: block },
        placements: {
          ...s.placements,
          [placementId]: {
            id: placementId,
            blockId: id,
            district: "youtube",
            parentContainerId: D,
            gridIndex: slotIndex,
            position: { x: 0, y: 0 },
            ui: {
              width: DOWNTOWN_SLOT_PX,
              height: DOWNTOWN_SLOT_PX,
              variant: "refined",
            },
          },
        },
        pendingContentFocusPlacementId: placementId,
      };
    });
  },

  addBlockToDowntownBlank: (worldX, worldY) => {
    const id = nanoid();
    const placementId = nanoid();
    const now = Date.now();
    const B = DOWNTOWN_BLANK_CONTAINER_ID;
    set((s) => {
      const rawBlock: Block = {
        id,
        lifecycle: "idea",
        modules: [
          { type: "content", content: "" },
          { type: "next", text: "" },
        ],
        createdAt: now,
        updatedAt: now,
      };
      const block = transformBlockForDistrict(rawBlock, "instagram");
      return {
        blocks: { ...s.blocks, [id]: block },
        placements: {
          ...s.placements,
          [placementId]: {
            id: placementId,
            blockId: id,
            district: "instagram",
            parentContainerId: B,
            position: { x: worldX, y: worldY },
            ui: {
              width: DEFAULT_BLOCK_PLACEMENT_WIDTH,
              height: DEFAULT_BLOCK_PLACEMENT_HEIGHT,
              variant: "refined",
            },
          },
        },
        pendingContentFocusPlacementId: placementId,
      };
    });
  },

  assignPlacementToDowntownBlank: (placementId, worldX, worldY) =>
    set((s) => {
      const B = DOWNTOWN_BLANK_CONTAINER_ID;
      const p = s.placements[placementId];
      if (!p || p.blockId in s.musee) return s;
      if (isIdentityPlacementId(placementId) || isIdentityBlockId(p.blockId)) return s;
      const district = p.district === "wild" ? "instagram" : p.district;
      const nextP: Placement = {
        ...p,
        parentContainerId: B,
        gridIndex: undefined,
        position: { x: worldX, y: worldY },
        district,
        ui: {
          ...p.ui,
          width: p.ui?.width ?? DEFAULT_BLOCK_PLACEMENT_WIDTH,
          height: p.ui?.height ?? DEFAULT_BLOCK_PLACEMENT_HEIGHT,
          variant: "refined",
        },
      };
      let blocks = { ...s.blocks };
      const blk = blocks[p.blockId];
      if (blk) {
        blocks = { ...blocks, [blk.id]: transformBlockForDistrict(blk, district) };
      }
      return { placements: { ...s.placements, [placementId]: nextP }, blocks };
    }),

  expandDowntownIgGrid: () => set((s) => ({ downtownIgSlotCount: s.downtownIgSlotCount + 3 })),

  duplicatePlacement: (placementId) => {
    if (isIdentityPlacementId(placementId)) return;
    const s = get();
    const p = s.placements[placementId];
    if (!p) return;
    const b = s.blocks[p.blockId];
    if (!b || b.id in s.musee) return;

    const newBlockId = nanoid();
    const newPlacementId = nanoid();
    const dupBlock = duplicateBlockEntity(b, newBlockId);
    const off = 48;
    const isBlankDock = p.parentContainerId === DOWNTOWN_BLANK_CONTAINER_ID;
    const dockedOther = !!p.parentContainerId && !isBlankDock;
    const jitter = (seed: string) => {
      let h = 0;
      for (let k = 0; k < seed.length; k++) h = (h * 31 + seed.charCodeAt(k)) | 0;
      return Math.abs(h % 100);
    };
    const w = Math.min(
      PLACEMENT_WIDTH_MAX,
      Math.max(PLACEMENT_WIDTH_MIN, p.ui?.width ?? DEFAULT_BLOCK_PLACEMENT_WIDTH)
    );
    const hgt = Math.min(
      PLACEMENT_HEIGHT_MAX,
      Math.max(PLACEMENT_HEIGHT_MIN, p.ui?.height ?? DEFAULT_BLOCK_PLACEMENT_HEIGHT)
    );

    let wx: number;
    let wy: number;
    let parentNext: string | undefined;

    if (isBlankDock) {
      parentNext = DOWNTOWN_BLANK_CONTAINER_ID;
      wx = Math.min(DOWNTOWN_BLANK_WORLD_W - w, Math.max(0, p.position.x + off));
      wy = Math.min(DOWNTOWN_BLANK_WORLD_H - hgt, Math.max(0, p.position.y + off));
    } else if (dockedOther) {
      parentNext = undefined;
      wx = -520 + jitter(newPlacementId);
      wy = -150 + jitter(newBlockId);
    } else {
      parentNext = undefined;
      wx = p.position.x + off;
      wy = p.position.y + off;
    }

    const newP: Placement = {
      ...p,
      id: newPlacementId,
      blockId: newBlockId,
      parentContainerId: parentNext,
      gridIndex: undefined,
      position: { x: wx, y: wy },
      ui: {
        ...p.ui,
        width: w,
        height: hgt,
        variant: p.district === "wild" ? "raw" : "refined",
      },
    };
    const tb = transformBlockForDistrict(dupBlock, newP.district);
    set({
      blocks: { ...s.blocks, [newBlockId]: tb },
      placements: { ...s.placements, [newPlacementId]: newP },
      selectedPlacementId: newPlacementId,
    });
  },

  deletePlacementAndBlock: (placementId) =>
    set((s) => {
      if (isIdentityPlacementId(placementId)) return s;
      const p = s.placements[placementId];
      if (!p) return s;
      const bid = p.blockId;
      const { [bid]: _rm, ...musee } = s.musee;
      const museeNext = bid in s.musee ? musee : s.musee;
      const { [placementId]: _rp, ...placements } = s.placements;
      const { [bid]: _rb, ...blocks } = s.blocks;
      return {
        placements,
        blocks,
        musee: museeNext,
        selectedPlacementId: s.selectedPlacementId === placementId ? null : s.selectedPlacementId,
        editingPlacementId: s.editingPlacementId === placementId ? null : s.editingPlacementId,
      };
    }),

  createBlock: (x, y) => {
    get().addBlock(x, y);
  },

  addBlock: (x, y) => {
    const id = nanoid();
    const placementId = nanoid();
    const now = Date.now();
    const jitter = () => (Math.random() - 0.5) * 140;
    const jx = x + jitter();
    const jy = y + jitter();
    set((s) => ({
      blocks: {
        ...s.blocks,
        [id]: {
          id,
          lifecycle: "idea",
          modules: [
            { type: "content", content: "" },
            { type: "next", text: "" },
          ],
          createdAt: now,
          updatedAt: now,
        },
      },
      placements: {
        ...s.placements,
        [placementId]: {
          id: placementId,
          blockId: id,
          district: "wild",
          position: { x: jx, y: jy },
          ui: { variant: "raw", width: 280, height: 220 },
        },
      },
      pendingContentFocusPlacementId: placementId,
    }));
  },

  addBlockInDistrict: (x, y, district) => {
    const id = nanoid();
    const placementId = nanoid();
    const now = Date.now();
    const jitter = () => (Math.random() - 0.5) * 100;
    const d: DistrictType = district === "neutral" ? "wild" : district;
    const rawBlock: Block = {
      id,
      lifecycle: "idea",
      modules: [
        { type: "content", content: "" },
        { type: "next", text: "" },
      ],
      createdAt: now,
      updatedAt: now,
    };
    const block = transformBlockForDistrict(rawBlock, d);
    const variant = d === "wild" ? ("raw" as const) : ("refined" as const);
    set((s) => ({
      blocks: { ...s.blocks, [id]: block },
      placements: {
        ...s.placements,
        [placementId]: {
          id: placementId,
          blockId: id,
          district: d,
          position: { x: x + jitter(), y: y + jitter() },
          ui: { variant, width: 280, height: 220 },
        },
      },
      pendingContentFocusPlacementId: placementId,
    }));
  },

  updateBlock: (id, patch) =>
    set((s) => {
      const prev = s.blocks[id];
      if (!prev) return s;
      return {
        blocks: {
          ...s.blocks,
          [id]: { ...prev, ...patch, updatedAt: Date.now() },
        },
      };
    }),

  updateBlockContent: (blockId, moduleIndex, text) =>
    set((s) => {
      const prev = s.blocks[blockId];
      if (!prev) return s;
      const mods = [...prev.modules];
      if (moduleIndex < 0 || moduleIndex >= mods.length) return s;
      const m = mods[moduleIndex];
      if (m.type === "content") {
        mods[moduleIndex] = { type: "content", content: text };
      } else if (m.type === "next") {
        mods[moduleIndex] = { type: "next", text };
      } else {
        return s;
      }
      return {
        blocks: {
          ...s.blocks,
          [blockId]: { ...prev, modules: mods, updatedAt: Date.now() },
        },
      };
    }),

  moveBlock: (placementId, x, y) =>
    set((s) => {
      const p = s.placements[placementId];
      if (!p) return s;
      let nx = x;
      let ny = y;
      if (p.parentContainerId === DOWNTOWN_BLANK_CONTAINER_ID) {
        const w = Math.min(
          PLACEMENT_WIDTH_MAX,
          Math.max(PLACEMENT_WIDTH_MIN, p.ui?.width ?? DEFAULT_BLOCK_PLACEMENT_WIDTH)
        );
        const h = Math.min(
          PLACEMENT_HEIGHT_MAX,
          Math.max(PLACEMENT_HEIGHT_MIN, p.ui?.height ?? DEFAULT_BLOCK_PLACEMENT_HEIGHT)
        );
        nx = Math.min(DOWNTOWN_BLANK_WORLD_W - w, Math.max(0, nx));
        ny = Math.min(DOWNTOWN_BLANK_WORLD_H - h, Math.max(0, ny));
      } else if (!p.parentContainerId) {
        /** 主畫布：限制在 district 聯集外擴格線內，避免拖到大座標「失蹤」 */
        const bounds = getCanvasWorldBackgroundRect(s.worldDistrictZones, 14);
        const w = Math.min(
          PLACEMENT_WIDTH_MAX,
          Math.max(PLACEMENT_WIDTH_MIN, p.ui?.width ?? DEFAULT_BLOCK_PLACEMENT_WIDTH)
        );
        const h = Math.min(
          PLACEMENT_HEIGHT_MAX,
          Math.max(PLACEMENT_HEIGHT_MIN, p.ui?.height ?? DEFAULT_BLOCK_PLACEMENT_HEIGHT)
        );
        nx = Math.min(bounds.x + bounds.width - w, Math.max(bounds.x, nx));
        ny = Math.min(bounds.y + bounds.height - h, Math.max(bounds.y, ny));
      }
      return {
        placements: {
          ...s.placements,
          [placementId]: { ...p, position: { x: nx, y: ny } },
        },
      };
    }),

  updateBlockPosition: (placementId, x, y) => {
    get().moveBlock(placementId, x, y);
  },

  setDistrict: (placementId, district) => {
    if (isIdentityPlacementId(placementId)) return;
    const { blocks, placements } = get();
    const placement = placements[placementId];
    if (!placement) return;
    const block = blocks[placement.blockId];
    if (!block) return;

    const transformed = transformBlockForDistrict(block, district);

    const wasDocked = !!placement.parentContainerId;
    const nextPlacement: Placement = wasDocked
      ? {
          ...placement,
          district,
          parentContainerId: undefined,
          gridIndex: undefined,
          position: { x: -260, y: 120 },
          ui: {
            ...placement.ui,
            width: DEFAULT_BLOCK_PLACEMENT_WIDTH,
            height: DEFAULT_BLOCK_PLACEMENT_HEIGHT,
            variant: district === "wild" ? "raw" : "refined",
          },
        }
      : {
          ...placement,
          district,
          ui: {
            ...placement.ui,
            variant: district === "wild" ? "raw" : "refined",
          },
        };

    set((s) => ({
      blocks: {
        ...s.blocks,
        [block.id]: transformed,
      },
      placements: {
        ...s.placements,
        [placementId]: nextPlacement,
      },
    }));
  },

  sendToArchiveFromButton: (blockId) =>
    set((s) => {
      if (isIdentityBlockId(blockId)) return s;
      const block = s.blocks[blockId];
      if (!block) return s;
      const now = Date.now();
      const entry: MuseeEntry = { blockId, archivedAt: now, channel: "archive" };
      const sel = s.selectedPlacementId;
      const placement = sel ? s.placements[sel] : undefined;
      const clearSelection = placement?.blockId === blockId;
      return {
        musee: { ...s.musee, [blockId]: entry },
        blocks: {
          ...s.blocks,
          [blockId]: { ...block, lifecycle: "archived", updatedAt: now },
        },
        placements: clearDockFieldsForBlockId(s.placements, blockId),
        selectedPlacementId: clearSelection ? null : s.selectedPlacementId,
      };
    }),

  sendToMuseeFromPortal: (blockId) =>
    set((s) => {
      if (isIdentityBlockId(blockId)) return s;
      const block = s.blocks[blockId];
      if (!block) return s;
      const now = Date.now();
      const entry: MuseeEntry = { blockId, archivedAt: now, channel: "musee" };
      const sel = s.selectedPlacementId;
      const placement = sel ? s.placements[sel] : undefined;
      const clearSelection = placement?.blockId === blockId;
      return {
        musee: { ...s.musee, [blockId]: entry },
        blocks: {
          ...s.blocks,
          [blockId]: { ...block, lifecycle: "archived", updatedAt: now },
        },
        placements: clearDockFieldsForBlockId(s.placements, blockId),
        selectedPlacementId: clearSelection ? null : s.selectedPlacementId,
      };
    }),

  restoreFromHiddenStorage: (blockId) =>
    set((s) => {
      if (!(blockId in s.musee)) return s;
      const entry = s.musee[blockId];
      const block = s.blocks[blockId];
      const now = Date.now();
      const { [blockId]: _removed, ...musee } = s.musee;
      const channel = normalizeMuseeEntry(entry).channel;

      let placements = s.placements;
      const wild = getWildZone(s.worldDistrictZones);
      const bw = Math.min(
        PLACEMENT_WIDTH_MAX,
        Math.max(PLACEMENT_WIDTH_MIN, DEFAULT_BLOCK_PLACEMENT_WIDTH)
      );
      const bh = Math.min(
        PLACEMENT_HEIGHT_MAX,
        Math.max(PLACEMENT_HEIGHT_MIN, DEFAULT_BLOCK_PLACEMENT_HEIGHT)
      );
      const wildPos = {
        x: wild.x + wild.width / 2 - bw / 2,
        y: wild.y + wild.height / 2 - bh / 2,
      };

      if (channel === "musee" || channel === "archive") {
        const ids = Object.keys(placements).filter((pid) => placements[pid]!.blockId === blockId);
        if (ids.length === 0) {
          const placementId = nanoid();
          placements = {
            ...placements,
            [placementId]: {
              id: placementId,
              blockId,
              district: "wild",
              position: wildPos,
              ui: { width: bw, height: bh, variant: "raw" },
            },
          };
        } else {
          placements = { ...placements };
          for (const pid of ids) {
            const pl = placements[pid]!;
            placements[pid] = {
              ...pl,
              parentContainerId: undefined,
              gridIndex: undefined,
              district: "wild",
              position: wildPos,
              ui: {
                ...pl.ui,
                width: pl.ui?.width ?? bw,
                height: pl.ui?.height ?? bh,
                variant: "raw",
              },
            };
          }
        }
      }

      let blocks = s.blocks;
      if (block) {
        const tb = transformBlockForDistrict(
          { ...block, lifecycle: "developing", updatedAt: now },
          "wild"
        );
        blocks = { ...s.blocks, [blockId]: tb };
      }

      return { musee, blocks, placements };
    }),

  archiveToMusee: (blockId) => {
    get().sendToArchiveFromButton(blockId);
  },

  restoreMuseeFromArchive: (blockId) => {
    get().restoreFromHiddenStorage(blockId);
  },

  resetViewport: () => set({ viewport: { ...defaultViewport } }),

  frameAllPlacements: (canvasEl) => {
    const { width, height } = canvasEl.getBoundingClientRect();
    if (width < 8 || height < 8) return;
    const placements = get().placements;
    if (Object.keys(placements).length === 0) return;
    const next = computeViewportToFitPlacements(width, height, placements);
    if (
      !Number.isFinite(next.x) ||
      !Number.isFinite(next.y) ||
      !Number.isFinite(next.scale) ||
      next.scale <= 0
    ) {
      return;
    }
    const prev = get().viewport;
    if (viewportNearlyEqual(prev, next)) return;
    set({ viewport: next });
  },
}),
    {
      name: "epis-isle-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        viewport: s.viewport,
        blocks: s.blocks,
        placements: s.placements,
        musee: s.musee,
        viewMode: s.viewMode,
        focusRealm: s.focusRealm,
        focusLifecycle: s.focusLifecycle,
        aestheticsHubMode: s.aestheticsHubMode,
        downtownIgSlotCount: s.downtownIgSlotCount,
        blankCanvasBgUrl: s.blankCanvasBgUrl,
        blankCanvasBgOpacity: s.blankCanvasBgOpacity,
        blankCanvasBgBrightness: s.blankCanvasBgBrightness,
        downtownPanelWidthPercent: s.downtownPanelWidthPercent,
        downtownContentScale: s.downtownContentScale,
        downtownPanelCollapsed: s.downtownPanelCollapsed,
        canvasPosition: s.canvasPosition,
        downtownBlankScale: s.downtownBlankScale,
        worldDistrictZones: s.worldDistrictZones,
        projectTitle: s.projectTitle,
        identityBio: s.identityBio,
        identityStickerUrl: s.identityStickerUrl,
        identityLeaves: s.identityLeaves,
        identityCardCollapsed: s.identityCardCollapsed,
        blankStoryRings: s.blankStoryRings,
        plannerStoryRingUrls: s.plannerStoryRingUrls,
        downtownWorkspacePan: s.downtownWorkspacePan,
        downtownPlanFrames: s.downtownPlanFrames,
      }),
      /** 無存檔、解析失敗後若仍無 placement，寫入示範島（與舊版每次 mount 覆寫行為對齊） */
      onRehydrateStorage: () => () => {
        queueMicrotask(() => {
          const st = useStore.getState();
          if (Object.keys(st.placements).length === 0) {
            st.setWorld({ blocks: SEED_BLOCKS, placements: SEED_PLACEMENTS });
          }
          useStore.setState((s) => {
            const rings = s.blankStoryRings;
            let ringsChanged = false;
            const nextRings = rings.map((r, i) => {
              const { ringScale: _legacyScale, ...rest } = r as BlankStoryRing & { ringScale?: number };
              let nr: BlankStoryRing = { ...rest };
              if (!(typeof r.positionY === "number" && Number.isFinite(r.positionY))) {
                ringsChanged = true;
                nr.positionY = 48 + (i % 5) * 8;
              }
              const na = normalizeLeafAccent(r.accentBg);
              if (na !== r.accentBg) {
                ringsChanged = true;
                nr.accentBg = na;
              }
              const ls = normalizeBlankRingLabelShape(r.labelShape);
              if (ls !== r.labelShape || _legacyScale !== undefined) {
                ringsChanged = true;
                nr.labelShape = ls;
              }
              if (nr.text.length > BLANK_LABEL_TEXT_MAX) {
                ringsChanged = true;
                nr = { ...nr, text: nr.text.slice(0, BLANK_LABEL_TEXT_MAX) };
              }
              return nr;
            });

            const LEGACY_SLOT_PX = 120;
            const dockedGrids = new Set([DOWNTOWN_IG_CONTAINER_ID, DOWNTOWN_YT_CONTAINER_ID]);
            let placementsChanged = false;
            const nextPlacements = { ...s.placements };
            for (const id of Object.keys(nextPlacements)) {
              const p = nextPlacements[id];
              if (!p?.parentContainerId || !dockedGrids.has(p.parentContainerId)) continue;
              const w = p.ui?.width;
              const h = p.ui?.height;
              if (w === LEGACY_SLOT_PX && h === LEGACY_SLOT_PX) {
                nextPlacements[id] = {
                  ...p,
                  ui: { ...p.ui, width: DOWNTOWN_SLOT_PX, height: DOWNTOWN_SLOT_PX },
                };
                placementsChanged = true;
              }
            }

            const o = s.blankCanvasBgOpacity;
            const br = s.blankCanvasBgBrightness;
            const oClamped = Math.min(1, Math.max(0.04, Number.isFinite(o) ? o : 1));
            const brClamped = Math.min(1.35, Math.max(0.82, Number.isFinite(br) ? br : 1));
            const blankCanvasFix =
              oClamped !== o || brClamped !== br
                ? { blankCanvasBgOpacity: oClamped, blankCanvasBgBrightness: brClamped }
                : {};

            return {
              ...(ringsChanged ? { blankStoryRings: nextRings } : {}),
              ...(placementsChanged ? { placements: nextPlacements } : {}),
              ...blankCanvasFix,
            };
          });
        });
      },
    }
  )
);

export function clampViewportScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}
