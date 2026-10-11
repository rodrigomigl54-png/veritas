// Build-time HTML for the one-page site. Runs in Node inside the Vite plugin (vite.config.js),
// so the full Serbian content is in the static HTML for SEO; the client only swaps languages.
import { site, wines } from '../config/site.js';
import { galleryImages, localImages, stockSlots } from '../config/images.js';
import { t } from '../i18n/index.js';
import { picture, logo, esc, getManifest, hasImage, imageMeta, asset } from './picture.js';
import { icon } from './icons.js';
import { winePanels, wineBottles, wineBackgrounds, wineLabels } from './wines.js';
import { bookingForm, checkoutForm, newsletterForm } from './forms.js';

const tx = (key) => `data-i18n="${key}">${esc(t(key, 'sr'))}`;
const thtml = (key) => `data-i18n-html="${key}">${t(key, 'sr')}`;

const navItems = [
  ['vina', 'nav.wines'],
  ['o-nama', 'nav.about'],
  ['vinogradi', 'nav.vineyards'],
  ['podrum', 'nav.cellar'],
  ['posete', 'nav.visits'],
  ['galerija', 'nav.gallery'],
  ['kontakt', 'nav.contact'],
];

const bookBtn = (cls = 'btn btn--outline') =>
  `<button type="button" class="${cls}" data-open-booking><span ${tx('nav.book')}</span></button>`;

const heading = (eyebrowKey, titleKey, tag = 'h2', cls = '') => `<header class="section-head ${cls}">
  <p class="eyebrow" ${tx(eyebrowKey)}</p>
  <${tag} class="section-title" data-split ${tx(titleKey)}</${tag}>
  <span class="hairline${cls.includes('center') ? ' hairline--center' : ''}" aria-hidden="true"></span>
</header>`;


// Full-bleed section background photo + overlay tinted with the photo's dominant colour.
// Returns { html, style } — empty until the image exists (sections keep their solid colour).
function sectionBg(key, extra = '') {
  const cfg = site.sectionBackgrounds?.[key];
  if (!cfg) return { html: '', style: '' };
  const id = [cfg.image, cfg.fallback].find((x) => x && hasImage(x));
  if (!id) return { html: '', style: '' };
  const meta = imageMeta(id);
  const mobileId = id === cfg.image ? cfg.mobile : cfg.fallbackMobile;
  const mobile = mobileId && hasImage(mobileId) ? mobileId : undefined;
  const html = `<div class="section-bg${cfg.blur ? ' section-bg--blur' : ''}" aria-hidden="true">
    <div class="section-bg__media parallax" data-speed="0.18">${picture(id, { alt: '', mobileId: mobile, className: 'section-bg__pic' })}${extra}</div>
    <div class="section-bg__tint"></div>
  </div>`;
  return { html, style: ` style="--tint:${meta.dominant || '#2a0710'};--strength:${cfg.strength ?? 0.8}"`, cls: ' has-bg' };
}

// ---------- Intro ----------
function intro() {
  return `<div class="intro" id="intro" role="dialog" aria-modal="true" aria-label="Vinarija Veritas">
  <canvas class="intro__canvas" aria-hidden="true"></canvas>
  <div class="intro__fallback" aria-hidden="true">
    <svg class="intro2d" viewBox="0 0 240 200" role="presentation">
      <defs>
        <clipPath id="g2d-l"><path d="M40 40h50c0 40-5 62-25 66-20-4-25-26-25-66z"/></clipPath>
        <clipPath id="g2d-r"><path d="M150 40h50c0 40-5 62-25 66-20-4-25-26-25-66z"/></clipPath>
        <linearGradient id="g2d-wine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a1428"/><stop offset="1" stop-color="#3d0712"/></linearGradient>
      </defs>
      <g clip-path="url(#g2d-l)"><rect class="intro2d__wine" x="40" y="40" width="50" height="70" fill="url(#g2d-wine)"/></g>
      <g clip-path="url(#g2d-r)"><rect class="intro2d__wine" x="150" y="40" width="50" height="70" fill="url(#g2d-wine)"/></g>
      <g fill="none" stroke="#E2C98F" stroke-width="1.2" opacity=".85">
        <path d="M40 40h50c0 40-5 62-25 66-20-4-25-26-25-66zM65 106v52M48 160h34"/>
        <path d="M150 40h50c0 40-5 62-25 66-20-4-25-26-25-66zM175 106v52M158 160h34"/>
      </g>
    </svg>
  </div>
  <div class="intro__logo" aria-hidden="true">${logo({ variant: 'white', className: 'logo--gold intro__logo-mark' })}</div>
  <div class="intro__progress" aria-hidden="true"><span class="intro__percent">0%</span></div>
  <div class="intro__line" aria-hidden="true"><span></span></div>
  <button type="button" class="intro__sound" aria-pressed="false" data-i18n-attr="aria-label:intro.soundOn" aria-label="${esc(t('intro.soundOn', 'sr'))}">${icon('soundOff', 'icon--off')}${icon('soundOn', 'icon--on')}</button>
  <button type="button" class="intro__skip"><span ${tx('intro.skip')}</span>${icon('skip')}</button>
</div>`;
}

