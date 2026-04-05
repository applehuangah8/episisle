/**
 * Downtown 與主畫布協調（利於後續佈局）
 * ─────────────────────────────────────
 *
 * **主畫布（WorldContainer）**
 * - 世界座標 placement；平移／縮放僅作用於 WorldContainer。
 * - Wild / Musée / Downtown「方塊」在此自由擺放（district 仍用 instagram｜youtube 等型別）。
 *
 * **右欄 Downtown（DOM）**
 * - 模式 aestheticsHubMode：instagram → IG 規劃格；youtube → YT 規劃格（與 IG 同槽位邏輯）；blank → 迷你畫布。
 * - 內容層使用 `downtownWorkspacePan` + `downtownContentScale` 做平移／縮放；IG／YT 規劃格另用 `downtownPlanFrames` 定位與寬度（與主畫布無關）。
 * - IG 格子以 `[data-epis-downtown-slot]` 存在於 DOM；拖放命中一律走 `igClientHit`（client 矩形）。
 *
 * **跨邊拖放**
 * - 畫布 → 格：`resolveIgSlotIndexForBlockDrop(blockEl, pointerX, pointerY, slotCount)`。
 * - 格 → 畫布：`clientToWorldFromCanvasElement` + `releasePlacementFromDowntown`。
 * - 博物館：`museePortalClientHit`（圖示在畫布 surface 右下，非世界座標）。
 *
 * **HUD**
 * - 僅覆蓋左欄畫布區（`absolute` 於 canvas 父層），避免遮住 Downtown 工具列。
 */

export const DOWNTOWN_COORDINATION_VERSION = 1;
