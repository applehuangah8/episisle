import { motion } from "framer-motion";
import { useCallback } from "react";

import { isTaskModule } from "@/core/blockView";
import type { BlockModule } from "@/core/types";
import { useStore } from "@/store/useStore";

type TaskMod = Extract<BlockModule, { type: "task" }>;
type TaskStatus = TaskMod["status"];

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "待辦",
  doing: "進行中",
  done: "完成",
};

const ORDER: TaskStatus[] = ["todo", "doing", "done"];

function normalizeStatus(s: unknown): TaskStatus {
  if (s === "todo" || s === "doing" || s === "done") return s;
  return "todo";
}

const mistPulse = {
  opacity: [0.28, 0.62, 0.28],
  scale: [1, 1.04, 1],
};

export function TaskModule({
  mod,
  blockId,
  moduleIndex,
}: {
  mod: TaskMod;
  blockId: string;
  moduleIndex: number;
}) {
  const status = normalizeStatus(mod.status);
  const label = STATUS_LABEL[status];
  const done = status === "done";
  const doing = status === "doing";
  const updateBlock = useStore((s) => s.updateBlock);

  const cycleStatus = useCallback(() => {
    const st = useStore.getState();
    const prev = st.blocks[blockId];
    if (!prev) return;
    const mods = [...prev.modules];
    const m = mods[moduleIndex];
    if (!isTaskModule(m)) return;
    const cur = normalizeStatus(m.status);
    const i = ORDER.indexOf(cur);
    const next = ORDER[(i + 1) % ORDER.length];
    mods[moduleIndex] = { type: "task", status: next };
    updateBlock(blockId, { modules: mods });
  }, [blockId, moduleIndex, updateBlock]);

  return (
    <div className="relative">
      {doing ? (
        <motion.span
          className="pointer-events-none absolute -inset-[3px] rounded-2xl border border-[var(--color-accent)]/25"
          aria-hidden
          animate={mistPulse}
          transition={{
            duration: 2.75,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ) : null}
      <div
        className="epis-brick epis-brick-glass relative flex cursor-pointer select-none items-center gap-2 rounded-2xl px-3 py-2 text-sm"
        data-epis-dblclick-edit
        onMouseDownCapture={(e) => {
          if (e.detail >= 2) e.preventDefault();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          cycleStatus();
        }}
        title="雙擊切換：待辦 → 進行中 → 完成"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cycleStatus();
          }
        }}
      >
        <span
          className={`inline-flex h-4 w-4 shrink-0 rounded border ${
            done ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]" : "border-epis-ink/20"
          }`}
          aria-hidden
        />
        <span className={done ? "text-epis-ink/45 line-through" : "text-epis-ink/85"}>{label}</span>
      </div>
    </div>
  );
}
