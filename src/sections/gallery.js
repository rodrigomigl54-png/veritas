// Gallery masonry + lightbox (swipe, arrows, keyboard, counter, Esc, neighbour preloading).
import { t } from '../i18n/index.js';
import { imageUrl, hasImage } from '../render/picture.js';
import { createDialog } from '../ui/dialog.js';

export function initGallery() {
  const grid = document.querySelector('.gallery__grid');
  if (!grid) return;
  const buttons = [...grid.querySelectorAll('[data-gallery-id]')];
  const ids = buttons.map((b) => b.dataset.galleryId);
  const more = document.querySelector('[data-gallery-more]');
  more?.addEventListener('click', () => {
    grid.dataset.collapsed = 'false';
    more.parentElement.hidden = true;
    grid.querySelector('.is-extra button')?.focus();
  });

  const lb = document.getElementById('lightbox');
  const img = lb.querySelector('.lightbox__img');
  const counter = lb.querySelector('.lightbox__counter');
  const dialog = createDialog(lb, { initialFocus: () => lb.querySelector('.lightbox__close') });
  let index = 0;

  const fullUrl = (id) => {
    const w = Math.min(2400, Math.round(window.innerWidth * Math.min(window.devicePixelRatio || 1, 2)));
    return imageUrl(id, w);
  };
  const preload = (i) => {
    const id = ids[(i + ids.length) % ids.length];
    if (hasImage(id)) new Image().src = fullUrl(id);
  };
  const show = (i) => {
    index = (i + ids.length) % ids.length;
    const id = ids[index];
    counter.textContent = `${index + 1} / ${ids.length}`;
    img.alt = `${t('gallery.photo')} ${index + 1}`;
    if (!hasImage(id)) {
      img.removeAttribute('src');
      return;
    }
    img.classList.add('is-loading');
    img.onload = () => img.classList.remove('is-loading');
    img.src = fullUrl(id);
    preload(index + 1);
    preload(index - 1);
  };

  buttons.forEach((b, i) =>
    b.addEventListener('click', () => {
      show(i);
      dialog.open();
    }),
  );
  lb.querySelector('.lightbox__close').addEventListener('click', dialog.close);
  lb.querySelector('.lightbox__prev').addEventListener('click', () => show(index - 1));
  lb.querySelector('.lightbox__next').addEventListener('click', () => show(index + 1));
  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target.classList.contains('lightbox__stage')) dialog.close();
  });
  document.addEventListener('keydown', (e) => {
    if (!dialog.isOpen) return;
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });
  let sx = null;
  lb.addEventListener('pointerdown', (e) => (sx = { x: e.clientX, y: e.clientY }));
  lb.addEventListener('pointerup', (e) => {
    if (!sx) return;
    const dx = e.clientX - sx.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - sx.y)) show(index + (dx < 0 ? 1 : -1));
    sx = null;
  });
}
