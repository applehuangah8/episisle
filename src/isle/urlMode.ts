import type { AppMode } from "@/isle/types";

/**
 * URL contract (lightweight, no router) — stable query keys:
 * - Default / no params → entry (Layer 1)
 * - `?isle=focus` → worldFocus (Focus interface / focusView path)
 * - `?isle=aura` or legacy `?aura=1` / `#/aura` → auraWorld (Layer 2 diorama)
 */
export function readModeFromLocation(): AppMode {
  if (typeof window === "undefined") return "entry";
  const q = new URLSearchParams(window.location.search);
  const isle = q.get("isle");
  if (isle === "focus") return "worldFocus";
  if (isle === "aura") return "auraWorld";
  const auraLegacy = q.get("aura");
  if (auraLegacy === "1" || auraLegacy === "true") return "auraWorld";
  if (window.location.hash.replace(/^#/, "") === "/aura") return "auraWorld";
  return "entry";
}

export function writeModeToUrl(mode: AppMode): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("aura");
  url.searchParams.delete("isle");
  if (url.hash === "#/aura") url.hash = "";

  if (mode === "worldFocus") url.searchParams.set("isle", "focus");
  if (mode === "auraWorld") {
    url.searchParams.set("isle", "aura");
    url.searchParams.set("aura", "1");
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}
