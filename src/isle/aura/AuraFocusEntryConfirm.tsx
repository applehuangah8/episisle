import { motion } from "framer-motion";

import { getResolvedAuraIslandDisplayName } from "./auraIslandMetadata";
import type { AuraIslandId } from "./auraWorldIslandTypes";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

const ease = [0.22, 1, 0.36, 1] as const;
const NAME_COLOR = "#426885";

function TextLink({
  children,
  onClick,
  autoFocus,
  bold,
}: {
  children: React.ReactNode;
  onClick: () => void;
  autoFocus?: boolean;
  bold?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      autoFocus={autoFocus}
      className={`group relative bg-transparent pb-0.5 text-[12px] transition-colors duration-300 ${bold ? "font-semibold" : "font-medium"}`}
      style={{ color: "rgba(48,58,64,0.78)" }}
    >
      <span className="relative inline-block">
        {children}
        <span className="pointer-events-none absolute bottom-0 left-0 block h-px w-full origin-center scale-x-[0.32] bg-current opacity-50 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-hover:opacity-90" />
      </span>
    </button>
  );
}

/** 準備進入 in-world Focus — 命名完成後，或從探索切換時。 */
export function AuraFocusEntryConfirm() {
  const open = useAuraWorldSelection((s) => s.showFocusEntryConfirm);
  const worldId = useAuraWorldSelection((s) => s.selectedWorldId);
  const entryFlowStage = useAuraWorldSelection((s) => s.entryFlowStage);
  const setOpen = useAuraWorldSelection((s) => s.setShowFocusEntryConfirm);
  const setFocusChrome = useAuraWorldSelection((s) => s.setFocusChromeExpanded);
  const setMode = useAuraWorldSelection((s) => s.setInWorldViewMode);
  const completeFocusGateEntry = useAuraWorldSelection((s) => s.completeFocusGateEntry);
  const cancelFocusGateEntry = useAuraWorldSelection((s) => s.cancelFocusGateEntry);

  if (!open || !worldId) return null;

  const islandId = worldId as AuraIslandId;
  const name = getResolvedAuraIslandDisplayName(islandId);
  const isFocusGate = entryFlowStage === "focusGate";

  const onConfirm = () => {
    if (isFocusGate) {
      completeFocusGateEntry();
    } else {
      if (worldId) {
        useAuraWorldSelection.getState().setWorldMeta(worldId, { lastInWorldMode: "focus" });
      }
      setOpen(false);
      setFocusChrome(false);
      setMode("focus");
    }
  };

  const onCancel = () => {
    if (isFocusGate) {
      cancelFocusGateEntry();
    } else {
      setOpen(false);
    }
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="aura-focus-confirm-title"
      className="pointer-events-auto fixed inset-0 z-[80] flex items-center justify-center px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.38, ease }}
    >
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-[rgba(24,34,30,0.06)]"
        style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        onClick={onCancel}
      />
      <motion.div
        className="relative w-full max-w-[min(24rem,calc(100vw-2rem))] rounded-[22px] border border-white/[0.15] px-7 py-8 shadow-[0_26px_88px_-30px_rgba(42,56,50,0.38)]"
        style={{
          borderWidth: "0.5px",
          background: "linear-gradient(168deg, rgba(255,252,248,0.46) 0%, rgba(236,244,238,0.32) 100%)",
          backdropFilter: "blur(18px) saturate(1.06)",
          WebkitBackdropFilter: "blur(18px) saturate(1.06)",
        }}
        initial={{ opacity: 0, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.46, ease }}
      >
        <h2
          id="aura-focus-confirm-title"
          className="text-center text-[18px] font-normal leading-tight tracking-[0.06em]"
          style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            color: "rgba(36,46,44,0.9)",
          }}
        >
          準備進入?
        </h2>
        <p
          className="mt-6 text-center text-[20px] font-normal leading-snug tracking-[0.06em]"
          style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            color: NAME_COLOR,
          }}
        >
          {name}
        </p>
        {!isFocusGate ? (
          <p
            className="mx-auto mt-5 max-w-sm text-center text-[11px] leading-relaxed"
            style={{ color: "rgba(68,78,74,0.46)" }}
          >
            確認後進入專注畫布；可從左下選單回到 Aura 或返回選島。
          </p>
        ) : null}
        <div className="mt-8 flex items-center justify-center gap-10">
          <TextLink onClick={onConfirm} autoFocus bold>
            Confirm
          </TextLink>
          <TextLink onClick={onCancel}>Cancel</TextLink>
        </div>
      </motion.div>
    </motion.div>
  );
}
