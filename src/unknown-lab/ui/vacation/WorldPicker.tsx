import { motion } from "framer-motion";

import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";

const fade = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

export function WorldPicker() {
  const open = useUnknownLabStore((s) => s.worldPickerOpen);
  const close = useUnknownLabStore((s) => s.closeWorldPicker);
  const setVacationScene = useUnknownLabStore((s) => s.setVacationScene);

  if (!open) return null;

  const pick = (id: "v1" | "v2" | "v3") => {
    setVacationScene(id);
    close();
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[90000] flex items-center justify-center p-5">
      <motion.div
        className="pointer-events-auto absolute inset-0 bg-black/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
        onClick={close}
      />
      <motion.div
        className="pointer-events-auto unknownGlassPanel w-[min(760px,calc(100vw-2rem))] p-4"
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.985, y: 10 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--unknown-text-muted)]">
              Unknown
            </div>
            <div className="mt-1 text-[13px] font-medium text-[var(--unknown-text)]">選擇一個世界（可隨時再換）</div>
          </div>
          <button
            type="button"
            className="rounded-full border border-[var(--unknown-stroke)] px-3 py-1 text-[11px] text-[var(--unknown-text)] hover:bg-black/5"
            onClick={close}
          >
            稍後
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button type="button" className="unknownWorldCard" onClick={() => pick("v1")}>
            <div className="unknownWorldThumb unknownWorldThumb--v1" />
            <div className="mt-2 flex items-center justify-between">
              <span className="unknownMicroLabel">室內桌</span>
              <span className="unknownMicroHint">V1</span>
            </div>
          </button>
          <button type="button" className="unknownWorldCard" onClick={() => pick("v2")}>
            <div className="unknownWorldThumb unknownWorldThumb--v2" />
            <div className="mt-2 flex items-center justify-between">
              <span className="unknownMicroLabel">花園</span>
              <span className="unknownMicroHint">V2</span>
            </div>
          </button>
          <button type="button" className="unknownWorldCard" onClick={() => pick("v3")}>
            <div className="unknownWorldThumb unknownWorldThumb--v3" />
            <div className="mt-2 flex items-center justify-between">
              <span className="unknownMicroLabel">海島</span>
              <span className="unknownMicroHint">V3</span>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

