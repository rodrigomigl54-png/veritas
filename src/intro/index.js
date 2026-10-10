// Intro orchestrator. Plays on EVERY visit (no "seen" flag).
//  - 3D cinematic (src/intro/scene.js) when WebGL is available and motion is allowed
//  - calm 2-second 2D version for prefers-reduced-motion or without WebGL
//  - "Preskoči" / Esc → logo reveal + transition (≈0.8 s); waits for loading with a gold line
//  - logo flies into the header (FLIP), scene dissolves into the hero, scroll unlocks at the end
import { gsap } from 'gsap';
import { hasWebGL } from './quality.js';
import { createPreloader } from './preload.js';
import { setSound, playClink } from './audio.js';
import { imageMeta } from '../render/picture.js';
import { t } from '../i18n/index.js';
import { reducedMotion } from '../ui/motion.js';

export function runIntro({ onReveal, onFinish } = {}) {
  const root = document.getElementById('intro');
  const html = document.documentElement;
  if (!root) {
    html.classList.remove('is-intro');
    onFinish?.();
    return;
  }
  const canvas = root.querySelector('.intro__canvas');
  const percentEl = root.querySelector('.intro__percent');
  const progressEl = root.querySelector('.intro__progress');
  const lineEl = root.querySelector('.intro__line span');
  const logoWrap = root.querySelector('.intro__logo');
  const skipBtn = root.querySelector('.intro__skip');
  const soundBtn = root.querySelector('.intro__sound');
  const shade = document.createElement('div');
  shade.className = 'intro__shade';
  canvas.after(shade);
  const params = new URLSearchParams(location.search);
  const rm = reducedMotion();
  const use3D = !rm && hasWebGL() && params.get('intro') !== '2d';

  const preloader = createPreloader();
  let scene = null;
  let finished = false;
  let revealing = false;
  let skipping = false;

  progressEl.style.opacity = '0';
  // The page underneath is inert while the intro plays.
  const inertEls = [...document.querySelectorAll('body > header, body > main, body > footer, .skip-link')];
  inertEls.forEach((el) => (el.inert = true));
  // Focus the dialog itself (no visible ring on load); Tab reaches "Preskoči" next.
  root.tabIndex = -1;
  root.focus({ preventScroll: true });

  // ---------- Sound (muted by default) ----------
  soundBtn.addEventListener('click', () => {
    const on = soundBtn.getAttribute('aria-pressed') !== 'true';
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.setAttribute('data-i18n-attr', `aria-label:${on ? 'intro.soundOff' : 'intro.soundOn'}`);
    soundBtn.setAttribute('aria-label', t(on ? 'intro.soundOff' : 'intro.soundOn'));
    setSound(on);
  });

  // ---------- Logo reveal + FLIP into the header ----------
  const reveal = (from) => {
    if (revealing) return;
    revealing = true;
    root.classList.remove('is-skipping');
    progressEl.style.opacity = '0';
    const mark = logoWrap.firstElementChild;
    gsap.set(logoWrap, { opacity: 0 });
    const r = logoWrap.getBoundingClientRect();
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const startX = from ? from.x - cx : 0;
    const startY = from ? from.y - cy : 0;
    const tl = gsap.timeline({ onComplete: transition });
    // Dim the 3D scene so the logo reads.
    tl.to(shade, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0);
    if (rm) {
      tl.fromTo(logoWrap, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0);
    } else {
      tl.fromTo(
        logoWrap,
        { opacity: 0, x: startX, y: startY, scale: from ? 0.08 : 0.85, xPercent: -50, yPercent: -50 },
        { opacity: 1, x: 0, y: 0, scale: 1, duration: from ? 0.9 : 0.45, ease: 'expo.out' },
        0,
      );
      tl.fromTo(mark, { filter: 'drop-shadow(0 0 0px rgba(226,201,143,0))' }, { filter: 'drop-shadow(0 0 26px rgba(226,201,143,0.55))', duration: 0.5, yoyo: true, repeat: 1 }, 0.1);
    }
    tl.to({}, { duration: from ? 0.35 : 0.1 });
    void r;
  };

  const transition = () => {
    onReveal?.();
    const header = document.querySelector('.header-logo');
    html.classList.add('intro-handoff');
    const tl = gsap.timeline({ onComplete: finish });
    const dur = rm ? 0.4 : 0.8;
    if (header && !rm) {
      const a = logoWrap.getBoundingClientRect();
      const b = header.getBoundingClientRect();
      const scale = b.height / a.height;
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      tl.to(logoWrap, { x: `+=${dx}`, y: `+=${dy}`, scale: `*=${scale}`, duration: dur, ease: 'power3.inOut' }, 0);
    } else {
      tl.to(logoWrap, { opacity: 0, duration: dur }, 0);
    }
    tl.to([canvas, shade, root.querySelector('.intro__fallback')], { opacity: 0, duration: dur, ease: 'power2.inOut' }, 0);
    tl.to(root, { backgroundColor: 'rgba(18,12,13,0)', duration: dur, ease: 'power2.inOut' }, 0);
    tl.to([skipBtn, soundBtn, progressEl], { opacity: 0, duration: 0.3 }, 0);
  };

  const finish = () => {
    if (finished) return;
    finished = true;
    html.classList.remove('is-intro', 'intro-handoff');
    inertEls.forEach((el) => (el.inert = false));
    root.hidden = true;
    scene?.dispose();
    scene = null;
    document.removeEventListener('keydown', onKey);
    onFinish?.();
  };

  // ---------- Skip ----------
  const skip = () => {
    if (revealing || skipping) return;
    skipping = true;
    scene?.stop();
    preloader.seal();
    root.classList.add('is-skipping');
    const tick = () => {
      if (revealing) return;
      lineEl.style.width = `${Math.round(preloader.progress() * 100)}%`;
      requestAnimationFrame(tick);
    };
    tick();
    preloader.done.then(() => reveal(null));
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      skip();
    }
  };
  skipBtn.addEventListener('click', skip);
  document.addEventListener('keydown', onKey);

  // ---------- 2D version (reduced motion / no WebGL) ----------
  const run2D = () => {
    root.classList.add('intro--2d');
    progressEl.style.opacity = '1';
    let shown = 0;
    const start = performance.now();
    const step = () => {
      if (revealing) return;
      const elapsed = (performance.now() - start) / 1000;
      shown = Math.min(preloader.progress(), elapsed / 1.2, 1);
      percentEl.textContent = `${Math.round(shown * 100)}%`;
      root.querySelectorAll('.intro2d__wine').forEach((w) => (w.style.transform = `translateY(${70 - shown * 28}px)`));
      if (shown >= 1) return setTimeout(() => !revealing && reveal(null), 150);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ---------- 3D version ----------
  const run3D = async () => {
    try {
      const [{ createIntroScene }, THREE] = await Promise.all([import('./scene.js'), import('three')]);
      if (skipping || revealing) return;
      // Logo for the barrel brand, loaded through THREE.LoadingManager (counts as real loading).
      const manager = new THREE.LoadingManager();
      const meta = imageMeta('logo-white') || imageMeta('logo-main');
      let logoImage = null;
      if (meta) {
        logoImage = await new Promise((resolve) => {
          const p = new Promise((done) => {
            new THREE.ImageLoader(manager).load(`${meta.base}-${meta.widths[meta.widths.length - 1]}.png`, (img) => (resolve(img), done()), undefined, () => (resolve(null), done()));
          });
          preloader.track(p);
        });
      }
      preloader.seal();
      scene = createIntroScene(canvas, {
        logoImage,
        forceTier: params.get('intro'),
        progress: preloader.progress,
        onPercent: (p, visible, y) => {
          percentEl.textContent = `${Math.round(p * 100)}%`;
          progressEl.style.opacity = visible ? '1' : '0';
          if (y != null) {
            progressEl.style.top = `${Math.min(window.innerHeight - 40, y + 14)}px`;
            progressEl.style.bottom = 'auto';
          }
        },
        onClink: playClink,
        onContact: (pt) => reveal(pt),
      });
      root.dataset.tier = scene.tier;
      scene.start();
    } catch (err) {
      console.warn('[intro] 3D failed, using 2D fallback', err);
      scene?.dispose();
      scene = null;
      preloader.seal();
      run2D();
    }
  };

  if (use3D) run3D();
  else {
    preloader.seal();
    run2D();
  }
}
