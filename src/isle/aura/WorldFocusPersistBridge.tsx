import { useLayoutEffect, type ReactNode } from "react";

import { useStore } from "@/store/useStore";

import { getResolvedAuraIslandDisplayName } from "./auraIslandMetadata";
import type { AuraIslandId } from "./auraWorldIslandTypes";

const DEFAULT_PERSIST_NAME = "epis-isle-v1";

function worldPersistName(worldId: string): string {
  return `epis-isle-world-${worldId}`;
}

/**
 * Swap Zustand persist localStorage name while in-world Focus is mounted,
 * so Layer 2 Focus stays on a separate snapshot from Layer 3 `worldFocus` / entry App.
 * After rehydrate, align {@link useStore} `projectTitle` with Layer 2 world identity.
 */
export function WorldFocusPersistBridge({ worldId, children }: { worldId: string; children: ReactNode }) {
  useLayoutEffect(() => {
    const persist = useStore.persist;
    persist.setOptions({ name: worldPersistName(worldId) });
    void Promise.resolve(persist.rehydrate()).then(() => {
      const label = getResolvedAuraIslandDisplayName(worldId as AuraIslandId);
      useStore.setState({ projectTitle: label.slice(0, 160) });
    });
    return () => {
      persist.setOptions({ name: DEFAULT_PERSIST_NAME });
      void persist.rehydrate();
    };
  }, [worldId]);

  return <>{children}</>;
}
