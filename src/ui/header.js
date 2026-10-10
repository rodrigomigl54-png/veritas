// Sticky header: transparent over the hero, blurred background on scroll, active section,
// smooth anchor links, mobile full-screen menu and the SR/EN switch.
import { scrollToTarget, lockScroll, unlockScroll } from './scroll.js';
import { setLang } from '../i18n/index.js';

export function initHeader() {
  const header = document.getElementById('site-header');
  const burger = header.querySelector('.burger');
  const menu = document.getElementById('mobile-menu');

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const setMenu = (open) => {
    if (open === !menu.hidden) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('data-i18n-attr', `aria-label:${open ? 'nav.closeMenu' : 'nav.menu'}`);
    document.documentElement.classList.toggle('menu-open', open);
    menu.hidden = !open;
    if (open) {
      lockScroll();
      menu.querySelector('a')?.focus({ preventScroll: true });
    } else {
      unlockScroll();
    }
  };
  burger.addEventListener('click', () => setMenu(menu.hidden));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      setMenu(false);
      burger.focus();
    }
  });
  window.matchMedia('(min-width: 1181px)').addEventListener('change', (e) => e.matches && setMenu(false));

  // In-page anchors → smooth scroll
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (!menu.hidden) setMenu(false);
    scrollToTarget(target);
    history.replaceState(null, '', id);
  });

  // Active nav link
  const links = [...header.querySelectorAll('.nav__link')];
  const sections = links.map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${entry.target.id}`));
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  sections.forEach((s) => io.observe(s));

  // Language switch
  header.querySelectorAll('[data-lang-btn]').forEach((btn) => btn.addEventListener('click', () => setLang(btn.dataset.langBtn)));
}
