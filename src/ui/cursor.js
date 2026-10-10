// Custom cursor (desktop / fine pointer only): gold dot that grows over interactive elements
// and shows "Prevuci" over the wine carousel.
import { isTouch, reducedMotion } from './motion.js';

export function initCursor() {
  const el = document.querySelector('.cursor');
  if (!el || isTouch()) return;
  let x = -100;
  let y = -100;
  let cx = x;
  let cy = y;
  const smooth = !reducedMotion();
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      el.classList.add('is-on');
      const target = e.target instanceof Element ? e.target : null;
      const drag = target?.closest('[data-cursor="drag"]');
      const hover = target?.closest('a, button, input, select, textarea, summary, label, [role="button"]');
      el.classList.toggle('is-drag', !!drag && !hover?.closest('.wine-panel'));
      el.classList.toggle('is-hover', !drag && !!hover);
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
  const tick = () => {
    cx += (x - cx) * (smooth ? 0.25 : 1);
    cy += (y - cy) * (smooth ? 0.25 : 1);
    el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(tick);
  };
  tick();
}
