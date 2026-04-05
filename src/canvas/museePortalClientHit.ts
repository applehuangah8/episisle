/**
 * 游標是否在博物館入口「內緣」內（嚴格命中，避免大外擴誤吸）。
 */
export function isClientPointInsideMuseePortalInner(clientX: number, clientY: number): boolean {
  const portal = document.querySelector("[data-epis-musee-portal-inner]");
  if (!(portal instanceof HTMLElement)) return false;
  const b = portal.getBoundingClientRect();
  return clientX >= b.left && clientX <= b.right && clientY >= b.top && clientY <= b.bottom;
}

/**
 * 博物館入口固定於畫布 surface 右下角時，以 client 矩形判定與積木是否重疊。
 */
export function isElementClientOverlappingMuseePortal(blockEl: HTMLElement | null): boolean {
  if (!blockEl) return false;
  const portal = document.querySelector("[data-epis-musee-portal-inner]");
  if (!(portal instanceof HTMLElement)) return false;
  const a = blockEl.getBoundingClientRect();
  const b = portal.getBoundingClientRect();
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

export function isBlockCenterClientInsideMuseePortal(blockEl: HTMLElement | null): boolean {
  if (!blockEl) return false;
  const portal = document.querySelector("[data-epis-musee-portal-inner]");
  if (!(portal instanceof HTMLElement)) return false;
  const a = blockEl.getBoundingClientRect();
  const cx = a.left + a.width / 2;
  const cy = a.top + a.height / 2;
  const b = portal.getBoundingClientRect();
  return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom;
}