// ---------- Header ----------
function header() {
  const links = navItems.map(([id, key]) => `<li><a href="#${id}" class="nav__link" ${tx(key)}</a></li>`).join('');
  const mLinks = navItems.map(([id, key], i) => `<li style="--i:${i}"><a href="#${id}" ${tx(key)}</a></li>`).join('');
  return `<header class="site-header" id="site-header">
  <div class="site-header__inner">
    <a href="#pocetna" class="site-header__logo" aria-label="Vinarija Veritas — početna">${logo({ variant: 'white', className: 'logo--gold header-logo' })}</a>
    <nav class="nav" aria-label="Glavna navigacija"><ul class="nav__list">${links}</ul></nav>
    <div class="site-header__actions">
      <div class="lang" role="group" data-i18n-attr="aria-label:nav.language" aria-label="${esc(t('nav.language', 'sr'))}">
        <button type="button" class="lang__btn" data-lang-btn="sr" aria-pressed="true" lang="sr-Latn">SR</button><span aria-hidden="true">/</span><button type="button" class="lang__btn" data-lang-btn="en" aria-pressed="false" lang="en">EN</button>
      </div>
      <button type="button" class="cart-btn" data-open-cart data-i18n-attr="aria-label:nav.cart" aria-label="${esc(t('nav.cart', 'sr'))}">${icon('cart')}<span class="cart-btn__badge" data-cart-count hidden>0</span></button>
      ${bookBtn('btn btn--outline btn--small btn--shimmer header-book')}
      <button type="button" class="burger" aria-expanded="false" aria-controls="mobile-menu" data-i18n-attr="aria-label:nav.menu" aria-label="${esc(t('nav.menu', 'sr'))}"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" hidden>
  <nav aria-label="Mobilna navigacija"><ul>${mLinks}</ul></nav>
  <div class="mobile-menu__foot">
    <a href="${site.contact.phone.href}">${icon('phone')}${esc(site.contact.phone.display)}</a>
    <a href="${site.contact.instagram.url}" target="_blank" rel="noopener">${icon('instagram')}${esc(site.contact.instagram.handle)}</a>
  </div>
</div>`;
}

// ---------- Hero + philosophy ----------
function heroVideo() {
  const v = site.heroVideo;
  if (!v) return '';
  // Sources are picked in main.js by screen orientation (portrait clip on phones, 16:9 crop on desktop);
  // it starts after the intro, not for reduced motion.
  const data = esc(JSON.stringify({ p: v.portrait.map(([s, t]) => [asset(s), t]), l: v.landscape.map(([s, t]) => [asset(s), t]), pp: asset(v.posterPortrait), pl: asset(v.posterLandscape) }));
  return `<video class="hero__video" muted loop playsinline preload="none" data-autoplay data-sources="${data}" aria-hidden="true"></video>`;
}

