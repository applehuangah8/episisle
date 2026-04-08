import { UnknownScene } from "@/unknown-lab/ui/UnknownScene";
import { UnknownUiOverlay } from "@/unknown-lab/ui/UnknownUiOverlay";
import { VacationSet } from "@/unknown-lab/ui/vacation/VacationSet";
import { SpecimenCaseHost } from "@/unknown-lab/ui/kits/SpecimenCaseHost";

import "./unknownTokens.css";

export function UnknownShell() {
  return (
    <div className="relative h-full w-full bg-[var(--unknown-bg-app)] text-[var(--unknown-text)]">
      <UnknownScene />
      <UnknownUiOverlay />
      <VacationSet />
      <SpecimenCaseHost />
    </div>
  );
}

