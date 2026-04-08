import { motion } from "framer-motion";
import { useMemo } from "react";

import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";
import { Postcards } from "@/unknown-lab/ui/vacation/Postcards";
import { PassportStamps } from "@/unknown-lab/ui/vacation/PassportStamps";
import { WanderJots } from "@/unknown-lab/ui/vacation/WanderJots";
import { WorldPicker } from "@/unknown-lab/ui/vacation/WorldPicker";

export function VacationSet() {
  const vacationScene = useUnknownLabStore((s) => s.vacationScene);
  const openWorldPicker = useUnknownLabStore((s) => s.openWorldPicker);

  const vignette = useMemo(() => {
    if (vacationScene === "v2") return "unknownVacationV2";
    if (vacationScene === "v3") return "unknownVacationV3";
    return "unknownVacationV1";
  }, [vacationScene]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Background mood layer (abstract, no text) */}
      <motion.div
        key={vignette}
        className={`absolute inset-0 ${vignette}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Right-bottom: traveler cluster */}
      <div className="pointer-events-none absolute bottom-5 right-5 flex items-end gap-3">
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <Postcards />
          <PassportStamps />
          <button
            type="button"
            className="unknownMicroPill"
            onClick={() => openWorldPicker()}
            aria-label="選擇世界"
          >
            世界
          </button>
        </div>
        {/* NOTE: Traveler is now a 3D miniature inside the scene. Keep this area clear. */}
      </div>

      {/* Left-bottom: WanderJots */}
      <div className="pointer-events-auto absolute bottom-5 left-5">
        <WanderJots />
      </div>

      <WorldPicker />
    </div>
  );
}