function hero() {
  const pbg = sectionBg('philosophy');
  return `<section class="hero" id="pocetna" aria-labelledby="hero-title">
  <div class="hero__media">${picture('hero-desktop', { mobileId: 'hero-mobile', alt: 'Vinarija Veritas, Sremski Karlovci', eager: true, className: 'hero__pic' })}${heroVideo()}</div>
  <div class="hero__overlay" aria-hidden="true"></div>
  <div class="hero__content container">
    <p class="eyebrow hero__eyebrow" ${tx('hero.eyebrow')}</p>
    <h1 class="hero__title" id="hero-title">${logo({ variant: 'white', className: 'logo--gold hero__logo', label: 'Vinarija Veritas' })}<span class="sr-only" ${tx('hero.title')}</span></h1>
    <p class="hero__sub" ${tx('hero.sub')}</p>
    <span class="hairline hairline--center" aria-hidden="true"></span>
    <p class="hero__lead" ${tx('hero.lead')}</p>
    <div class="hero__ctas">
      <a href="#vina" class="btn btn--solid btn--shimmer"><span ${tx('hero.ctaWines')}</span></a>
      ${bookBtn('btn btn--outline btn--shimmer')}
    </div>
  </div>
  <a href="#filozofija" class="scroll-indicator" data-i18n-attr="aria-label:hero.scroll" aria-label="${esc(t('hero.scroll', 'sr'))}"><span class="scroll-indicator__line"></span></a>
</section>
<section class="philosophy${pbg.cls || ''}" id="filozofija" aria-label="Naša filozofija"${pbg.style}>
  ${pbg.html}
  <div class="container philosophy__grid">
    <figure class="philosophy__media reveal">${picture('philosophy', { alt: 'Naša filozofija', sizes: '(max-width: 767px) 100vw, 40vw', className: 'philosophy__pic' })}</figure>
    <blockquote class="philosophy__text reveal"><p ${thtml('hero.philosophyHtml')}</p></blockquote>
  </div>
</section>`;
}

// ---------- Wines ----------
function winesSection() {
  return `<section class="wines" id="vina" aria-roledescription="carousel" data-i18n-attr="aria-label:wines.carouselLabel" aria-label="${esc(t('wines.carouselLabel', 'sr'))}" data-theme-text="${wines[0].theme.text}">
  <div class="wines__bg" aria-hidden="true">${wineBackgrounds()}<canvas class="wines__particles"></canvas></div>
  <div class="wines__pin">
    <div class="wines__head container">${heading('wines.eyebrow', 'wines.title')}</div>
    <div class="wines__body container">
      <div class="wines__stage" data-cursor="drag">
        <div class="wines__glow" aria-hidden="true"></div>
        <div class="wines__floor" aria-hidden="true"></div>
        <div class="wines__ring">${wineBottles()}</div>
      </div>
      <div class="wines__panels" aria-live="polite">${winePanels('sr')}</div>
    </div>
    <div class="wines__nav container">
      <button type="button" class="round-btn" data-wine-prev data-i18n-attr="aria-label:wines.prev" aria-label="${esc(t('wines.prev', 'sr'))}">${icon('left')}</button>
      <p class="wines__counter" aria-hidden="true"><span data-wine-current>01</span> / ${String(wines.length).padStart(2, '0')}</p>
      <button type="button" class="round-btn" data-wine-next data-i18n-attr="aria-label:wines.next" aria-label="${esc(t('wines.next', 'sr'))}">${icon('right')}</button>
      <ul class="wines__labels">${wineLabels()}</ul>
    </div>
  </div>
  <div class="shipping-strip">
    <div class="container shipping-strip__inner">
      <p>${icon('wine')}<span ${tx('wines.shippingFree')}</span></p>
      <span class="shipping-strip__dot" aria-hidden="true"></span>
      <p>${icon('cart')}<span ${tx('wines.shippingMin')}</span></p>
    </div>
  </div>
</section>`;
}

// ---------- About ----------
function about() {
  // TODO: replace with video — set site.aboutVideo in src/config/site.js; the <video> plays over the photo (poster).
  const video = site.aboutVideo
    ? `<video class="about__video" autoplay muted loop playsinline preload="none"><source src="${esc(site.aboutVideo)}" type="video/mp4"></video>`
    : '';
  const bg = sectionBg('about', video);
  return `<section class="about${bg.cls || ''}" id="o-nama" aria-labelledby="about-title"${bg.style}>
  ${bg.html}
  <div class="container about__grid">
    <div class="about__text">
      <header class="section-head"><p class="eyebrow" ${tx('about.eyebrow')}</p><h2 class="section-title" id="about-title" data-split ${tx('about.title')}</h2><span class="hairline" aria-hidden="true"></span></header>
      <p class="lead" data-lines ${tx('about.p1')}</p>
      <p data-lines ${tx('about.p2')}</p>
    </div>
    <div class="about__images">
      <div class="about__img about__img--1 parallax" data-speed="-0.08">${picture('about-1', { alt: 'Vinarija Veritas', sizes: '(max-width: 767px) 80vw, 30vw' })}</div>
      <div class="about__img about__img--2 parallax" data-speed="0.1">${picture('about-2', { alt: 'Vinarija Veritas', sizes: '(max-width: 767px) 60vw, 22vw' })}</div>
    </div>
  </div>
  <figure class="quote container reveal">
    ${logo({ variant: 'emblem', className: 'logo--gold quote__emblem', label: 'Veritas' })}
    <blockquote><p><span class="quote__mark" aria-hidden="true">„</span><span ${tx('about.quote')}</span><span class="quote__mark" aria-hidden="true">“</span></p></blockquote>
    <figcaption>— <strong ${tx('about.quoteAuthor')}</strong>, <span ${tx('about.quoteRole')}</span></figcaption>
  </figure>
</section>`;
}

