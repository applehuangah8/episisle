import { Download, Upload } from "lucide-react";
import { useCallback, useId, useRef } from "react";

import { exportImmersiveWorldBackup, importImmersiveWorldBackup } from "./episIsleWorldBackup";

export type IslandBundleBackupMicroVariant = "focus" | "codex";

/**
 * Icon-only export / import for one immersive island bundle (Focus snapshot + identity + Codex).
 */
export function IslandBundleBackupMicro({
  worldId,
  variant,
}: {
  worldId: string;
  variant: IslandBundleBackupMicroVariant;
}) {
  const lid = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = useCallback(() => {
    const json = exportImmersiveWorldBackup(worldId);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `epis-immersive-${worldId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [worldId]);

  const onImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const r = importImmersiveWorldBackup(String(reader.result ?? ""), {
          expectedWorldId: worldId,
        });
        if (!r.ok) window.alert(r.error);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [worldId],
  );

  const iconBtnFocus =
    "rounded-full p-2 text-[rgba(48,56,54,0.68)] transition-[background,opacity] duration-200 hover:bg-white/[0.18]";
  const iconBtnCodex =
    "flex size-9 items-center justify-center rounded-full border border-white/[0.12] text-[rgba(66,104,133,0.72)] transition hover:bg-white/[0.12]";

  const wrapCls = variant === "focus" ? "flex items-center gap-1" : "flex items-center gap-1";

  return (
    <div className={wrapCls} role="group" aria-label="島嶼備份">
      <input
        id={lid}
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={onImportFile}
      />
      <button
        type="button"
        title="匯出此島備份"
        aria-label="匯出此島備份"
        onClick={onExport}
        className={variant === "focus" ? iconBtnFocus : iconBtnCodex}
        style={variant === "codex" ? { borderWidth: "0.5px" } : undefined}
      >
        <Download className="size-3.5" strokeWidth={1.75} aria-hidden />
      </button>
      <button
        type="button"
        title="從備份還原此島"
        aria-label="從備份還原此島"
        onClick={() => fileRef.current?.click()}
        className={variant === "focus" ? iconBtnFocus : iconBtnCodex}
        style={variant === "codex" ? { borderWidth: "0.5px" } : undefined}
      >
        <Upload className="size-3.5" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
