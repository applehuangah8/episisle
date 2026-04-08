import { useMemo } from "react";

import { useUnknownLabStore } from "@/unknown-lab/state/useUnknownLabStore";

export function PassportStamps() {
  const vacationScene = useUnknownLabStore((s) => s.vacationScene);
  const setVacationScene = useUnknownLabStore((s) => s.setVacationScene);

  const slots = useMemo(() => ["v1", "v2", "v3"] as const, []);

  return (
    <div className="unknownStampBar">
      {slots.map((id) => {
        const active = vacationScene === id;
        const shape = id === "v1" ? "stampShapeV1" : id === "v2" ? "stampShapeV2" : "stampShapeV3";
        return (
          <button
            key={id}
            type="button"
            className={`unknownStampSlot ${active ? "unknownStampSlot--active" : ""}`}
            onClick={() => setVacationScene(id)}
            aria-label={`Stamp ${id}`}
          >
            <span className={`unknownStampEmboss ${shape}`} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

