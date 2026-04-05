import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AppMode } from "@/isle/types";
import { readModeFromLocation, writeModeToUrl } from "@/isle/urlMode";

export type ModeContextValue = {
  mode: AppMode;
  /** Switch world + sync URL (replaceState). Unmounts the other mode tree. */
  setMode: (next: AppMode) => void;
};

const ModeContext = createContext<ModeContextValue | null>(null);

export function useAppMode(): ModeContextValue {
  const v = useContext(ModeContext);
  if (!v) throw new Error("useAppMode must be used within ModeProvider");
  return v;
}

/**
 * Holds current isle/mode only. No zustand, no Focus assumptions.
 */
export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(() => readModeFromLocation());

  const setMode = useCallback((next: AppMode) => {
    setModeState(next);
    writeModeToUrl(next);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setModeState(readModeFromLocation());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}
