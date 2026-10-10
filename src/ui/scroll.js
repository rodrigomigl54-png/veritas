// Smooth scrolling (Lenis) wired into GSAP ScrollTrigger. Disabled for prefers-reduced-motion.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './motion.js';

gsap.registerPlugin(ScrollTrigger);

let lenis = null;
let locks = 0;

export function initScroll() {
  if (reducedMotion()) return null;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  if (document.documentElement.classList.contains('is-intro')) lenis.stop();
  return lenis;
}

export const getLenis = () => lenis;

// Reference-counted scroll lock (intro, modals, drawers, menu).
export function lockScroll() {
  locks += 1;
  document.documentElement.classList.add('is-locked');
  lenis?.stop();
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) {
    document.documentElement.classList.remove('is-locked');
    if (!document.documentElement.classList.contains('is-intro')) lenis?.start();
  }
}

export function scrollToTarget(target, opts = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) lenis.scrollTo(el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? 0), { duration: opts.immediate ? 0 : 1.4, immediate: !!opts.immediate });
  else el.scrollIntoView({ behavior: reducedMotion() || opts.immediate ? 'auto' : 'smooth' });
}

export { gsap, ScrollTrigger };
