/**
 * Downtown 右欄 IG／YT 格線：以 DOM client 座標命中（與主畫布 viewport 縮放無關）。
 */

function domRectsOverlap(a: DOMRect, b: DOMRect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

export type DowntownSlotRootKind = "ig" | "yt";

export function getDowntownSlotRoot(kind: DowntownSlotRootKind): HTMLElement | null {
  const sel =
    kind === "ig" ? "[data-epis-downtown-ig-root]" : "[data-epis-downtown-yt-root]";
  const root = document.querySelector(sel);
  return root instanceof HTMLElement ? root : null;
}

/** @deprecated 使用 {@link getDowntownSlotRoot} */
export function getDowntownIgRoot(): HTMLElement | null {
  return getDowntownSlotRoot("ig");
}

function listSlotElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll("[data-epis-downtown-slot]")).filter(
    (n): n is HTMLElement => n instanceof HTMLElement
  );
}

function parseSlotIndex(el: HTMLElement): number | null {
  const raw = el.dataset.slotIndex;
  if (raw == null) return null;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

export function findSlotIndexAtClientPoint(
  clientX: number,
  clientY: number,
  slotCount: number,
  kind: DowntownSlotRootKind
): number | null {
  const root = getDowntownSlotRoot(kind);
  if (!root) return null;
  for (const el of listSlotElements(root)) {
    const r = el.getBoundingClientRect();
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      const idx = parseSlotIndex(el);
      if (idx != null && idx >= 0 && idx < slotCount) return idx;
    }
  }
  return null;
}

export function findIgSlotIndexAtClientPoint(
  clientX: number,
  clientY: number,
  slotCount: number
): number | null {
  return findSlotIndexAtClientPoint(clientX, clientY, slotCount, "ig");
}

export function findSlotOverlappingBlockRect(
  blockRect: DOMRect,
  slotCount: number,
  kind: DowntownSlotRootKind,
  inflate = 12
): number | null {
  const root = getDowntownSlotRoot(kind);
  if (!root) return null;
  let best: { i: number; area: number } | null = null;
  for (const el of listSlotElements(root)) {
    const idx = parseSlotIndex(el);
    if (idx == null || idx < 0 || idx >= slotCount) continue;
    const r = el.getBoundingClientRect();
    const il = r.left - inflate;
    const it = r.top - inflate;
    const iw = r.width + inflate * 2;
    const ih = r.height + inflate * 2;
    const inflated = new DOMRect(il, it, iw, ih);
    if (!domRectsOverlap(blockRect, inflated)) continue;
    const ax1 = Math.max(blockRect.left, inflated.left);
    const ax2 = Math.min(blockRect.right, inflated.right);
    const ay1 = Math.max(blockRect.top, inflated.top);
    const ay2 = Math.min(blockRect.bottom, inflated.bottom);
    const area = Math.max(0, ax2 - ax1) * Math.max(0, ay2 - ay1);
    if (!best || area > best.area) best = { i: idx, area };
  }
  return best?.i ?? null;
}

export function findIgSlotOverlappingBlockRect(
  blockRect: DOMRect,
  slotCount: number,
  inflate = 12
): number | null {
  return findSlotOverlappingBlockRect(blockRect, slotCount, "ig", inflate);
}

function slotIndexFromElementUnderPoint(
  blockEl: HTMLElement | null,
  pointerClientX: number,
  pointerClientY: number,
  root: HTMLElement,
  slotCount: number
): number | null {
  if (!blockEl) return null;
  const prev = blockEl.style.pointerEvents;
  blockEl.style.pointerEvents = "none";
  let hit: Element | null = null;
  try {
    hit = document.elementFromPoint(pointerClientX, pointerClientY);
  } finally {
    blockEl.style.pointerEvents = prev;
  }
  const node = hit?.closest("[data-epis-downtown-slot]");
  if (!(node instanceof HTMLElement) || !root.contains(node)) return null;
  const idx = parseSlotIndex(node);
  if (idx == null || idx < 0 || idx >= slotCount) return null;
  return idx;
}

export function resolveSlotIndexForBlockDrop(
  blockEl: HTMLElement | null,
  pointerClientX: number,
  pointerClientY: number,
  slotCount: number,
  kind: DowntownSlotRootKind
): number | null {
  const root = getDowntownSlotRoot(kind);
  if (!root) return null;

  const under = slotIndexFromElementUnderPoint(
    blockEl,
    pointerClientX,
    pointerClientY,
    root,
    slotCount
  );
  if (under != null) return under;

  const atPointer = findSlotIndexAtClientPoint(pointerClientX, pointerClientY, slotCount, kind);
  if (atPointer != null) return atPointer;
  const br = blockEl?.getBoundingClientRect();
  if (!br) return null;
  const atCenter = findSlotIndexAtClientPoint(
    br.left + br.width / 2,
    br.top + br.height / 2,
    slotCount,
    kind
  );
  if (atCenter != null) return atCenter;
  return findSlotOverlappingBlockRect(br, slotCount, kind, 28);
}

export function resolveIgSlotIndexForBlockDrop(
  blockEl: HTMLElement | null,
  pointerClientX: number,
  pointerClientY: number,
  slotCount: number
): number | null {
  return resolveSlotIndexForBlockDrop(blockEl, pointerClientX, pointerClientY, slotCount, "ig");
}

export function resolveSlotIndexForHighlight(
  blockEl: HTMLElement | null,
  pointerClientX: number,
  pointerClientY: number,
  slotCount: number,
  kind: DowntownSlotRootKind
): number | null {
  const root = getDowntownSlotRoot(kind);
  if (!root) return null;
  const under = slotIndexFromElementUnderPoint(
    blockEl,
    pointerClientX,
    pointerClientY,
    root,
    slotCount
  );
  if (under != null) return under;
  const atPointer = findSlotIndexAtClientPoint(pointerClientX, pointerClientY, slotCount, kind);
  if (atPointer != null) return atPointer;
  const br = blockEl?.getBoundingClientRect();
  if (!br) return null;
  return findSlotOverlappingBlockRect(br, slotCount, kind, 12);
}

export function resolveIgSlotIndexForHighlight(
  blockEl: HTMLElement | null,
  pointerClientX: number,
  pointerClientY: number,
  slotCount: number
): number | null {
  return resolveSlotIndexForHighlight(blockEl, pointerClientX, pointerClientY, slotCount, "ig");
}

export function isClientPointInsideDowntownSlotRoot(
  clientX: number,
  clientY: number,
  kind: DowntownSlotRootKind
): boolean {
  const root = getDowntownSlotRoot(kind);
  if (!root) return false;
  const r = root.getBoundingClientRect();
  return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}

export function isClientPointInsideDowntownIgRoot(clientX: number, clientY: number): boolean {
  return isClientPointInsideDowntownSlotRoot(clientX, clientY, "ig");
}
