import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import "./isleSelector.css";

export type IsleSelectorProps = {
  onChooseFocus: () => void;
  onChooseAura: () => void;
};

type SlotId = "left" | "center" | "right";

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

function useSelectorParallax(rootRef: React.RefObject<HTMLDivElement | null>) {
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

type SelectableIslandProps = {
  slot: SlotId;
  near: boolean;
  ritualTarget: "focus" | "aura" | null;
  title: string;
  subtitle: string;
  onSelect: () => void;
  disabled?: boolean;
  islandRef: (el: HTMLDivElement | null) => void;
};

function SelectableIsland({
  slot,
  near,
  ritualTarget,
  title,
  subtitle,
  onSelect,
  disabled,
  islandRef,
}: SelectableIslandProps) {
  const isCenter = slot === "center";
  const isRitualThis =
    (ritualTarget === "focus" && slot === "center") || (ritualTarget === "aura" && slot === "right");

  const baseScale = isCenter ? 1.08 : 0.93;
  const dim = isCenter ? 1 : 0.86;

  const floatDur = isCenter ? "5.8s" : slot === "left" ? "6.4s" : "5.2s";
  const floatDelay = slot === "left" ? "0s" : slot === "center" ? "0.35s" : "0.9s";

  return (
    <motion.div
      ref={islandRef}
      className={`relative flex flex-col items-center ${disabled ? "pointer-events-none" : "cursor-pointer"}`}
      style={{
        filter: isCenter ? "brightness(1.06)" : `brightness(${dim})`,
      }}
      animate={{
        scale: isRitualThis
          ? [baseScale, baseScale * 1.08, 1.36]
          : near && !disabled && !ritualTarget
            ? baseScale * 1.025
            : baseScale,
        boxShadow:
          near && !disabled && !ritualTarget
            ? "0 0 52px rgba(188, 176, 220, 0.24), 0 32px 72px rgba(8, 6, 18, 0.48)"
            : isCenter
              ? "0 0 40px rgba(168, 152, 198, 0.16), 0 26px 60px rgba(6, 4, 14, 0.52)"
              : "0 20px 52px rgba(6, 4, 14, 0.44)",
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
      whileHover={disabled || ritualTarget ? {} : { scale: baseScale * 1.035, transition: softSpring }}
      whileTap={disabled || ritualTarget ? {} : { scale: baseScale * 0.985 }}
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
        className="isle-sel-island-float relative flex min-h-[120px] w-[min(28vw,200px)] flex-col items-center justify-end rounded-[20px] border border-white/[0.06] px-4 pb-5 pt-8 md:min-h-[140px] md:w-[min(26vw,220px)]"
        style={
          {
            ["--float-dur" as string]: floatDur,
            ["--float-delay" as string]: floatDelay,
            background:
              "linear-gradient(168deg, rgba(42, 38, 58, 0.75) 0%, rgba(28, 26, 42, 0.9) 50%, rgba(22, 20, 34, 0.94) 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,252,255,0.06)",
          } as CSSProperties
        }
      >
        <div
          className="pointer-events-none absolute inset-x-4 top-4 h-[42%] rounded-2xl opacity-40"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(200, 190, 230, 0.22) 0%, transparent 65%)",
          }}
        />
        <span
          className="relative text-center font-serif text-[0.95rem] font-normal tracking-wide md:text-[1.05rem]"
          style={{
            fontFamily: "var(--epis-font-district), Georgia, serif",
            color: "rgba(238, 232, 252, 0.9)",
            textShadow: "0 1px 20px rgba(120, 100, 160, 0.28)",
          }}
        >
          {title}
        </span>
        <span className="relative mt-2 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/34">
          {subtitle}
        </span>
      </div>
    </motion.div>
  );
}

export function IsleSelector({ onChooseFocus, onChooseAura }: IsleSelectorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { onPointerMove } = useSelectorParallax(rootRef);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);

  const [nearSlot, setNearSlot] = useState<SlotId | null>(null);
  const [ritualTarget, setRitualTarget] = useState<"focus" | "aura" | null>(null);
  const [ritualBackdrop, setRitualBackdrop] = useState(false);

  const runRitual = useCallback((choice: "focus" | "aura", onDone: () => void) => {
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
      let bestD = 145;
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
      data-isle-selector
    >
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
        <div className="flex w-full max-w-[1100px] flex-row items-end justify-center gap-[clamp(0.75rem,3vw,2rem)] md:gap-[clamp(1rem,4vw,3rem)]">
          <SelectableIsland
            slot="left"
            near={nearSlot === "left"}
            ritualTarget={ritualTarget}
            title="靜域"
            subtitle="佔位 · 尚未啟航"
            onSelect={() => {}}
            disabled
            islandRef={(el) => {
              leftRef.current = el;
            }}
          />
          <SelectableIsland
            slot="center"
            near={nearSlot === "center"}
            ritualTarget={ritualTarget}
            title="Focus"
            subtitle="Isle A · 工作與整理"
            onSelect={() => runRitual("focus", onChooseFocus)}
            islandRef={(el) => {
              centerRef.current = el;
            }}
          />
          <SelectableIsland
            slot="right"
            near={nearSlot === "right"}
            ritualTarget={ritualTarget}
            title="Aura"
            subtitle="Isle B · 療癒與創造"
            onSelect={() => runRitual("aura", onChooseAura)}
            islandRef={(el) => {
              rightRef.current = el;
            }}
          />
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute bottom-[clamp(1.25rem,4vh,2.5rem)] left-0 right-0 z-30 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[11px] font-normal uppercase tracking-[0.42em] text-white/28">Choose your space</p>
        <p className="mt-1.5 text-[12px] font-light tracking-wide text-white/22">選擇你要進入的空間</p>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-0 z-40"
        initial={false}
        animate={{
          opacity: ritualBackdrop ? 1 : 0,
          backdropFilter: ritualBackdrop ? "blur(12px)" : "blur(0px)",
        }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        style={{ backgroundColor: "rgba(6, 8, 14, 0.42)" }}
        aria-hidden
      />
    </div>
  );
}
