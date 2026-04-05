import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  hexToHsv,
  hsvToHex,
  isPresetLeafAccent,
  normalizeLeafAccent,
  type Hsv,
} from "@/core/accentColor";
import { IDENTITY_LEAF_BG_PALETTE } from "@/core/types";

const INK = "#3A3F47";

function defaultHsv(): Hsv {
  return { h: 200, s: 0.12, v: 0.92 };
}

type AccentColorPickerPanelProps = {
  value: string;
  onSelect: (hex: string) => void;
  /** 較淺的紙感背景（圈圈用） */
  variant?: "card" | "paper";
};

/**
 * 預設五色 + 飽和度／明度版面 + 色相條 + hex 輸入（葉片、空白圈圈共用）。
 */
export function AccentColorPickerPanel({
  value,
  onSelect,
  variant = "card",
}: AccentColorPickerPanelProps) {
  const normalized = useMemo(() => normalizeLeafAccent(value), [value]);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(normalized) ?? defaultHsv());
  const [hexDraft, setHexDraft] = useState(normalized);

  useEffect(() => {
    const n = normalizeLeafAccent(value);
    setHexDraft(n);
    const parsed = hexToHsv(n);
    if (parsed) setHsv(parsed);
  }, [value]);

  const customHex = useMemo(() => hsvToHex(hsv.h, hsv.s, hsv.v), [hsv]);

  const applyHex = useCallback(
    (raw: string) => {
      const t = raw.trim().startsWith("#") ? raw.trim() : `#${raw.trim()}`;
      const n = normalizeLeafAccent(t);
      onSelect(n);
      setHexDraft(n);
      const p = hexToHsv(n);
      if (p) setHsv(p);
    },
    [onSelect]
  );

  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const pickSv = useCallback((clientX: number, clientY: number) => {
    const el = svRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const s = clamp01((clientX - r.left) / r.width);
    const v = clamp01(1 - (clientY - r.top) / r.height);
    setHsv((prev) => {
      const next = { ...prev, s, v };
      const hx = hsvToHex(next.h, next.s, next.v);
      setHexDraft(hx);
      onSelect(hx);
      return next;
    });
  }, [onSelect]);

  const pickHue = useCallback(
    (clientX: number) => {
      const el = hueRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const h = clamp01((clientX - r.left) / r.width) * 360;
      setHsv((prev) => {
        const next = { ...prev, h };
        const hx = hsvToHex(next.h, next.s, next.v);
        setHexDraft(hx);
        onSelect(hx);
        return next;
      });
    },
    [onSelect]
  );

  const onSvPointer = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.button !== 0) return;
      const el = svRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      pickSv(e.clientX, e.clientY);
      const onMove = (ev: PointerEvent) => pickSv(ev.clientX, ev.clientY);
      const onUp = (ev: PointerEvent) => {
        el.releasePointerCapture(ev.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [pickSv]
  );

  const onHuePointer = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.button !== 0) return;
      const el = hueRef.current;
      if (!el) return;
      el.setPointerCapture(e.pointerId);
      pickHue(e.clientX);
      const onMove = (ev: PointerEvent) => pickHue(ev.clientX);
      const onUp = (ev: PointerEvent) => {
        el.releasePointerCapture(ev.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [pickHue]
  );

  const panelBg =
    variant === "paper"
      ? "bg-white/[0.96]"
      : "bg-white/[0.98]";

  return (
    <div className={`min-w-[11.5rem] max-w-[14rem] ${panelBg}`}>
      <p
        className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.22em] opacity-45"
        style={{ color: INK }}
      >
        預設
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {IDENTITY_LEAF_BG_PALETTE.map((c) => {
          const on = normalized === c;
          return (
            <button
              key={c}
              type="button"
              role="option"
              aria-selected={on}
              title={c}
              aria-label={`底色 ${c}`}
              className="h-[18px] w-[18px] shrink-0 rounded-full transition-opacity hover:opacity-95"
              style={{
                backgroundColor: c,
                boxShadow: on
                  ? `0 0 0 1.5px ${INK}, 0 0 0 3px rgba(58,63,71,0.07)`
                  : "0 0 0 1px rgba(58,63,71,0.14)",
              }}
              onClick={(ev) => {
                ev.stopPropagation();
                onSelect(c);
                setHexDraft(c);
                const p = hexToHsv(c);
                if (p) setHsv(p);
              }}
            />
          );
        })}
      </div>

      <div className="my-2.5 h-px bg-[rgba(58,63,71,0.1)]" />

      <p
        className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.22em] opacity-45"
        style={{ color: INK }}
      >
        光譜
      </p>

      <div
        ref={svRef}
        role="presentation"
        aria-label="飽和度與明暗"
        className="relative mb-2 h-[5.5rem] w-full cursor-crosshair touch-none overflow-hidden rounded-lg border border-[rgba(58,63,71,0.12)]"
        style={{ borderWidth: "0.5px" }}
        onPointerDown={onSvPointer}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: `
              linear-gradient(to bottom, transparent, #000),
              linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))
            `,
          }}
        />
        <div
          className="pointer-events-none absolute h-2.5 w-2.5 rounded-full border-2 border-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.25)]"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      <div
        ref={hueRef}
        role="slider"
        aria-valuenow={Math.round(hsv.h)}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-label="色相"
        className="relative mb-2 h-2.5 w-full cursor-pointer touch-none rounded-full border border-[rgba(58,63,71,0.12)]"
        style={{
          borderWidth: "0.5px",
          background:
            "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
        }}
        onPointerDown={onHuePointer}
      >
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white bg-white/90 shadow-sm"
          style={{ left: `${(hsv.h / 360) * 100}%`, boxShadow: "0 0 0 0.5px rgba(0,0,0,0.2)" }}
        />
      </div>

      <label className="flex items-center gap-1.5">
        <span className="shrink-0 text-[9px] font-medium tabular-nums opacity-55" style={{ color: INK }}>
          HEX
        </span>
        <input
          type="text"
          value={hexDraft}
          spellCheck={false}
          maxLength={7}
          className="min-w-0 flex-1 rounded-md border border-[rgba(58,63,71,0.15)] bg-white/80 px-1.5 py-0.5 font-mono text-[10px] outline-none focus:border-[rgba(58,63,71,0.35)]"
          style={{ color: INK }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => setHexDraft(e.target.value.toUpperCase())}
          onBlur={() => applyHex(hexDraft)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyHex(hexDraft);
            }
          }}
        />
        <span
          className="h-5 w-5 shrink-0 rounded-md border border-[rgba(58,63,71,0.15)]"
          style={{ backgroundColor: customHex }}
          aria-hidden
        />
      </label>

      {!isPresetLeafAccent(normalized) ? (
        <p className="mt-1.5 text-[8px] leading-tight opacity-40" style={{ color: INK }}>
          目前為自訂色 {normalized}
        </p>
      ) : null}
    </div>
  );
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
