import { CANVAS_WORLD_GRID, WORLD_INFINITE_HALF_EXTENT_PX } from "@/canvas/districtLayout";
import { useStore } from "@/store/useStore";

/**
 * 主畫布世界底層：極大原野底色 + 滿版淡網格（隨 WorldContainer 變換），原野無矩形裁切邊界。
 * 空白規劃模式時不顯示格線，避免與右欄白紙區視覺重疊、干擾。
 */
export function WorldCanvasBackground() {
  const hideGrid = useStore((s) => s.aestheticsHubMode === "blank");
  const g = CANVAS_WORLD_GRID;
  const huge = WORLD_INFINITE_HALF_EXTENT_PX * 2;
  const hugeOrigin = -WORLD_INFINITE_HALF_EXTENT_PX;

  return (
    <div className="pointer-events-none absolute left-0 top-0 z-0" aria-hidden>
      <div
        className="absolute"
        style={{
          left: hugeOrigin,
          top: hugeOrigin,
          width: huge,
          height: huge,
          zIndex: 0,
          background: `
            radial-gradient(ellipse 55% 45% at 28% 22%, rgba(210, 204, 228, 0.42) 0%, transparent 58%),
            radial-gradient(ellipse 50% 40% at 72% 68%, rgba(189, 204, 201, 0.32) 0%, transparent 55%),
            linear-gradient(168deg, rgba(232, 238, 246, 0.55) 0%, rgba(238, 242, 248, 0.38) 38%, rgba(245, 247, 249, 0.28) 100%)
          `,
        }}
      />
      {hideGrid ? null : (
        <div
          className="absolute opacity-[0.22]"
          style={{
            left: hugeOrigin,
            top: hugeOrigin,
            width: huge,
            height: huge,
            zIndex: 1,
            backgroundImage: `
            linear-gradient(var(--color-grid) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-grid) 1px, transparent 1px)
          `,
            backgroundSize: `${g}px ${g}px`,
            backgroundPosition: "0 0",
          }}
        />
      )}
    </div>
  );
}
