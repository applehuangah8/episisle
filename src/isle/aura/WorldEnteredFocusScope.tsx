import { createContext, useContext, type ReactNode } from "react";

const WorldEnteredFocusContext = createContext<string | null>(null);

/** React-only scope for in-world Focus; pair with {@link WorldFocusPersistBridge} for storage. */
export function WorldEnteredFocusScope({ worldId, children }: { worldId: string; children: ReactNode }) {
  return <WorldEnteredFocusContext.Provider value={worldId}>{children}</WorldEnteredFocusContext.Provider>;
}

export function useWorldEnteredFocusWorldId(): string | null {
  return useContext(WorldEnteredFocusContext);
}
