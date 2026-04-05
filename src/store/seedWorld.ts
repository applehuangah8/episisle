import type { Block, Placement } from "@/core/types";

/** 首次啟動或無 localStorage 存檔時寫入的示範島嶼（可隨產品調整） */
export const SEED_BLOCKS: Block[] = (() => {
  const t = Date.now();
  return [
    {
      id: "b-wild",
      lifecycle: "developing" as const,
      modules: [
        { type: "content" as const, content: "林間一隅\n冷調、通透、慢節奏。" },
        { type: "task" as const, status: "todo" as const },
        { type: "next" as const, text: "採光、散步" },
      ],
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "b-ig",
      lifecycle: "idea" as const,
      modules: [
        { type: "next" as const, text: "16:30 · 限動" },
        { type: "content" as const, content: "限時動態\n與島民分享今日天光。" },
      ],
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "b-yt",
      lifecycle: "planned" as const,
      modules: [
        { type: "content" as const, content: "長影片腳本\n第一幕：霧與海平線。" },
        { type: "task" as const, status: "doing" as const },
        { type: "next" as const, text: "粗剪 v1" },
      ],
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "b-musee",
      lifecycle: "developing" as const,
      modules: [
        { type: "content" as const, content: "展間 A\n留白與霧藍之間的呼吸。" },
        { type: "task" as const, status: "done" as const },
        { type: "next" as const, text: "策展筆記" },
        { type: "custom-demo", data: { note: "可擴充模組", level: 1 } },
      ],
      createdAt: t,
      updatedAt: t,
    },
  ];
})();

export const SEED_PLACEMENTS: Placement[] = [
  {
    id: "p-wild",
    blockId: "b-wild",
    district: "wild",
    position: { x: -680, y: -280 },
    ui: { width: 280, height: 220 },
  },
  {
    id: "p-ig",
    blockId: "b-ig",
    district: "instagram",
    position: { x: 40, y: -260 },
    ui: { width: 300, height: 240 },
  },
  {
    id: "p-yt",
    blockId: "b-yt",
    district: "youtube",
    position: { x: 400, y: -240 },
    ui: { width: 300, height: 220 },
  },
  {
    id: "p-musee",
    blockId: "b-musee",
    district: "studio",
    position: { x: -200, y: 280 },
    ui: { width: 320, height: 280 },
  },
];
