import './styles/fonts.css';
import './styles/base.css';
import './styles/sections.css';
import './styles/overlays.css';

import manifest from './config/image-manifest.json';
import { setManifest } from './render/picture.js';
import { initLang } from './i18n/index.js';
import { runIntro } from './intro/index.js';
import { initScroll, getLenis, ScrollTrigger } from './ui/scroll.js';
import { initHeader } from './ui/header.js';
import { initAnimations, playHeroEntrance } from './ui/animations.js';
import { initCursor } from './ui/cursor.js';
import { initWines } from './sections/wines.js';
import { initGallery } from './sections/gallery.js';
import { initCart } from './shop/cartUI.js';
import { initBooking } from './forms/booking.js';
import { initNewsletter } from './forms/newsletter.js';

setManifest(manifest);

// Hero drone loop: starts after the intro (never competes with it for bandwidth), not for reduced motion.
function startHeroVideo() {
  const v = document.querySelector('.hero__video[data-autoplay]');
  if (!v || window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return;
  v.preload = 'auto';
  v.addEventListener('playing', () => v.classList.add('is-playing'), { once: true });
  v.play().catch(() => {});
}

// The intro starts first so its assets begin loading immediately.
runIntro({
  onReveal: () => playHeroEntrance(),
  onFinish: () => {
    startHeroVideo();
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
    getLenis()?.start();
  },
});

initLang();
initScroll();
initHeader();
initCart();

// The rest is initialised in small chunks while the intro plays, keeping the main thread responsive.
const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
const queue = [initBooking, initNewsletter, initWines, initGallery, initAnimations, initCursor];
const runNext = () => {
  const task = queue.shift();
  if (!task) return;
  task();
  idle(runNext, { timeout: 300 });
};
idle(runNext, { timeout: 300 });
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));
