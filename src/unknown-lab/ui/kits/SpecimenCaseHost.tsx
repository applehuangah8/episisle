import { useCallback } from "react";

import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";
import { SpecimenCase, type SpecimenKit } from "@/unknown-lab/ui/kits/SpecimenCase";

export function SpecimenCaseHost() {
  const openGemId = useUnknownLabStore((s) => s.openGemId);
  const gems = useUnknownLabStore((s) => s.gems);
  const kits = useUnknownLabStore((s) => s.kits);
  const closeKit = useUnknownLabStore((s) => s.closeKit);
  const updateKit = useUnknownLabStore((s) => s.updateKit);

  const gem = openGemId ? gems.find((g) => g.id === openGemId) ?? null : null;
  if (!gem) return null;

  const raw = kits[gem.id] ?? { need: "", materials: "", next: "" };
  const kit: SpecimenKit = { gemId: gem.id, ...raw };

  const onExport = useCallback(() => {
    const payload = {
      gem: { id: gem.id, title: gem.title, sourceOreIds: gem.sourceOreIds },
      kit: raw,
    };
    const txt = JSON.stringify(payload, null, 2);
    void navigator.clipboard?.writeText(txt);
  }, [gem.id, gem.sourceOreIds, gem.title, raw]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-20">
      <div className="pointer-events-auto">
        <SpecimenCase
          gem={gem}
          kit={kit}
          onChange={(next) => updateKit(gem.id, { need: next.need, materials: next.materials, next: next.next })}
          onExport={onExport}
          onClose={closeKit}
        />
      </div>
    </div>
  );
}

