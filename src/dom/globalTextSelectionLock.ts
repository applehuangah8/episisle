/** 拖曳時鎖定整頁文字選取，避免游標經過其他元件時誤選文字 */

export function lockGlobalTextSelection(): void {
  document.body.style.userSelect = "none";
  document.body.style.setProperty("-webkit-user-select", "none");
}

export function unlockGlobalTextSelection(): void {
  document.body.style.userSelect = "";
  document.body.style.removeProperty("-webkit-user-select");
}
