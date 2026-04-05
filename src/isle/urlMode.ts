import type { AppMode } from "@/isle/types";

/**
 * URL contract (lightweight, no router):
 * - Default / no params → selector (entry ritual)
 * - `?isle=focus` → Isle A
 * - `?isle=aura` or legacy `?aura=1` / `#/aura` → Isle B
 */
export function readModeFromLocation(): AppMode {
  if (typeof window === "undefined") return "selector";
  const q = new URLSearchParams(window.location.search);
  const isle = q.get("isle");
  if (isle === "focus") return "focus";
  if (isle === "aura") return "aura";
  const auraLegacy = q.get("aura");
  if (auraLegacy === "1" || auraLegacy === "true") return "aura";
  if (window.location.hash.replace(/^#/, "") === "/aura") return "aura";
  return "selector";
}

export function writeModeToUrl(mode: AppMode): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("aura");
  url.searchParams.delete("isle");
  if (url.hash === "#/aura") url.hash = "";

  if (mode === "focus") url.searchParams.set("isle", "focus");
  if (mode === "aura") {
    url.searchParams.set("isle", "aura");
    url.searchParams.set("aura", "1");
  }

  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}
