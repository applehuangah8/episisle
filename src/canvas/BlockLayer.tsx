import type { ReactNode } from "react";

/** 積木層：與地景同在世界容器內，z-index 高於 IG 容器 */
export function BlockLayer({ children }: { children: ReactNode }) {
  return (
    <div data-epis-block-layer className="absolute left-0 top-0 z-[2]">
      {children}
    </div>
  );
}
