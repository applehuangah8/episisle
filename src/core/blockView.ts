import type { Block, BlockModule } from "./types";

type ContentMod = Extract<BlockModule, { type: "content" }>;
type TaskMod = Extract<BlockModule, { type: "task" }>;
type NextMod = Extract<BlockModule, { type: "next" }>;
type ScheduleMod = Extract<BlockModule, { type: "schedule" }>;

/** 從第一個 content 模組取首行作為標題；否則用 fallback */
export function blockDisplayTitle(block: Block, fallback: string): string {
  const mod = block.modules.find(isContentModule);
  if (!mod) return fallback;
  const line = mod.content.split("\n")[0]?.trim();
  return line && line.length > 0 ? line.slice(0, 48) : fallback;
}

export function isContentModule(m: BlockModule): m is ContentMod {
  return m.type === "content" && typeof (m as { content?: unknown }).content === "string";
}

export function isTaskModule(m: BlockModule): m is TaskMod {
  if (m.type !== "task") return false;
  const s = (m as { status?: unknown }).status;
  return s === "todo" || s === "doing" || s === "done";
}

export function isNextModule(m: BlockModule): m is NextMod {
  return m.type === "next" && typeof (m as { text?: unknown }).text === "string";
}

/** 舊資料；載入後應已轉成 `next` */
export function isScheduleModule(m: BlockModule): m is ScheduleMod {
  return m.type === "schedule";
}
