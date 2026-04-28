type Pattern = number | number[];

function vibrate(pattern: Pattern): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try { navigator.vibrate(pattern); } catch {}
}

export const hapticTap = () => vibrate(10);
export const hapticSuccess = () => vibrate([12, 40, 18]);
export const hapticError = () => vibrate([30, 60, 30, 60, 30]);
export const hapticSelection = () => vibrate(6);