// ---------- Vineyards ----------
function vineyards() {
  const stats = [
    ['<span data-count="8">8</span> ha', 'vineyards.statHa'],
    ['<span data-count="2">2</span>', 'vineyards.statPlots'],
    ['<span data-count="45">45</span>°', 'vineyards.statLat'],
    ['<span data-count="130">130</span>–<span data-count="200">200</span> m', 'vineyards.statAlt'],
    ['<span data-count="2010" data-from="1990">2010</span>.', 'vineyards.statFounded'],
  ];
  const bg = sectionBg('vineyards');
  return `<section class="vineyards${bg.cls || ''}" id="vinogradi" aria-labelledby="vineyards-title"${bg.style}>
  ${bg.html}
  <div class="container vineyards__grid">
    <div class="vineyards__text">
      <header class="section-head"><p class="eyebrow" ${tx('vineyards.eyebrow')}</p><h2 class="section-title" id="vineyards-title" data-split ${tx('vineyards.title')}</h2><span class="hairline" aria-hidden="true"></span></header>
      <p class="lead reveal" ${tx('vineyards.p1')}</p>
      <p class="reveal" ${tx('vineyards.p2')}</p>
      <p class="reveal" ${tx('vineyards.p3')}</p>
      <p class="reveal" ${tx('vineyards.p4')}</p>
      <p class="reveal" ${tx('vineyards.p5')}</p>
    </div>
    <figure class="vineyards__media reveal">${picture('vineyards-1', { alt: 'Vinograd Veritas', sizes: '(max-width: 767px) 100vw, 40vw' })}</figure>
  </div>
  <ul class="stats container">${stats.map(([v, key]) => `<li class="stat reveal"><span class="stat__value">${v}</span><span class="stat__label" ${tx(key)}</span></li>`).join('')}</ul>
</section>`;
}

// ---------- Cellar ----------
function cellar() {
  const bg = sectionBg('cellar');
  const stock = [...Object.keys(stockSlots).filter((id) => id.startsWith('stock-cellar')), ...(site.cellarPhotos || [])].filter(hasImage).slice(0, 4);
  const tiles = [
    `<div class="collage__item collage__item--a parallax" data-speed="-0.06">${picture('cellar-hero', { mobileId: 'cellar-hero-mobile', alt: 'Barik podrum vinarije Veritas', sizes: '(max-width: 767px) 100vw, 50vw' })}</div>`,
    `<div class="collage__item collage__item--b parallax" data-speed="0.08">${picture('cellar-1', { alt: 'Podrum vinarije Veritas', sizes: '(max-width: 767px) 60vw, 25vw' })}</div>`,
    ...stock.map(
      (id, i) =>
        `<div class="collage__item collage__item--glass collage__item--g${i + 1} glass-in parallax" data-speed="${i % 2 ? 0.1 : -0.04}">${picture(id, { alt: 'Čaša crvenog vina', sizes: '(max-width: 767px) 50vw, 22vw' })}</div>`,
    ),
  ];
  return `<section class="cellar${bg.cls || ''}" id="podrum" aria-labelledby="cellar-title"${bg.style}>
  ${bg.html}
  <div class="cellar__vignette" aria-hidden="true"></div>
  <div class="container cellar__grid">
    <div class="cellar__text">
      <header class="section-head"><p class="eyebrow" ${tx('cellar.eyebrow')}</p><h2 class="section-title" id="cellar-title" data-split ${tx('cellar.title')}</h2><span class="hairline" aria-hidden="true"></span></header>
      <p class="lead reveal" ${tx('cellar.p1')}</p>
      <p class="reveal" ${tx('cellar.p2')}</p>
      <div class="capacity reveal"><span class="capacity__number">${esc(t('cellar.capacityNumber', 'sr'))}</span><span class="capacity__unit" ${tx('cellar.capacityUnit')}</span></div>
      <p class="reveal" ${tx('cellar.p3')}</p>
    </div>
    <div class="collage collage--${tiles.length}">${tiles.join('')}</div>
  </div>
</section>`;
}

