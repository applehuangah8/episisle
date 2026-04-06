import { AnimatePresence, motion } from "framer-motion";
import { Eraser } from "lucide-react";
import { useId, useState } from "react";

import { getResolvedAuraIslandDisplayName } from "./auraIslandMetadata";
import type { AuraIslandId } from "./auraWorldIslandTypes";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

const ease = [0.22, 1, 0.36, 1] as const;

export type InWorldClearIslandButtonVariant = "aura" | "focus";

/**
 * Icon-only control: wipe **current entered island** data after explicit confirm.
 */
export function InWorldClearIslandButton({ variant }: { variant: InWorldClearIslandButtonVariant }) {
  const worldId = useAuraWorldSelection((s) => s.selectedWorldId);
  const isEntered = useAuraWorldSelection((s) => s.isEntered);
  const entryReady = useAuraWorldSelection((s) => s.entryFlowStage === "ready");
  const clearData = useAuraWorldSelection((s) => s.clearEnteredIslandUserData);
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descId = useId();

  if (!isEntered || !entryReady || !worldId) return null;

  const islandId = worldId as AuraIslandId;
  const label = getResolvedAuraIslandDisplayName(islandId);

  const onConfirm = () => {
    clearData();
    setOpen(false);
  };

  const iconBtnCls =
    variant === "aura"
      ? "rounded-lg p-1.5 opacity-70 transition-[opacity,background] duration-200 hover:bg-white/[0.12] hover:opacity-90"
      : "rounded-full p-2 text-[rgba(48,56,54,0.68)] transition-[background,opacity] duration-200 hover:bg-white/[0.18]";

  const iconBtnStyle =
    variant === "aura" ? { color: "rgba(62,72,68,0.65)" } : undefined;

  return (
    <>
      <button
        type="button"
        title="淨空島嶼"
        aria-label="淨空島嶼"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={iconBtnCls}
        style={iconBtnStyle}
      >
        <Eraser className="size-4" strokeWidth={1.65} aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="pointer-events-auto fixed inset-0 z-[86] flex items-center justify-center px-5 py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease }}
          >
            <button
              type="button"
              aria-label="關閉"
              className="absolute inset-0 bg-[rgba(18,24,22,0.12)]"
              style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="relative w-full max-w-[24rem] rounded-[20px] border border-white/[0.14] px-6 py-7 shadow-[0_28px_80px_-28px_rgba(44,58,52,0.38)]"
              style={{
                borderWidth: "0.5px",
                background: "linear-gradient(172deg, rgba(255,252,248,0.54) 0%, rgba(236,242,236,0.36) 100%)",
                backdropFilter: "blur(18px) saturate(1.06)",
                WebkitBackdropFilter: "blur(18px) saturate(1.06)",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.36, ease }}
            >
              <h2
                id={titleId}
                className="text-center text-[16px] font-normal tracking-wide"
                style={{
                  fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                  color: "rgba(28,36,34,0.92)",
                }}
              >
                淨空「{label}」？
              </h2>
              <p
                id={descId}
                className="mt-4 text-[11px] leading-relaxed"
                style={{ color: "rgba(72,82,78,0.72)" }}
              >
                將刪除此島的名稱與模式紀錄、圖鑑典藏，以及專注模式下的專案資料。僅影響目前這座島，其他島不會變動。完成後需重新選擇模式與命名。此操作無法復原。
              </p>
              <div className="mt-7 flex justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[12px] font-medium transition-opacity duration-200 hover:opacity-80"
                  style={{ color: "rgba(52,62,58,0.62)" }}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="rounded-lg border border-[rgba(138,80,80,0.35)] bg-[rgba(255,248,246,0.55)] px-4 py-2 text-[12px] font-semibold transition-[background,filter] duration-200 hover:brightness-[0.97]"
                  style={{ color: "rgba(110,52,52,0.92)" }}
                >
                  確認淨空
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
