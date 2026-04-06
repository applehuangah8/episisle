import { motion } from "framer-motion";

import { getResolvedAuraIslandDisplayName } from "./auraIslandMetadata";
import type { AuraIslandId } from "./auraWorldIslandTypes";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

const ease = [0.22, 1, 0.36, 1] as const;

/** 登島後：選擇 Aura 或 Focus，再進入命名。 */
export function AuraWorldModePickPanel() {
  const stage = useAuraWorldSelection((s) => s.entryFlowStage);
  const worldId = useAuraWorldSelection((s) => s.selectedWorldId);
  const choose = useAuraWorldSelection((s) => s.chooseEntryMode);
  const reset = useAuraWorldSelection((s) => s.resetWorldEntry);
  useAuraWorldSelection((s) => s.worldMetaById);

  if (stage !== "chooseMode" || !worldId) return null;

  const id = worldId as AuraIslandId;
  const hint = getResolvedAuraIslandDisplayName(id);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="選擇體驗方式"
      className="pointer-events-auto fixed inset-0 z-[82] flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      <div
        className="absolute inset-0 bg-[rgba(22,32,28,0.07)]"
        style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        aria-hidden
      />
      <motion.div
        className="relative w-full max-w-[26rem] rounded-[22px] border border-white/[0.16] px-7 py-9 shadow-[0_28px_90px_-34px_rgba(44,58,52,0.42)]"
        style={{
          borderWidth: "0.5px",
          background: "linear-gradient(172deg, rgba(255,252,248,0.5) 0%, rgba(236,242,236,0.34) 100%)",
          backdropFilter: "blur(18px) saturate(1.08)",
          WebkitBackdropFilter: "blur(18px) saturate(1.08)",
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, ease }}
      >
        <p
          className="text-center text-[10px] font-medium tracking-[0.35em]"
          style={{ color: "#426885", opacity: 0.85 }}
        >
          {hint}
        </p>
        <p
          className="mt-5 text-center text-[17px] font-normal leading-snug tracking-[0.04em]"
          style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            color: "rgba(28,36,34,0.92)",
          }}
        >
          以何種方式停留？
        </p>

        <div className="mt-9 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => choose("aura")}
            className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-[rgba(66,104,133,0.18)] bg-white/[0.08] px-4 py-5 text-center transition-[background,box-shadow,border-color] duration-200 hover:bg-white/[0.16] hover:shadow-[0_12px_40px_-24px_rgba(66,104,133,0.25)]"
            style={{ borderWidth: "0.5px" }}
          >
            <span
              className="block text-[20px] font-normal leading-none tracking-[0.06em]"
              style={{
                fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
                color: "#426885",
              }}
            >
              Aura
            </span>
            <span className="mt-2.5 text-[9px] font-normal tracking-[0.14em] text-[rgba(78,88,84,0.48)]">
              圖鑑收藏
            </span>
          </button>

          <button
            type="button"
            onClick={() => choose("focus")}
            className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/[0.18] bg-white/[0.06] px-4 py-5 text-center transition-[background,box-shadow,border-color] duration-200 hover:bg-white/[0.14] hover:shadow-[0_12px_40px_-24px_rgba(42,52,48,0.18)]"
            style={{ borderWidth: "0.5px" }}
          >
            <span
              className="block text-[20px] font-normal leading-none tracking-[0.12em]"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                color: "#87A7B9",
              }}
            >
              Focus
            </span>
            <span className="mt-2.5 text-[9px] font-normal tracking-[0.14em] text-[rgba(78,88,84,0.48)]">
              專注規劃
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-8 w-full bg-transparent text-center text-[10px] font-medium tracking-wide opacity-55 transition-opacity duration-200 hover:opacity-90"
          style={{
            color: "rgba(68,76,72,0.65)",
            textDecoration: "underline",
            textDecorationThickness: "0.5px",
            textUnderlineOffset: "3px",
          }}
        >
          返回選島
        </button>
      </motion.div>
    </motion.div>
  );
}
