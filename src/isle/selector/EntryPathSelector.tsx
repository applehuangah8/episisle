import { motion } from "framer-motion";
import { Box, DoorOpen, Lock } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import "./isleSelector.css";

const ENTRY_MAIN_BG =
  "https://raw.githubusercontent.com/applehuangah8/episisle/refs/heads/main/mainbg.png";

export type EntryPathSelectorProps = {
  onChooseQuick: () => void;
  onChooseImmersive: () => void;
};

type SlotId = "left" | "center" | "right";
type RitualChoice = "quick" | "immersive";

const STAR_SEED: { left: string; top: string; s: number; da: number; db: number; dur: number; del: number }[] = [
  { left: "8%", top: "12%", s: 1.2, da: 0.12, db: 0.42, dur: 4.2, del: 0 },
  { left: "18%", top: "22%", s: 0.8, da: 0.18, db: 0.5, dur: 5.5, del: 0.3 },
  { left: "88%", top: "8%", s: 1.4, da: 0.15, db: 0.48, dur: 6, del: 0.1 },
  { left: "72%", top: "18%", s: 0.9, da: 0.1, db: 0.38, dur: 4.8, del: 0.6 },
  { left: "42%", top: "6%", s: 0.7, da: 0.2, db: 0.45, dur: 5.2, del: 0.2 },
  { left: "55%", top: "14%", s: 1.1, da: 0.14, db: 0.52, dur: 5.8, del: 0.9 },
  { left: "12%", top: "38%", s: 0.6, da: 0.16, db: 0.4, dur: 4.5, del: 1.1 },
  { left: "92%", top: "35%", s: 1, da: 0.11, db: 0.44, dur: 6.2, del: 0.4 },
  { left: "28%", top: "48%", s: 0.85, da: 0.17, db: 0.46, dur: 5.1, del: 0.7 },
  { left: "65%", top: "42%", s: 0.75, da: 0.13, db: 0.41, dur: 4.9, del: 1.3 },
  { left: "5%", top: "58%", s: 1.3, da: 0.09, db: 0.36, dur: 7, del: 0.2 },
  { left: "38%", top: "62%", s: 0.65, da: 0.19, db: 0.48, dur: 5.4, del: 0.5 },
  { left: "78%", top: "55%", s: 0.95, da: 0.12, db: 0.43, dur: 4.7, del: 1 },
  { left: "52%", top: "72%", s: 0.7, da: 0.15, db: 0.5, dur: 6.5, del: 0.8 },
  { left: "22%", top: "68%", s: 1.1, da: 0.1, db: 0.39, dur: 5.6, del: 1.4 },
  { left: "85%", top: "68%", s: 0.8, da: 0.18, db: 0.47, dur: 4.4, del: 0.15 },
  { left: "15%", top: "82%", s: 0.9, da: 0.14, db: 0.44, dur: 5.9, del: 0.65 },
  { left: "48%", top: "88%", s: 0.55, da: 0.16, db: 0.42, dur: 6.8, del: 1.2 },
  { left: "70%", top: "78%", s: 1.2, da: 0.11, db: 0.4, dur: 4.6, del: 0.25 },
  { left: "33%", top: "28%", s: 0.5, da: 0.2, db: 0.46, dur: 5.3, del: 1.5 },
  { left: "62%", top: "8%", s: 0.65, da: 0.13, db: 0.4, dur: 5.7, del: 0.55 },
  { left: "95%", top: "52%", s: 0.75, da: 0.15, db: 0.45, dur: 6.1, del: 0.85 },
  { left: "25%", top: "8%", s: 0.55, da: 0.17, db: 0.43, dur: 4.3, del: 1.15 },
  { left: "44%", top: "36%", s: 0.45, da: 0.14, db: 0.38, dur: 7.2, del: 0.05 },
];

const softSpring = { type: "spring" as const, stiffness: 48, damping: 20, mass: 1.08 };

