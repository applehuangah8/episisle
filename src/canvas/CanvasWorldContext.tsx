import { createContext, useContext, type RefObject } from "react";

export type CanvasWorldProjection = {
  /** 螢幕 client 座標 → 畫布世界座標（與 `BlockRenderer` / grid 同一空間） */
  toWorldFromClient: (clientX: number, clientY: number) => { x: number; y: number };
  /** 空白鍵按住時為 true，積木應讓出事件給畫布平移 */
  spacePanHeldRef: RefObject<boolean>;
};

export const CanvasWorldContext = createContext<CanvasWorldProjection | null>(null);

export function useCanvasWorldOptional(): CanvasWorldProjection | null {
  return useContext(CanvasWorldContext);
}
