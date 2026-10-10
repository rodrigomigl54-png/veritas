// Optional glass "clink" — synthesised with Web Audio (no file). Muted by default; the AudioContext
// is only created after the visitor turns the sound on (user gesture), so nothing autoplays.
let ctx = null;
let enabled = false;

export function setSound(on) {
  enabled = on;
  if (on && !ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (on) ctx?.resume?.();
}

export function playClink() {
  if (!enabled || !ctx) return;
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = 0.22;
  out.connect(ctx.destination);
  // Inharmonic partials of a crystal glass.
  [
    [2637, 1.6, 1],
    [3951, 1.1, 0.55],
    [5274, 0.8, 0.35],
    [6720, 0.5, 0.2],
    [2650, 1.8, 0.6],
  ].forEach(([f, dur, amp]) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(amp, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g).connect(out);
    o.start(now);
    o.stop(now + dur + 0.05);
  });
}

export function disposeAudio() {
  // Keep the context if the visitor enabled sound; it is tiny and may be reused.
}
