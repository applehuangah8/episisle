/**
 * AuraApp — Isle B (Aura Mode) root. Self-contained prototype; mount only when mode === "aura".
 * Structure: chrome (optional) → single DioramaScene → interactive layer.
 */
import { DioramaScene } from "@/aura/scene/DioramaScene";
import { GummyPrimordialStone } from "@/aura/objects/GummyPrimordialStone";

import "@/aura/styles/auraTokens.css";

export type AuraAppProps = Record<string, never>;

/** 島際導航由 orchestrator 疊加（`AuraIsleTravelRite`），此處僅保留場景與標題列。 */
export function AuraApp() {
  return (
    <div
      className="flex h-[100dvh] min-h-0 w-full flex-col"
      style={{ color: "var(--aura-paper)" }}
      data-aura-app
      data-isle="aura"
    >
      <header
        className="relative z-20 flex shrink-0 items-center justify-between border-b px-5 py-3 backdrop-blur-md"
        style={{
          borderColor: "rgba(255,252,248,0.08)",
          background: "rgba(20,22,26,0.35)",
        }}
      >
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.35em] opacity-50">Isle B · AuraApp</p>
          <h1
            className="font-serif text-lg font-normal tracking-tight opacity-90"
            style={{ fontFamily: "var(--epis-font-district), Georgia, serif" }}
          >
            Aura Mode
          </h1>
        </div>
      </header>

      <main className="relative min-h-0 flex-1">
        <DioramaScene sceneLabel="Aura 微縮景：原石">
          <GummyPrimordialStone zIndex={4} />
        </DioramaScene>
      </main>
    </div>
  );
}
