import type { DropItem, ParticleElementId, SalonParticle } from "./types";

/** Stable id for the particle layer under a project + world ("element" scope). */
export function particleElementKey(projectId: string, worldId: string | null): ParticleElementId {
  return `${projectId}::${worldId ?? "__noworld__"}`;
}

export type ParticleStripLine = { dropId: string; content: string };

/**
 * Display rules:
 * - No particle selected → all linked 字條 from every particle in this element (deduped by drop id).
 * - Particle selected → only that particle’s linked strips.
 */
export function resolveParticleStripLines(
  drops: DropItem[],
  particles: SalonParticle[],
  elementId: ParticleElementId,
  selectedParticleId: string | null
): ParticleStripLine[] {
  const inElement = particles.filter((p) => p.elementId === elementId);
  const dropMap = new Map(drops.map((d) => [d.id, d] as const));

  if (selectedParticleId) {
    const p = inElement.find((x) => x.id === selectedParticleId);
    if (!p) return [];
    return p.linkedDropIds
      .map((id) => {
        const d = dropMap.get(id);
        return d ? { dropId: d.id, content: d.content } : null;
      })
      .filter((x): x is ParticleStripLine => x !== null);
  }

  const seen = new Set<string>();
  const out: ParticleStripLine[] = [];
  for (const p of inElement) {
    for (const id of p.linkedDropIds) {
      if (seen.has(id)) continue;
      seen.add(id);
      const d = dropMap.get(id);
      if (d) out.push({ dropId: d.id, content: d.content });
    }
  }
  return out;
}
