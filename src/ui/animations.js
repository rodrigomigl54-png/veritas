// Scroll-driven animations: reveals, split-text headings, line reveals, counters, parallax,
// and the "walking down into the cellar" effect.
import { gsap, ScrollTrigger } from './scroll.js';
import { reducedMotion } from './motion.js';

// ---------- Split text into lines (mask reveal) ----------
function splitLines(el) {
  const text = (el.querySelector(':scope > .sr-only')?.textContent ?? el.textContent).trim();
  el.innerHTML = text
    .split(/\s+/)
    .map((w) => `<span class="split-word" style="display:inline-block">${w}</span>`)
    .join(' ');
  const words = [...el.querySelectorAll('.split-word')];
  const lines = [];
  let top = null;
  words.forEach((w) => {
    const t = w.offsetTop;
    if (top === null || Math.abs(t - top) > 4) {
      lines.push([]);
      top = t;
    }
    lines[lines.length - 1].push(w.textContent);
  });
  // Visual lines are aria-hidden; screen readers get one clean copy of the text.
  el.innerHTML =
    `<span class="sr-only">${text}</span>` +
    lines.map((l) => `<span class="split-line" aria-hidden="true"><span>${l.join(' ')}</span></span>`).join('');
  return [...el.querySelectorAll('.split-line > span')];
}

function setupSplits(selector, { from, stagger, duration }) {
  const els = [...document.querySelectorAll(selector)];
  const triggers = [];
  const build = (animate) => {
    triggers.forEach((t) => t.kill());
    triggers.length = 0;
    els.forEach((el) => {
      const lines = splitLines(el);
      if (!animate || el.dataset.revealed) return;
      gsap.set(lines, from);
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            el.dataset.revealed = '1';
            gsap.to(lines, { yPercent: 0, y: 0, opacity: 1, duration, stagger, ease: 'power3.out' });
          },
        }),
      );
    });
  };
  build(true);
  let rT;
  const rebuild = () => {
    clearTimeout(rT);
    rT = setTimeout(() => build(false), 150);
  };
  document.addEventListener('langchange', rebuild);
  let lastW = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth !== lastW) {
      lastW = window.innerWidth;
      rebuild();
    }
  });
}

// ---------- Reveal (fade + 30px rise, staggered among siblings) ----------
function setupReveals() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 0.08}s`;
        el.classList.add('is-in');
        io.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

// ---------- Counters ----------
function setupCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const start = Number(el.dataset.from ?? 0);
    const obj = { v: start };
    el.textContent = String(start);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () =>
        gsap.to(obj, {
          v: end,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => (el.textContent = String(Math.round(obj.v))),
        }),
    });
  });
}

// ---------- Parallax ----------
function setupParallax() {
  document.querySelectorAll('.parallax').forEach((el) => {
    const speed = Number(el.dataset.speed ?? 0.15);
    gsap.fromTo(
      el,
      { yPercent: -speed * 40 },
      {
        yPercent: speed * 40,
        ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

// ---------- Cellar: darken like walking down into a cellar ----------
function setupCellar() {
  const cellar = document.getElementById('podrum');
  if (!cellar) return;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: cellar, start: 'top 85%', end: 'top 15%', scrub: true },
  });
  tl.fromTo(cellar, { backgroundColor: '#2A0710' }, { backgroundColor: '#120C0D', ease: 'none' }, 0).to(
    cellar.querySelector('.cellar__vignette'),
    { opacity: 1, ease: 'none' },
    0,
  );
  const glasses = cellar.querySelectorAll('.glass-in');
  if (glasses.length) {
    gsap.set(glasses, { opacity: 0, scale: 0.92 });
    ScrollTrigger.create({
      trigger: cellar.querySelector('.collage'),
      start: 'top 75%',
      once: true,
      onEnter: () => gsap.to(glasses, { opacity: 1, scale: 1, duration: 1, stagger: 0.25, ease: 'power3.out' }),
    });
  }
}

// ---------- Hero entrance (after the intro) ----------
export function playHeroEntrance() {
  if (reducedMotion()) return;
  const items = document.querySelectorAll('.hero__content > *');
  gsap.fromTo(items, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.1 });
}

export function initAnimations() {
  if (reducedMotion()) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
    document.querySelectorAll('.cellar__vignette').forEach((el) => (el.style.opacity = 1));
    return;
  }
  setupReveals();
  setupSplits('[data-split]', { from: { yPercent: 110 }, stagger: 0.08, duration: 0.9 });
  setupSplits('[data-lines]', { from: { y: 24, opacity: 0 }, stagger: 0.07, duration: 0.7 });
  setupCounters();
  setupParallax();
  setupCellar();
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
