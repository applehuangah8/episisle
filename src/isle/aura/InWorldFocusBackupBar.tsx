import { IslandBundleBackupMicro } from "./IslandBundleBackupMicro";

import { useWorldEnteredFocusWorldId } from "./WorldEnteredFocusScope";

/** Bottom-left Focus rail: compact island bundle backup (export / import). */
export function InWorldFocusBackupBar() {
  const worldId = useWorldEnteredFocusWorldId();

  if (!worldId) return null;

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-white/[0.12] px-1 py-0.5"
      style={{ borderWidth: "0.5px", background: "rgba(255,252,248,0.2)" }}
    >
      <IslandBundleBackupMicro worldId={worldId} variant="focus" />
    </div>
  );
}