// ---------- Visits ----------
function visits() {
  const bg = sectionBg('visits');
  const cards = [
    ['vine', 'visits.card1'],
    ['cheese', 'visits.card2'],
    ['briefcase', 'visits.card3'],
    ['toast', 'visits.card4'],
  ];
  return `<section class="visits${bg.cls || ''}" id="posete" aria-labelledby="visits-title"${bg.style}>
  ${bg.html}
  <div class="container">
    <header class="section-head section-head--center"><p class="eyebrow" ${tx('visits.eyebrow')}</p><h2 class="section-title" id="visits-title" data-split ${tx('visits.title')}</h2><span class="hairline hairline--center" aria-hidden="true"></span></header>
    <div class="visits__intro reveal"><p ${tx('visits.intro1')}</p><p ${tx('visits.intro2')}</p></div>
    <div class="visits__grid">
      <div class="visits__text">
        <p class="reveal" ${tx('visits.p1')}</p>
        <p class="reveal" ${tx('visits.p2')}</p>
        <p class="reveal" ${tx('visits.p3')}</p>
        <p class="reveal visits__notice">${icon('clock')}<span ${tx('visits.p4')}</span></p>
        <p class="reveal" ${tx('visits.p5')}</p>
      </div>
      <div class="visits__media">
        <div class="visits__img visits__img--1 reveal">${picture('visits-1', { alt: 'Degustacija u vinariji Veritas', sizes: '(max-width: 767px) 100vw, 40vw' })}</div>
        <div class="visits__img visits__img--2 reveal">${picture('visits-2', { alt: 'Događaj u vinariji Veritas', sizes: '(max-width: 767px) 70vw, 25vw' })}</div>
      </div>
    </div>
    <ul class="cards">${cards.map(([ic, key]) => `<li class="card reveal">${icon(ic, 'card__icon')}<span ${tx(key)}</span></li>`).join('')}</ul>
    <div class="booking-inline reveal" id="zakazi">
      <h3 class="booking-inline__title" ${tx('booking.title')}</h3>
      ${bookingForm('bi')}
    </div>
  </div>
</section>`;
}

// ---------- Gallery ----------
function gallery() {
  const bg = sectionBg('gallery');
  const m = getManifest();
  // Only photos that actually exist (winery originals first, then supplied photos and drone stills).
  const ids = [...Object.keys(galleryImages), ...(m.galleryExtra || []), ...Object.keys(localImages).filter((id) => !id.startsWith('dron-'))].filter(hasImage);
  const items = ids
    .map((id, i) => {
      const meta = imageMeta(id);
      const shape = meta ? (meta.width / meta.height > 1.25 ? 'wide' : meta.width / meta.height < 0.85 ? 'tall' : 'square') : ['wide', 'tall', 'square'][i % 3];
      return `<li class="gallery__item gallery__item--${shape}${i >= 12 ? ' is-extra' : ''}"><button type="button" class="gallery__btn" data-gallery-index="${i}" data-gallery-id="${id}" data-i18n-attr="aria-label:gallery.open" aria-label="${esc(t('gallery.open', 'sr'))}">${picture(id, { alt: `${t('gallery.photo', 'sr')} ${i + 1}`, sizes: '(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 25vw' })}</button></li>`;
    })
    .join('');
  return `<section class="gallery${bg.cls || ''}" id="galerija" aria-labelledby="gallery-title"${bg.style}>
  ${bg.html}
  <div class="container">
    ${heading('gallery.eyebrow', 'gallery.title', 'h2', 'section-head--center').replace('class="section-title"', 'class="section-title" id="gallery-title"')}
    <ul class="gallery__grid" data-collapsed="true">${items}</ul>
    <div class="gallery__more"><button type="button" class="btn btn--outline" data-gallery-more><span ${tx('gallery.more')}</span></button></div>
  </div>
</section>`;
}

