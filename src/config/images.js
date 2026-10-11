// Image registry. `scripts/fetch-assets.mjs` downloads every entry, optimises it
// (AVIF/WebP/JPG or WebP/PNG for transparent images, responsive widths) into /public/images
// and writes src/config/image-manifest.json, which the site reads at build and run time.
// `candidates` are tried in order — the first URL that exists wins (used to find full-size originals).

const U = 'https://vinarijaveritas.com/wp-content/uploads';
// Local fallback: a file in assets/source/** with this name (used when the original isn't available).
const L = (name) => `local:${name}`;

export const brandImages = {
  'logo-main': { candidates: [`${U}/2022/08/Veritas-logo.png`], alpha: true },
  'logo-white': { candidates: [`${U}/2022/08/veritas-logo-beli.png`], alpha: true },
  'logo-emblem': { candidates: [`${U}/2022/08/cropped-Veritas-favicon.png`], alpha: true },
};

export const siteImages = {
  'hero-desktop': { candidates: [`${U}/2022/10/2022-pocetna-2.jpg`, L('dron-3.5.jpg')] },
  'hero-mobile': { candidates: [`${U}/2022/10/2022-pocetna-2-mob.jpg`] },
  philosophy: {
    candidates: [
      `${U}/2022/08/nasa-filozofija.jpg`,
      `${U}/2022/10/nasa-filozofija.jpg`,
      `${U}/elementor/thumbs/nasa-filozofija-psox27zywoce1j1m0mtbqt9z9js2q1buk6ryf98s3k.jpg`,
      L('photo-vineyard-poplars.jpg'),
    ],
  },

  'about-hero': { candidates: [`${U}/2022/08/o-nama-hero.jpg`, L('veritas-vinograd-put.jpg')] },
  'about-hero-mobile': { candidates: [`${U}/2022/08/o-nama-hero-mob.jpg`] },
  'about-1': { candidates: [`${U}/2022/08/o-nama-1.jpg`, L('photo-lineup.jpg')] },
  'about-2': { candidates: [`${U}/2022/08/o-nama-2.jpg`, L('photo-terrace.jpg')] },

  'vineyards-hero': { candidates: [`${U}/2022/10/2022-vinogradi.jpg`, L('dron-11.5.jpg')] },
  'vineyards-hero-mobile': { candidates: [`${U}/2022/10/2022-vinogradi-mob.jpg`] },
  'vineyards-1': { candidates: [`${U}/2022/08/vinogradi-1.jpg`, L('photo-vineyard-poplars.jpg')] },

  'cellar-hero': { candidates: [`${U}/2022/08/podrum-hero.jpg`, L('photo-cellar-1.jpg')] },
  'cellar-hero-mobile': { candidates: [`${U}/2022/08/podrum-hero-mob.jpg`] },
  'cellar-1': { candidates: [`${U}/2022/08/podrum-1.jpg`, L('photo-cellar-3.jpg')] },

  'visits-hero': { candidates: [`${U}/2022/08/posete-i-dogadjaji-hero.jpg`, L('photo-two-glasses.jpg')] },
  'visits-hero-mobile': { candidates: [`${U}/2022/08/posete-i-dogadjaji-hero-mob.jpg`] },
  'visits-1': { candidates: [`${U}/2022/08/posete-dogadjaji-1.jpg`, L('photo-food.jpg')] },
  'visits-2': {
    candidates: [`${U}/2022/08/posete-dogadjaji-najava.jpg`, `${U}/2022/08/posete-dogadjaji-najava-1024x683.jpg`, L('photo-rose-glass.jpg')],
  },
};

export const bottleImages = {
  'bottle-bela-harmonija': { candidates: [`${U}/2022/08/bela-harmonija.png`], alpha: true, bottle: true },
  'bottle-domina-rose': { candidates: [`${U}/2022/08/domina-rose.png`], alpha: true, bottle: true },
  'bottle-monte-karlovci': { candidates: [`${U}/2022/08/monte-karlovci.png`], alpha: true, bottle: true },
  'bottle-cuk-cuvee': { candidates: [`${U}/2022/08/cuk-cuvee.png`], alpha: true, bottle: true },
  'bottle-momentum': { candidates: [`${U}/2022/08/momentum.png`], alpha: true, bottle: true },
  'bottle-bermet': { candidates: [`${U}/2022/08/bermet.png`], alpha: true, bottle: true },
};

const galleryUrls = [
  ...Array.from({ length: 16 }, (_, i) => `${U}/2022/08/${i + 1}.jpg`),
  ...['ACA_8470', 'ACA_8508', 'ACA_8524', 'ACA_8562-2', 'ACA_8566', 'ACA_8573', 'ACA_8574', 'ACA_8631', 'ACA_8632', 'ACA_8649', 'ACA_8652', 'DJI_0047'].map(
    (n) => `${U}/2022/10/${n}.jpg`,
  ),
];

export const galleryImages = Object.fromEntries(
  galleryUrls.map((url) => {
    const name = url.split('/').pop().replace(/\.\w+$/, '').toLowerCase();
    return [`gallery-${name}`, { candidates: [url], gallery: true }];
  }),
);

// Photos supplied by the winery (assets/source/photos) and stills from the graded drone footage
// (assets/source/frames, made by scripts/grade-video.sh). Shown in the gallery and used as section photos.
export const localImages = Object.fromEntries(
  [
    'photo-two-glasses', 'photo-lineup', 'photo-vineyard-poplars', 'photo-grapes', 'photo-rose-glass', 'photo-terrace',
    'photo-cellar-2', 'photo-cellar-1', 'photo-food', 'photo-cellar-3', 'veritas-vinograd-put',
  ].map((n) => [n, { candidates: [L(`${n}.jpg`)], gallery: true }]).concat(
    ['0.7', '3.5', '6.5', '8.5', '9.8', '11.5'].map((t) => [`dron-${t.replace('.', '-')}`, { candidates: [L(`dron-${t}.jpg`)], gallery: true }]),
  ),
);

// Pages crawled for additional gallery photos not listed above.
export const crawlPages = [
  'https://vinarijaveritas.com/',
  'https://vinarijaveritas.com/o-nama/',
  'https://vinarijaveritas.com/vinogradi/',
  'https://vinarijaveritas.com/podrum/',
  'https://vinarijaveritas.com/posete-i-dogadjaji/',
  'https://vinarijaveritas.com/galerija/',
  'https://vinarijaveritas.com/kontakt/',
  'https://vinarijaveritas.com/prodavnica/',
  'https://vinarijaveritas.com/en/',
];

// Stock photo slots (Pexels). Filled by `npm run assets:stock` from scripts/stock-photos.json
// after a human has reviewed the candidates. See CREDITS.md.
export const stockSlots = {
  'stock-about-vineyard': { use: 'O nama — pozadina (samo ako fotografije vinarije nisu dovoljno široke)' },
  'stock-cellar-glass-1': { use: 'Podrum — čaša crvenog vina na hrastovom buretu' },
  'stock-cellar-glass-2': { use: 'Podrum — dve čaše crvenog vina u toplom svetlu' },
  'stock-cellar-glass-3': { use: 'Podrum — sipanje crvenog vina u čašu' },
  'stock-cellar-glass-4': { use: 'Podrum — čaša crvenog vina, vinograd u zalasku sunca' },
};

export const allImages = { ...brandImages, ...siteImages, ...bottleImages, ...galleryImages, ...localImages };
