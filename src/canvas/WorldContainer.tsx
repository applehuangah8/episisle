import { motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

/**
 * 唯一世界變換層：viewport 的 translate／scale 僅作用於此節點。
 */
export function WorldContainer({
  style,
  children,
}: {
  style: CSSProperties;
  children: ReactNode;
}) {
  return (
    <motion.div
      data-epis-world-container
      className="absolute left-0 top-0 z-0 origin-top-left"
      style={style}
      initial={false}
    >
      {children}
    </motion.div>
  );
}