// ---------- Where to buy ----------
function shops() {
  const bg = sectionBg('shops');
  return `<section class="shops${bg.cls || ''}" id="gde-kupiti" aria-labelledby="shops-title"${bg.style}>
  ${bg.html}
  <div class="container">
    <header class="section-head section-head--center"><p class="eyebrow" ${tx('shops.eyebrow')}</p><h2 class="section-title section-title--md" id="shops-title" data-split ${tx('shops.title')}</h2><span class="hairline hairline--center" aria-hidden="true"></span></header>
    <div class="map-frame reveal"><iframe src="${site.maps.shops}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" data-i18n-attr="title:shops.mapTitle" title="${esc(t('shops.mapTitle', 'sr'))}" allowfullscreen></iframe></div>
  </div>
</section>`;
}

// ---------- Contact ----------
function contact() {
  const c = site.contact;
  const bg = sectionBg('contact');
  const hours = c.openingHours
    ? `<li>${icon('clock')}<div><span class="contact__label" ${tx('contact.hours')}</span><span>${esc(c.openingHours)}</span></div></li>`
    : '';
  return `<section class="contact${bg.cls || ''}" id="kontakt" aria-labelledby="contact-title"${bg.style}>
  ${bg.html}
  <div class="container contact__grid">
    <div class="contact__info">
      <header class="section-head"><p class="eyebrow" ${tx('contact.eyebrow')}</p><h2 class="section-title" id="contact-title" data-split ${tx('contact.title')}</h2><span class="hairline" aria-hidden="true"></span></header>
      <ul class="contact__list">
        <li>${icon('pin')}<div><span class="contact__label" ${tx('contact.address')}</span><address>${esc(c.address.full)}</address></div></li>
        <li>${icon('phone')}<div><span class="contact__label" ${tx('contact.phone')}</span><a href="${c.phone.href}">${esc(c.phone.display)}</a></div></li>
        <li>${icon('mail')}<div><span class="contact__label" ${tx('contact.email')}</span><a href="mailto:${c.email}">${esc(c.email)}</a></div></li>
        <li>${icon('instagram')}<div><span class="contact__label" ${tx('contact.instagram')}</span><a href="${c.instagram.url}" target="_blank" rel="noopener">${esc(c.instagram.handle)}</a></div></li>
        ${hours}
      </ul>
      <div class="contact__ctas">
        <a class="btn btn--solid btn--shimmer" href="${site.maps.directions}" target="_blank" rel="noopener">${icon('pin')}<span ${tx('contact.directions')}</span></a>
        ${bookBtn('btn btn--outline btn--shimmer')}
      </div>
    </div>
    <div class="map-frame map-frame--tall reveal"><iframe src="${site.maps.embed}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" data-i18n-attr="title:contact.mapTitle" title="${esc(t('contact.mapTitle', 'sr'))}" allowfullscreen></iframe></div>
  </div>
</section>`;
}

// ---------- Footer ----------
function footer() {
  const c = site.contact;
  const winery = navItems.filter(([id]) => id !== 'vina').map(([id, key]) => `<li><a href="#${id}" ${tx(key)}</a></li>`).join('');
  const wineLinks = wines.map((w, i) => `<li><a href="#vina" data-goto-wine="${i}">${esc(w.name)}</a></li>`).join('');
  return `<footer class="site-footer">
  <div class="container footer__grid">
    <div class="footer__brand">
      ${logo({ variant: 'white', className: 'logo--gold footer__logo' })}
      <p class="footer__tagline"><em ${tx('footer.tagline')}</em></p>
    </div>
    <nav class="footer__col" aria-labelledby="f-winery"><h3 id="f-winery" ${tx('footer.colWinery')}</h3><ul>${winery}</ul></nav>
    <nav class="footer__col" aria-labelledby="f-wines"><h3 id="f-wines" ${tx('footer.colWines')}</h3><ul>${wineLinks}</ul></nav>
    <div class="footer__col"><h3 ${tx('footer.colContact')}</h3>
      <ul class="footer__contact">
        <li><address>${esc(c.address.full)}</address></li>
        <li><a href="${c.phone.href}">${esc(c.phone.display)}</a></li>
        <li><a href="mailto:${c.email}">${esc(c.email)}</a></li>
        <li><a href="${c.instagram.url}" target="_blank" rel="noopener" class="footer__ig" aria-label="Instagram ${esc(c.instagram.handle)}">${icon('instagram')}</a></li>
      </ul>
    </div>
    <div class="footer__col footer__newsletter"><h3 ${tx('footer.newsletterTitle')}</h3><p><em ${tx('footer.newsletterText')}</em></p>${newsletterForm()}</div>
  </div>
  <div class="footer__bottom container">
    <p>© <span data-year>${new Date().getFullYear()}</span> <span ${tx('footer.rights')}</span></p>
    <p class="footer__legal"><a href="${site.legal.terms}" ${tx('footer.terms')}</a><span aria-hidden="true">·</span><a href="${site.legal.privacy}" ${tx('footer.privacy')}</a></p>
    <p class="footer__age" ${tx('footer.legalAge')}</p>
  </div>
</footer>`;
}

