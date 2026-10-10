// Wine carousel markup — shared by the build-time renderer and the client (language switch).
import { wines } from '../config/site.js';
import { t, loc } from '../i18n/index.js';
import { formatPrice } from '../shop/format.js';
import { picture, esc } from './picture.js';
import { icon } from './icons.js';

const pad = (n) => String(n).padStart(2, '0');

function specRows(w, lang) {
  const s = w.specs;
  const rows = [
    ['wines.variety', s.variety, 'grape'],
    ['wines.type', loc(s.type, lang), 'wine'],
    ['wines.aging', loc(s.aging, lang), 'barrel'],
    ['wines.vintage', s.vintage, 'calendar'],
    ['wines.temperature', s.temperature, 'thermo'],
  ].filter(([, v]) => v);
  return rows
    .map(([key, value, ic]) => `<div class="spec"><dt>${icon(ic, 'spec__icon')}<span>${esc(t(key, lang))}</span></dt><dd>${esc(value)}</dd></div>`)
    .join('');
}

function awards(w, lang) {
  if (!w.awards) return '';
  const badges = w.awards.badges
    .map(
      (b) =>
        `<li class="award award--${b.tier}">${icon('medal', 'award__icon')}<span class="award__event">${esc(b.event)}</span><span class="award__medal">${esc(loc(b.medal, lang))}</span></li>`,
    )
    .join('');
  return `<div class="wine-panel__awards" data-stagger>
    <ul class="awards" aria-label="${esc(t('wines.showAwards', lang))}">${badges}</ul>
    <details class="awards__details">
      <summary><span class="awards__show">${esc(t('wines.showAwards', lang))}</span><span class="awards__hide">${esc(t('wines.hideAwards', lang))}</span>${icon('down')}</summary>
      <p>${esc(loc(w.awards.text, lang))}</p>
    </details>
  </div>`;
}

export function winePanel(w, i, lang = 'sr') {
  return `<article class="wine-panel${w.flagship ? ' wine-panel--flagship' : ''}" data-wine="${w.id}" data-index="${i}" id="vino-${w.id}" aria-roledescription="slide" aria-label="${pad(i + 1)} / ${pad(wines.length)}: ${esc(w.name)}"${i === 0 ? '' : ' hidden'}>
    <h3 class="wine-panel__name" data-stagger>${esc(w.name)}</h3>
    <div data-stagger>
      <p class="wine-panel__label eyebrow">${esc(t('wines.characteristics', lang))}</p>
      <p class="wine-panel__desc">${esc(loc(w.description, lang))}</p>
    </div>
    <dl class="wine-panel__specs" data-stagger>${specRows(w, lang)}</dl>
    <div class="wine-panel__pricing" data-stagger>
      <p class="wine-panel__price">${formatPrice(w.price)}</p>
      <p class="wine-panel__note"><em>${esc(t('wines.priceNote', lang))}</em></p>
    </div>
    <div class="wine-panel__buy" data-stagger>
      <div class="stepper" role="group" aria-label="${esc(t('wines.quantity', lang))}">
        <button type="button" class="stepper__btn" data-step="-1" aria-label="${esc(t('wines.decrease', lang))}">${icon('minus')}</button>
        <input class="stepper__input" type="number" inputmode="numeric" min="1" max="99" value="1" aria-label="${esc(t('wines.quantity', lang))}">
        <button type="button" class="stepper__btn" data-step="1" aria-label="${esc(t('wines.increase', lang))}">${icon('plus')}</button>
      </div>
      <button type="button" class="btn btn--solid btn--shimmer" data-add-to-cart="${w.id}">${icon('cart')}<span>${esc(t('wines.addToCart', lang))}</span></button>
    </div>
    ${awards(w, lang)}
  </article>`;
}

export function winePanels(lang = 'sr') {
  return wines.map((w, i) => winePanel(w, i, lang)).join('');
}

export function wineBottles() {
  return wines
    .map(
      (w, i) => `<button type="button" class="bottle" data-index="${i}" data-wine="${w.id}" tabindex="-1" aria-label="${esc(w.name)}" style="--accent:${w.theme.accent}">
        <span class="bottle__inner">${picture(w.image, { alt: w.name, sizes: '(max-width: 767px) 40vw, 260px', className: 'bottle__img', eager: i === 0 })}
        <span class="bottle__reflection" aria-hidden="true">${picture(w.image, { alt: '', sizes: '(max-width: 767px) 40vw, 260px', className: 'bottle__img' })}</span></span>
      </button>`,
    )
    .join('');
}

export function wineBackgrounds() {
  return wines
    .map(
      (w, i) =>
        `<div class="wines__bg-layer${i === 0 ? ' is-active' : ''}" data-index="${i}" style="--from:${w.theme.from};--to:${w.theme.to};--accent:${w.theme.accent}"></div>`,
    )
    .join('');
}

export function wineLabels() {
  return wines
    .map((w, i) => `<li><button type="button" class="wines__label" data-goto="${i}" aria-controls="vino-${w.id}"${i === 0 ? ' aria-current="true"' : ''}>${esc(w.name)}</button></li>`)
    .join('');
}