function useEntryParallax(rootRef: React.RefObject<HTMLDivElement | null>) {
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const lerp = 0.058;
      current.current.x += (target.current.x - current.current.x) * lerp;
      current.current.y += (target.current.y - current.current.y) * lerp;
      const el = rootRef.current;
      if (el) {
        el.style.setProperty("--parallax-x", current.current.x.toFixed(4));
        el.style.setProperty("--parallax-y", current.current.y.toFixed(4));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rootRef]);

  const onPointerMove = useCallback((clientX: number, clientY: number) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    target.current.x = (clientX / w - 0.5) * 2;
    target.current.y = (clientY / h - 0.5) * 2;
  }, []);

  return { onPointerMove };
}

type EntryOptionCardProps = {
  slot: SlotId;
  near: boolean;
  ritualTarget: RitualChoice | null;
  titleLine: string;
  titleSub: string;
  hint: string;
  icon: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
};

function EntryOptionCard({
  slot,
  near,
  ritualTarget,
  titleLine,
  titleSub,
  hint,
  icon,
  onSelect,
  disabled,
  cardRef,
}: EntryOptionCardProps) {
  const isCenter = slot === "center";
  const isRitualThis =
    (ritualTarget === "quick" && slot === "center") || (ritualTarget === "immersive" && slot === "right");

  const baseScale = isCenter ? 1.04 : 0.96;
  const dim = isCenter ? 1 : 0.9;

  const floatDur = isCenter ? "5.8s" : slot === "left" ? "6.4s" : "5.2s";
  const floatDelay = slot === "left" ? "0s" : slot === "center" ? "0.35s" : "0.9s";

  return (
    <motion.div
      ref={cardRef}
      className={`relative flex flex-col items-stretch ${disabled ? "pointer-events-none" : "cursor-pointer"}`}
      style={{
        filter: isCenter ? "brightness(1.04)" : `brightness(${dim})`,
      }}
      animate={{
        scale: isRitualThis
          ? [baseScale, baseScale * 1.06, 1.22]
          : near && !disabled && !ritualTarget
            ? baseScale * 1.02
            : baseScale,
        boxShadow:
          near && !disabled && !ritualTarget
            ? "0 0 48px rgba(168, 221, 168, 0.12), 0 28px 64px rgba(8, 6, 18, 0.5)"
            : isCenter
              ? "0 0 36px rgba(200, 190, 220, 0.1), 0 22px 52px rgba(6, 4, 14, 0.48)"
              : "0 18px 48px rgba(6, 4, 14, 0.42)",
      }}
      transition={
        isRitualThis
          ? {
              scale: { duration: 0.88, times: [0, 0.28, 1], ease: [0.22, 0.1, 0.2, 1] },
            }
          : {
              scale: softSpring,
              boxShadow: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            }
      }
      whileHover={disabled || ritualTarget ? {} : { scale: baseScale * 1.02, transition: softSpring }}
      whileTap={disabled || ritualTarget ? {} : { scale: baseScale * 0.988 }}
      onClick={disabled ? undefined : onSelect}
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
      }
    >
      <div
        className="entry-path-card-float relative flex min-h-0 w-[min(30vw,220px)] flex-col overflow-hidden rounded-[1.15rem] border border-white/[0.065] md:w-[min(28vw,240px)]"
        style={
          {
            ["--float-dur" as string]: floatDur,
            ["--float-delay" as string]: floatDelay,
            background:
              "linear-gradient(168deg, rgba(40, 42, 54, 0.5) 0%, rgba(26, 28, 38, 0.68) 46%, rgba(20, 22, 32, 0.78) 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,252,255,0.045)",
            backdropFilter: "blur(16px) saturate(1.03)",
          } as CSSProperties
        }
      >
        <div
          className="entry-path-card-aspect relative flex aspect-video w-full flex-col items-center justify-center px-3 py-3"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 50% 30%, rgba(168, 221, 168, 0.08) 0%, transparent 55%), rgba(10, 12, 18, 0.35)",
          }}
        >
          <div
            className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06]"
            style={{
              background: "rgba(255,252,255,0.04)",
              color: disabled ? "rgba(200,198,210,0.35)" : "rgba(232,228,242,0.78)",
            }}
          >
            {icon}
          </div>
          <span
            className="text-center font-mono text-[0.7rem] font-medium uppercase tracking-[0.28em] text-white/45"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            {titleLine}
          </span>
          <span
            className="mt-1 text-center font-serif text-[0.95rem] font-normal tracking-wide md:text-[1.02rem]"
            style={{
              fontFamily: "var(--epis-font-district), Georgia, serif",
              color: disabled ? "rgba(200,198,210,0.42)" : "rgba(238, 232, 252, 0.9)",
              textShadow: "0 1px 18px rgba(120, 100, 160, 0.22)",
            }}
          >
            {titleSub}
          </span>
        </div>
        <div className="border-t border-white/[0.055] px-3 py-2.5" style={{ borderTopWidth: "0.5px" }}>
          <p className="text-center text-[10px] font-normal leading-snug tracking-[0.06em] text-white/36">{hint}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function EntryPathSelector({ onChooseQuick, onChooseImmersive }: EntryPathSelectorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { onPointerMove } = useEntryParallax(rootRef);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);

  const [nearSlot, setNearSlot] = useState<SlotId | null>(null);
  const [ritualTarget, setRitualTarget] = useState<RitualChoice | null>(null);
  const [ritualBackdrop, setRitualBackdrop] = useState(false);

  const runRitual = useCallback((choice: RitualChoice, onDone: () => void) => {
    setRitualTarget(choice);
    requestAnimationFrame(() => setRitualBackdrop(true));
    window.setTimeout(() => {
      onDone();
    }, 980);
  }, []);

  const handlePointer = useCallback(
    (e: React.PointerEvent) => {
      onPointerMove(e.clientX, e.clientY);
      const refs = [
        { id: "left" as const, el: leftRef.current },
        { id: "center" as const, el: centerRef.current },
        { id: "right" as const, el: rightRef.current },
      ];
      let best: SlotId | null = null;
      let bestD = 160;
      for (const { id, el } of refs) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(e.clientX - cx, e.clientY - cy);
        if (d < bestD) {
          bestD = d;
          best = id;
        }
      }
      setNearSlot(best);
    },
    [onPointerMove]
  );

  const stars = useMemo(() => STAR_SEED, []);

  return (
    <div
      ref={rootRef}
      className="isle-selector-root"
      onPointerMove={handlePointer}
      role="presentation"
      data-entry-path
    >
      <div className="isle-sel-bg-photo" aria-hidden>
        <img
          src={ENTRY_MAIN_BG}
          alt=""
          className="isle-sel-bg-img"
          draggable={false}
          decoding="async"
        />
      </div>
      <div className="isle-sel-bg-scrim" aria-hidden />

      <div className="isle-sel-stars" aria-hidden>
        {stars.map((s, i) => {
          const st: CSSProperties = {
            left: s.left,
            top: s.top,
            width: s.s,
            height: s.s,
            ["--tw-a" as string]: s.da,
            ["--tw-b" as string]: s.db,
            ["--tw-dur" as string]: `${s.dur}s`,
            ["--tw-delay" as string]: `${s.del}s`,
          };
          return <span key={i} className="isle-sel-star" style={st} />;
        })}
      </div>

      <div className="isle-sel-clouds" aria-hidden>
        <div
          className="isle-sel-cloud"
          style={
            {
              width: "55%",
              height: "28%",
              left: "-10%",
              top: "12%",
              ["--drift-dur" as string]: "95s",
            } as CSSProperties
          }
        />
        <div
          className="isle-sel-cloud"
          style={
            {
              width: "42%",
              height: "22%",
              right: "-6%",
              top: "22%",
              ["--drift-dur" as string]: "120s",
              ["--drift-x0" as string]: "6%",
              ["--drift-x1" as string]: "-6%",
            } as CSSProperties
          }
        />
        <div
          className="isle-sel-cloud"
          style={
            {
              width: "48%",
              height: "24%",
              left: "20%",
              bottom: "8%",
              ["--drift-dur" as string]: "110s",
            } as CSSProperties
          }
        />
        <div
          className="isle-sel-cloud"
          style={
            {
              width: "36%",
              height: "20%",
              left: "40%",
              top: "55%",
              ["--drift-dur" as string]: "140s",
              ["--drift-x0" as string]: "-4%",
              ["--drift-x1" as string]: "4%",
            } as CSSProperties
          }
        />
      </div>

      <div className="isle-sel-islands-layer">
        <div className="entry-path-glass-panel w-full max-w-[920px] px-[clamp(1.1rem,4.2vw,2.1rem)] py-[clamp(1.9rem,4.8vh,2.85rem)]">
          <div className="flex w-full flex-row flex-wrap items-stretch justify-center gap-[clamp(0.65rem,2.5vw,1.35rem)] md:flex-nowrap md:gap-[clamp(0.85rem,3vw,1.75rem)]">
            <EntryOptionCard
              slot="left"
              near={nearSlot === "left"}
              ritualTarget={ritualTarget}
              titleLine="locked"
              titleSub="未知"
              hint="尚未解鎖"
              icon={<Lock className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden />}
              onSelect={() => {}}
              disabled
              cardRef={(el) => {
                leftRef.current = el;
              }}
            />
            <EntryOptionCard
              slot="center"
              near={nearSlot === "center"}
              ritualTarget={ritualTarget}
              titleLine="quick"
              titleSub="傳送門"
              hint="瞬時傳送"
              icon={<DoorOpen className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden />}
              onSelect={() => runRitual("quick", onChooseQuick)}
              cardRef={(el) => {
                centerRef.current = el;
              }}
            />
            <EntryOptionCard
              slot="right"
              near={nearSlot === "right"}
              ritualTarget={ritualTarget}
              titleLine="immersive"
              titleSub="時空沙盒"
              hint="秘境探索"
              icon={<Box className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden />}
              onSelect={() => runRitual("immersive", onChooseImmersive)}
              cardRef={(el) => {
                rightRef.current = el;
              }}
            />
          </div>
        </div>
      </div>

      <motion.footer
        className="entry-path-caption pointer-events-none absolute left-0 right-0 z-20 flex justify-center px-[clamp(1rem,3vw,1.5rem)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="entry-path-caption-stack text-center">
          <h1
            className="entry-path-title font-serif text-[clamp(1.4rem,3.7vw,1.88rem)] font-normal leading-snug tracking-[0.04em]"
            style={{ fontFamily: "var(--epis-font-district), Georgia, serif" }}
          >
            <span className="entry-path-title-wrap">
              <span className="entry-path-title-core">Start your journey</span>
            </span>
          </h1>
          <div className="entry-path-caption-rule" aria-hidden />
          <p
            className="m-0 text-[11px] font-light leading-relaxed tracking-[0.22em] text-[rgba(245,242,252,0.58)]"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.35)" }}
          >
            選擇進入方式
          </p>
        </div>
      </motion.footer>

      <motion.div
        className="pointer-events-none absolute inset-0 z-40"
        initial={false}
        animate={{
          opacity: ritualBackdrop ? 1 : 0,
          backdropFilter: ritualBackdrop ? "blur(12px)" : "blur(0px)",
        }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        style={{ backgroundColor: "rgba(6, 8, 14, 0.46)" }}
        aria-hidden
      />
    </div>
  );
}

/** @deprecated use EntryPathSelector */
export const IsleSelector = EntryPathSelector;
/** @deprecated use EntryPathSelectorProps */
export type IsleSelectorProps = EntryPathSelectorProps;
