import { motion } from "framer-motion";
import { Wand2 } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { generatePoeticWorldNames, normalizeMetaName } from "./auraWorldIdentity";
import { AURA_ISLAND_DEFAULT_NAMES } from "./auraWorldIslandTypes";
import type { AuraIslandId } from "./auraWorldIslandTypes";
import { useAuraWorldSelection } from "./auraWorldSelectionStore";

const ease = [0.22, 1, 0.36, 1] as const;

export function AuraWorldNamingModal() {
  const open = useAuraWorldSelection((s) => s.showNamingModal);
  const worldId = useAuraWorldSelection((s) => s.selectedWorldId);
  const entryFlowStage = useAuraWorldSelection((s) => s.entryFlowStage);
  const bumpPulse = useAuraWorldSelection((s) => s.bumpNamingEmissivePulse);
  const setOpen = useAuraWorldSelection((s) => s.setShowNamingModal);
  const setWorldMeta = useAuraWorldSelection((s) => s.setWorldMeta);
  const markGate = useAuraWorldSelection((s) => s.markNamingGateDone);
  const afterNamingCommitted = useAuraWorldSelection((s) => s.afterNamingCommitted);

  const uid = useId();
  const titleId = `aura-naming-${uid}`;

  const [salt, setSalt] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open && worldId) {
      setDraft("");
      setSalt(0);
    }
  }, [open, worldId]);

  useEffect(() => {
    if (worldId) setSuggestions(generatePoeticWorldNames(worldId, salt));
  }, [worldId, salt]);

  const regen = () => {
    if (!worldId) return;
    setSalt((s) => s + 1);
  };

  if (!open || !worldId) return null;

  const id = worldId as AuraIslandId;
  const defaultSeed = AURA_ISLAND_DEFAULT_NAMES[id];

  const onInput = (v: string) => {
    setDraft(v);
    if (v.length > 0) bumpPulse();
  };

  const pick = (label: string) => {
    setDraft(label);
    bumpPulse();
  };

  const finishNaming = () => {
    setOpen(false);
    setDraft("");
    if (entryFlowStage === "naming") afterNamingCommitted();
  };

  const onConfirm = () => {
    const name = normalizeMetaName(draft);
    if (name.length < 1) return;
    setWorldMeta(worldId, { name, isDefaultName: false });
    markGate(worldId);
    finishNaming();
  };

  const onKeepGentleDefault = () => {
    setWorldMeta(worldId, { name: defaultSeed, isDefaultName: true });
    markGate(worldId);
    finishNaming();
  };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="pointer-events-auto fixed inset-0 z-[85] flex items-center justify-center px-4 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42, ease }}
    >
      <div
        className="absolute inset-0 bg-[rgba(26,36,32,0.05)]"
        style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
        aria-hidden
      />
      <motion.div
        className="relative w-full max-w-md rounded-[28px] border border-white/[0.14] px-7 py-8 shadow-[0_32px_100px_-36px_rgba(44,60,54,0.45)]"
        style={{
          borderWidth: "0.5px",
          background: "linear-gradient(168deg, rgba(255,252,248,0.48) 0%, rgba(234,242,236,0.34) 100%)",
          backdropFilter: "blur(16px) saturate(1.08)",
          WebkitBackdropFilter: "blur(16px) saturate(1.08)",
        }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <h2
          id={titleId}
          className="text-center text-[21px] font-normal tracking-[0.03em]"
          style={{
            fontFamily: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
            color: "rgba(36,46,44,0.9)",
          }}
        >
          Name this world
        </h2>
        <p className="mt-2 text-center text-[12px] leading-relaxed" style={{ color: "rgba(72,82,78,0.5)" }}>
          title for the isle that holds you
        </p>

        <label className="mt-6 block">
          <span className="sr-only">World name</span>
          <input
            value={draft}
            onChange={(e) => onInput(e.target.value)}
            placeholder="Whisper a name…"
            className="w-full rounded-xl border border-white/[0.22] bg-white/[0.22] px-3.5 py-2.5 text-[13px] outline-none transition-[box-shadow,border-color] duration-300 placeholder:text-[rgba(92,102,98,0.35)] focus:border-white/[0.35] focus:shadow-[0_0_0_1px_rgba(255,255,255,0.22)]"
            style={{ color: "rgba(38,48,44,0.88)" }}
            autoComplete="off"
          />
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pick(s)}
              className="rounded-full border border-white/[0.14] bg-white/[0.1] px-3 py-1.5 text-[11px] font-medium transition-[background,transform] duration-200 hover:bg-white/[0.18]"
              style={{ color: "rgba(52,62,58,0.75)" }}
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={regen}
            title="Generate names"
            aria-label="Generate names"
            className="inline-flex size-9 items-center justify-center rounded-full border border-white/[0.16] text-[rgba(56,66,62,0.7)] transition-[background,transform] duration-200 hover:bg-white/[0.16]"
            style={{ borderWidth: "0.5px" }}
          >
            <Wand2 className="size-4" strokeWidth={1.65} aria-hidden />
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={normalizeMetaName(draft).length < 1}
            className="w-full rounded-xl border border-white/[0.12] bg-white/[0.18] py-2.5 text-[12px] font-medium transition-[opacity,filter] duration-200 enabled:hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-35"
            style={{ color: "rgba(42,52,48,0.82)" }}
          >
            Use this name
          </button>
          <button
            type="button"
            onClick={onKeepGentleDefault}
            className="bg-transparent text-[11px] font-medium transition-opacity duration-200 hover:opacity-75"
            style={{
              color: "rgba(78,88,84,0.52)",
              textDecoration: "underline",
              textDecorationThickness: "0.5px",
              textUnderlineOffset: "3px",
            }}
          >
            Keep the gentle default · {defaultSeed}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