// ---------- Overlays ----------
function overlays() {
  return `<div class="drawer-backdrop" data-close-cart hidden></div>
<aside class="cart" id="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" hidden>
  <div class="cart__head">
    <h2 class="cart__title" id="cart-title"><span data-cart-view-title ${tx('cart.title')}</span></h2>
    <button type="button" class="icon-btn" data-close-cart data-i18n-attr="aria-label:cart.close" aria-label="${esc(t('cart.close', 'sr'))}">${icon('close')}</button>
  </div>
  <div class="cart__view cart__view--items" data-cart-view="items">
    <ul class="cart__lines" data-cart-lines></ul>
    <p class="cart__empty" data-cart-empty ${tx('cart.empty')}</p>
    <div class="cart__foot" data-cart-foot>
      <div class="cart__progress"><div class="progress"><span class="progress__bar" data-free-bar></span></div><p class="cart__progress-text" data-free-text></p></div>
      <dl class="cart__totals">
        <div><dt ${tx('cart.subtotal')}</dt><dd data-cart-subtotal></dd></div>
        <div><dt ${tx('cart.delivery')}</dt><dd data-cart-delivery></dd></div>
      </dl>
      <p class="cart__note" data-cart-note></p>
      <p class="cart__min" data-cart-min ${tx('cart.minMessage')}</p>
      <button type="button" class="btn btn--solid btn--shimmer btn--block" data-checkout-start><span ${tx('cart.checkout')}</span></button>
    </div>
  </div>
  <div class="cart__view cart__view--checkout" data-cart-view="checkout" hidden>
    <button type="button" class="link-btn" data-checkout-back>${icon('left')}<span ${tx('checkout.back')}</span></button>
    <div class="checkout__summary" data-checkout-summary></div>
    ${checkoutForm()}
  </div>
  <div class="cart__view cart__view--success" data-cart-view="success" hidden>
    <div class="success" data-order-success></div>
  </div>
</aside>
<div class="modal" id="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title" hidden>
  <div class="modal__backdrop" data-close-modal></div>
  <div class="modal__panel">
    <button type="button" class="icon-btn modal__close" data-close-modal data-i18n-attr="aria-label:booking.close" aria-label="${esc(t('booking.close', 'sr'))}">${icon('close')}</button>
    <h2 class="modal__title" id="booking-modal-title" ${tx('booking.title')}</h2>
    ${bookingForm('bm')}
  </div>
</div>
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" data-i18n-attr="aria-label:gallery.title" aria-label="${esc(t('gallery.title', 'sr'))}" hidden>
  <figure class="lightbox__stage"><img class="lightbox__img" alt=""></figure>
  <p class="lightbox__counter" aria-live="polite"></p>
  <button type="button" class="icon-btn lightbox__close" data-i18n-attr="aria-label:gallery.close" aria-label="${esc(t('gallery.close', 'sr'))}">${icon('close')}</button>
  <button type="button" class="round-btn lightbox__prev" data-i18n-attr="aria-label:gallery.prev" aria-label="${esc(t('gallery.prev', 'sr'))}">${icon('left')}</button>
  <button type="button" class="round-btn lightbox__next" data-i18n-attr="aria-label:gallery.next" aria-label="${esc(t('gallery.next', 'sr'))}">${icon('right')}</button>
</div>
<div class="cursor" aria-hidden="true"><span class="cursor__label" data-i18n="wines.drag">${esc(t('wines.drag', 'sr'))}</span></div>
<div class="grain" aria-hidden="true"></div>`;
}

export function renderBody() {
  return `<a class="skip-link" href="#main" ${tx('nav.skipToContent')}</a>
${intro()}
${header()}
<main id="main">
${hero()}
${winesSection()}
${about()}
${vineyards()}
${cellar()}
${visits()}
${gallery()}
${shops()}
${contact()}
</main>
${footer()}
${overlays()}`;
}
