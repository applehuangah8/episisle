/**
 * Aura Mode (Isle B) — public surface for Multi-Isle orchestrator.
 * Default export: `AuraApp` prototype. Do not import into Focus / Isle A UI trees.
 */
import { AuraApp } from "@/aura/AuraApp";

export type { IsleId, AuraPhase } from "@/aura/types";
export { AuraApp } from "@/aura/AuraApp";
export type { AuraAppProps } from "@/aura/AuraApp";
/** @deprecated */
export { AuraModeShell } from "@/aura/AuraModeShell";
export { DioramaScene } from "@/aura/scene/DioramaScene";
export { GummyPrimordialStone } from "@/aura/objects/GummyPrimordialStone";
export { PhysicalTaskCard } from "@/aura/objects/PhysicalTaskCard";
export { AURA_DIORAMA_BG_URL } from "@/aura/constants";

/** Orchestrator default: same as `AuraApp` (legacy name). */
export default function AuraModePrototype() {
  return <AuraApp />;
}
