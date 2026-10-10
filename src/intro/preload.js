// Real loading progress for the intro: hero image, first wine bottles, fonts, plus anything
// registered by the Three.js LoadingManager. Returns a 0..1 progress getter and a done promise.
import { imageUrl, hasImage } from '../render/picture.js';
import { wines } from '../config/site.js';

export function createPreloader() {
  const tasks = [];
  let loaded = 0;
  let resolveDone;
  const done = new Promise((r) => (resolveDone = r));
  let sealed = false;

  const track = (promise) => {
    tasks.push(promise);
    promise.finally(() => {
      loaded += 1;
      check();
    });
  };
  const check = () => {
    if (sealed && loaded >= tasks.length) resolveDone();
  };

  const loadImg = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = img.onerror = () => resolve();
      img.src = src;
    });

  // Hero image actually chosen by the browser (respects <picture> art direction / srcset).
  const heroImg = document.querySelector('.hero__pic img');
  if (heroImg) {
    track(
      new Promise((resolve) => {
        if (heroImg.complete && heroImg.naturalWidth) return resolve();
        heroImg.addEventListener('load', resolve, { once: true });
        heroImg.addEventListener('error', resolve, { once: true });
      }),
    );
  }
  // First wine bottles.
  wines.slice(0, 3).forEach((w) => {
    if (hasImage(w.image)) track(loadImg(imageUrl(w.image, 480)));
  });
  if (document.fonts?.ready) track(document.fonts.ready.then(() => undefined));

  return {
    track,
    seal() {
      sealed = true;
      check();
    },
    progress: () => (tasks.length ? loaded / tasks.length : 1),
    done,
  };
}
