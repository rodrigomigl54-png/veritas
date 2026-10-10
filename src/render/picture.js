// Responsive <picture> markup built from the image manifest (src/config/image-manifest.json).
// Works both at build time (Node, used by the Vite HTML render plugin) and in the browser.

let manifest = { images: {}, galleryExtra: [] };

export const setManifest = (m) => {
  manifest = m || manifest;
};
export const getManifest = () => manifest;
export const hasImage = (id) => !!manifest.images[id];
export const imageMeta = (id) => manifest.images[id];

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const fallbackFormat = (m) => (m.alpha ? 'png' : 'jpg');
const srcset = (m, fmt) => m.widths.map((w) => `${m.base}-${w}.${fmt} ${w}w`).join(', ');

// URL of the smallest rendition that is at least `width` px wide.
export function imageUrl(id, width = 1600, fmt) {
  const m = manifest.images[id];
  if (!m) return null;
  const w = m.widths.find((x) => x >= width) || m.widths[m.widths.length - 1];
  return `${m.base}-${w}.${fmt || (m.formats.includes('webp') ? 'webp' : fallbackFormat(m))}`;
}

/**
 * @param {string} id manifest id
 * @param {object} o
 * @param {string} o.alt
 * @param {string} [o.sizes]
 * @param {string} [o.mobileId] art-directed image for (max-width: 767px)
 * @param {boolean} [o.eager]
 * @param {string} [o.className]
 * @param {string} [o.imgClass]
 * @param {string} [o.altKey] i18n key for the alt text
 */
export function picture(id, o = {}) {
  const m = manifest.images[id];
  const alt = o.alt ?? '';
  const altAttr = o.altKey ? ` data-i18n-attr="alt:${o.altKey}"` : '';
  const cls = ['pic', o.className].filter(Boolean).join(' ');
  if (!m) {
    // Image not downloaded yet (run `npm run assets`). Render a neutral, labelled placeholder.
    return `<div class="${cls} img-missing" role="img" aria-label="${esc(alt)}" data-missing="${esc(id)}"></div>`;
  }
  const sizes = o.sizes || '100vw';
  const mm = o.mobileId && manifest.images[o.mobileId];
  const loading = o.eager ? 'eager' : 'lazy';
  const priority = o.eager ? ' fetchpriority="high"' : '';
  const sources = [];
  const modern = m.formats.filter((f) => f !== 'jpg' && f !== 'png');
  if (mm) {
    for (const fmt of mm.formats.filter((f) => f !== 'jpg' && f !== 'png'))
      sources.push(`<source media="(max-width: 767px)" type="image/${fmt}" srcset="${srcset(mm, fmt)}" sizes="${sizes}">`);
    sources.push(`<source media="(max-width: 767px)" srcset="${srcset(mm, fallbackFormat(mm))}" sizes="${sizes}">`);
  }
  for (const fmt of modern) sources.push(`<source type="image/${fmt}" srcset="${srcset(m, fmt)}" sizes="${sizes}">`);
  const fb = fallbackFormat(m);
  const mid = m.widths[Math.min(m.widths.length - 1, 2)];
  return `<picture class="${cls}" style="--lqip:url('${m.lqip}')">${sources.join('')}<img class="${o.imgClass || ''}" src="${m.base}-${mid}.${fb}" srcset="${srcset(m, fb)}" sizes="${sizes}" width="${m.width}" height="${m.height}" alt="${esc(alt)}"${altAttr} loading="${loading}" decoding="async"${priority}></picture>`;
}

// Logo rendered as a CSS mask so it can be tinted (gold by default) and animated.
// Falls back to a typographic wordmark until the logo files are downloaded.
export function logo({ variant = 'white', className = '', label = 'Vinarija Veritas' } = {}) {
  const id = variant === 'emblem' ? 'logo-emblem' : variant === 'main' ? 'logo-main' : 'logo-white';
  const m = manifest.images[id] || manifest.images['logo-white'] || manifest.images['logo-main'];
  if (!m) {
    return `<span class="logo logo--wordmark ${className}" role="img" aria-label="${esc(label)}"><span aria-hidden="true">VERITAS</span></span>`;
  }
  const url = `${m.base}-${m.widths[m.widths.length - 1]}.png`;
  return `<span class="logo ${className}" role="img" aria-label="${esc(label)}" style="--logo-url:url('${url}');aspect-ratio:${m.width}/${m.height}"></span>`;
}
