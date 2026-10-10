// "Naša vina" — circular 3D ring carousel with per-wine backgrounds.
// Desktop: section is pinned and each wheel gesture rotates one wine; arrows, keyboard ← →, labels, drag.
// Mobile: horizontal swipe + arrows (vertical scrolling is never hijacked). Arrows/keys loop infinitely.
import { wines } from '../config/site.js';
import { getLang } from '../i18n/index.js';
import { winePanels } from '../render/wines.js';
import { gsap, ScrollTrigger, getLenis } from '../ui/scroll.js';
import { reducedMotion } from '../ui/motion.js';

const N = wines.length;
const mod = (n, m) => ((n % m) + m) % m;
const pad = (n) => String(n).padStart(2, '0');

export function initWines() {
  const section = document.getElementById('vina');
  if (!section) return null;
  const stage = section.querySelector('.wines__stage');
  const bottles = [...section.querySelectorAll('.bottle')];
  const layers = [...section.querySelectorAll('.wines__bg-layer')];
  const panelsBox = section.querySelector('.wines__panels');
  const counter = section.querySelector('[data-wine-current]');
  const labels = [...section.querySelectorAll('[data-goto]')];
  const glow = section.querySelector('.wines__glow');
  const rm = reducedMotion();

  // Screen-reader announcement instead of reading the whole panel.
  panelsBox.setAttribute('aria-live', 'off');
  const live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  section.appendChild(live);

  const particles = createParticles(section.querySelector('.wines__particles'), rm);
  const state = { pos: 0, target: 0, active: 0 };
  let radius = 260;

  const measure = () => {
    const w = stage.clientWidth;
    radius = Math.max(120, Math.min(340, w * 0.36));
  };

  // Places every bottle on the ring according to the continuous position `state.pos`.
  const layout = () => {
    const step = (Math.PI * 2) / N;
    bottles.forEach((b, i) => {
      const d = mod(i - state.pos + N / 2, N) - N / 2; // signed distance in [-N/2, N/2)
      const theta = d * step;
      const depth = (1 - Math.cos(theta)) / 2; // 0 front … 1 back
      const x = Math.sin(theta) * radius;
      const z = -depth * radius * 1.6;
      const lift = Math.max(0, 1 - Math.abs(d));
      const scale = 1 - depth * 0.42 + lift * 0.06;
      b.style.transform = `translate3d(${x}px, ${-lift * 14 - depth * 30}px, ${z}px) scale(${scale}) rotate(${lift * -2.5}deg)`;
      b.style.filter = depth > 0.02 ? `blur(${(depth * 5).toFixed(2)}px) brightness(${(1 - depth * 0.55).toFixed(3)})` : 'none';
      b.style.opacity = String(1 - depth * 0.35);
      b.style.zIndex = String(100 - Math.round(depth * 100));
    });
  };

  const animatePanel = (panel) => {
    if (rm) return;
    gsap.fromTo(
      panel.querySelectorAll('[data-stagger]'),
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'power3.out', overwrite: true },
    );
  };

  const setActive = (index, { animate = true } = {}) => {
    state.active = index;
    const wine = wines[index];
    layers.forEach((l, i) => l.classList.toggle('is-active', i === index));
    section.dataset.themeText = wine.theme.text;
    section.classList.toggle('is-flagship', !!wine.flagship);
    glow.style.setProperty('--glow', `${wine.theme.accent}88`);
    counter.textContent = pad(index + 1);
    labels.forEach((l, i) => (i === index ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
    let shown = null;
    panelsBox.querySelectorAll('.wine-panel').forEach((p) => {
      const on = Number(p.dataset.index) === index;
      p.hidden = !on;
      if (on) shown = p;
    });
    bottles.forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
    live.textContent = `${pad(index + 1)} / ${pad(N)}: ${wine.name}`;
    if (animate && shown) animatePanel(shown);
    particles.toggle(!!wine.flagship);
  };

  const go = (delta) => {
    if (!delta) return;
    state.target += delta;
    const index = mod(state.target, N);
    if (rm) {
      state.pos = state.target;
      layout();
    } else {
      gsap.to(state, { pos: state.target, duration: 0.9, ease: 'power3.out', overwrite: true, onUpdate: layout });
    }
    setActive(index);
  };

  const goTo = (index) => {
    let delta = mod(index - state.active, N);
    if (delta > N / 2) delta -= N;
    go(delta);
  };

  // ---------- Controls ----------
  section.querySelector('[data-wine-prev]').addEventListener('click', () => go(-1));
  section.querySelector('[data-wine-next]').addEventListener('click', () => go(1));
  labels.forEach((l) => l.addEventListener('click', () => goTo(Number(l.dataset.goto))));
  bottles.forEach((b) => b.addEventListener('click', () => !dragMoved && goTo(Number(b.dataset.index))));

  // Keyboard ← → while the carousel is on screen.
  let inView = false;
  new IntersectionObserver(([e]) => (inView = e.intersectionRatio > 0.5), { threshold: [0, 0.5, 0.8] }).observe(stage);
  document.addEventListener('keydown', (e) => {
    if (!inView || e.altKey || e.ctrlKey || e.metaKey) return;
    if (document.documentElement.classList.contains('is-locked') || document.documentElement.classList.contains('is-intro')) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  });

  // Swipe / drag (horizontal only — vertical page scroll stays native via touch-action: pan-y).
  let start = null;
  let dragMoved = false;
  stage.addEventListener('pointerdown', (e) => {
    start = { x: e.clientX, y: e.clientY };
    dragMoved = false;
  });
  stage.addEventListener('pointermove', (e) => {
    if (start && Math.abs(e.clientX - start.x) > 8) dragMoved = true;
  });
  const endDrag = (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? 1 : -1);
    setTimeout(() => (dragMoved = false), 0);
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', () => (start = null));
  stage.addEventListener('dragstart', (e) => e.preventDefault());

  // Footer links → activate a wine.
  document.querySelectorAll('[data-goto-wine]').forEach((a) => a.addEventListener('click', () => goTo(Number(a.dataset.gotoWine))));

  // ---------- Desktop: pinned section, one wine per wheel gesture ----------
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    const stepPx = () => Math.round(window.innerHeight * 0.45);
    let lastStep = 0;
    const st = ScrollTrigger.create({
      trigger: section,
      pin: section.querySelector('.wines__pin'),
      start: 'top top',
      end: () => `+=${stepPx() * (N - 1)}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const s = Math.round(self.progress * (N - 1));
        if (s !== lastStep) {
          go(s - lastStep);
          lastStep = s;
        }
      },
    });

    // One wine per wheel gesture: a gesture ends after 160 ms without wheel events (trackpad inertia
    // included) and at least 550 ms after the step started.
    let cooling = false;
    let lastWheel = 0;
    let stepStarted = 0;
    let releaseTimer = null;
    const tryRelease = () => {
      clearTimeout(releaseTimer);
      const now = performance.now();
      const wait = Math.max(160 - (now - lastWheel), 550 - (now - stepStarted));
      if (wait <= 0) cooling = false;
      else releaseTimer = setTimeout(tryRelease, wait + 5);
    };
    const onWheel = (e) => {
      if (!st.isActive || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const dir = Math.sign(e.deltaY);
      const s = Math.round(st.progress * (N - 1));
      if (!cooling && ((dir > 0 && s >= N - 1) || (dir < 0 && s <= 0))) return; // let the page continue
      e.preventDefault();
      e.stopPropagation();
      lastWheel = performance.now();
      if (cooling) return tryRelease();
      cooling = true;
      stepStarted = lastWheel;
      tryRelease();
      const y = st.start + (s + dir) * stepPx();
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { duration: 0.5 });
      else window.scrollTo({ top: y });
    };
    section.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => {
      section.removeEventListener('wheel', onWheel, { capture: true });
      st.kill();
    };
  });

  // ---------- Language switch: re-render panels ----------
  document.addEventListener('langchange', () => {
    panelsBox.innerHTML = winePanels(getLang());
    setActive(state.active, { animate: false });
  });

  measure();
  layout();
  setActive(0, { animate: false });
  window.addEventListener('resize', () => {
    measure();
    layout();
  });

  return { goTo, go };
}

function createParticles(canvas, rm) {
  const ctx = canvas.getContext('2d');
  let running = false;
  let visible = false;
  let wanted = false;
  let raf = 0;
  let pts = [];
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const resize = () => {
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    const count = Math.round((canvas.clientWidth * canvas.clientHeight) / 18000);
    pts = Array.from({ length: Math.min(120, count) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: (Math.random() * 1.4 + 0.4) * dpr,
      v: (Math.random() * 0.25 + 0.08) * dpr,
      a: Math.random() * 0.6 + 0.2,
      p: Math.random() * Math.PI * 2,
    }));
  };
  const draw = (t) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pts) {
      p.y -= p.v;
      p.x += Math.sin(t / 2000 + p.p) * 0.15 * dpr;
      if (p.y < -5) p.y = canvas.height + 5;
      ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t / 900 + p.p));
      ctx.fillStyle = '#E2C98F';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  };
  const sync = () => {
    const should = wanted && visible && !rm;
    if (should && !running) {
      running = true;
      resize();
      raf = requestAnimationFrame(draw);
    } else if (!should && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    sync();
  }).observe(canvas.parentElement);
  window.addEventListener('resize', () => running && resize());
  return {
    toggle(on) {
      wanted = on;
      sync();
    },
  };
}
