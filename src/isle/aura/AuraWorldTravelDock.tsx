import { AuraIsleTravelRite } from "@/isle/chrome/AuraIsleTravelRite";
import { useAppMode } from "@/isle/ModeContext";

import { useAuraWorldSelection } from "./auraWorldSelectionStore";

/** Positions travel rite away from Focus HUD map controls when in-world Focus is active. */
export function AuraWorldTravelDock() {
  const { mode } = useAppMode();
  const inWorldFocusLayout = useAuraWorldSelection(
    (s) => s.isEntered && s.entryFlowStage === "ready" && s.viewMode === "focus",
  );
  const useBottomRight = mode === "auraWorld" && inWorldFocusLayout;

  return <AuraIsleTravelRite dock={useBottomRight ? "bottomRight" : "topRight"} />;
}
