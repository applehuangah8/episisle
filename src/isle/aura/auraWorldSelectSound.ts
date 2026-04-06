/** Soft, short resonance — not a UI click. Best-effort; fails silently if audio blocked. */
let sharedCtx: AudioContext | null = null;

export function playAuraWorldSelectSound() {
  if (typeof window === "undefined") return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!sharedCtx || sharedCtx.state === "closed") sharedCtx = new AC();
    const ctx = sharedCtx;
    if (ctx.state === "suspended") void ctx.resume();

    const t0 = ctx.currentTime;
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0.0001, t0);
    master.gain.exponentialRampToValueAtTime(0.07, t0 + 0.018);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(196, t0);
    osc.frequency.exponentialRampToValueAtTime(311, t0 + 0.08);
    osc.connect(master);

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(98, t0);
    osc2.connect(master);

    osc.start(t0);
    osc2.start(t0);
    osc.stop(t0 + 0.34);
    osc2.stop(t0 + 0.34);
  } catch {
    /* ignore */
  }
}
