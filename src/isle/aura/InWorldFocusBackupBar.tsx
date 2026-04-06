import { Download, Upload } from "lucide-react";
import { useCallback, useId, useRef } from "react";

import { useStore } from "@/store/useStore";

import { useWorldEnteredFocusWorldId } from "./WorldEnteredFocusScope";

export function InWorldFocusBackupBar() {
  const lid = useId();
  const worldId = useWorldEnteredFocusWorldId();
  const fileRef = useRef<HTMLInputElement>(null);

  const onSave = useCallback(() => {
    if (!worldId) return;
    const key = `epis-isle-world-${worldId}`;
    const raw = localStorage.getItem(key);
    const payload = raw ?? "{}";
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `epis-isle-backup-${worldId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [worldId]);

  const onFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !worldId) return;
      const key = `epis-isle-world-${worldId}`;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const t = String(reader.result ?? "");
          JSON.parse(t);
          localStorage.setItem(key, t);
          void useStore.persist.rehydrate();
        } catch {
          /* ignore invalid backup */
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [worldId],
  );

  if (!worldId) return null;

  return (
    <div className="flex items-center gap-1 rounded-full border border-white/[0.12] px-1 py-0.5" style={{ borderWidth: "0.5px", background: "rgba(255,252,248,0.2)" }}>
      <button
        type="button"
        title="Backup save"
        aria-label="Backup save to file"
        onClick={onSave}
        className="rounded-full p-2 text-[rgba(48,56,54,0.68)] transition-[background,opacity] duration-200 hover:bg-white/[0.18]"
      >
        <Download className="size-3.5" strokeWidth={1.75} aria-hidden />
      </button>
      <input
        id={lid}
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={onFile}
      />
      <button
        type="button"
        title="Restore backup"
        aria-label="Load backup from file"
        onClick={() => fileRef.current?.click()}
        className="rounded-full p-2 text-[rgba(48,56,54,0.68)] transition-[background,opacity] duration-200 hover:bg-white/[0.18]"
      >
        <Upload className="size-3.5" strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}
