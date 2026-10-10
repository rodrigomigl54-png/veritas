// Form markup: booking ("Zakaži termin"), checkout, newsletter.
import { visitTypes, visitTimes } from '../config/site.js';
import { t } from '../i18n/index.js';
import { esc } from './picture.js';
import { icon } from './icons.js';

const tx = (key) => `data-i18n="${key}">${esc(t(key, 'sr'))}`;

function field({ id, key, type = 'text', required = true, autocomplete, attrs = '', full = false }) {
  return `<div class="field${full ? ' field--full' : ''}">
    <label for="${id}"><span ${tx(key)}</span>${required ? '<span class="req" aria-hidden="true">*</span>' : ''}</label>
    <input id="${id}" name="${id.split('-').pop()}" type="${type}"${required ? ' required aria-required="true"' : ''}${autocomplete ? ` autocomplete="${autocomplete}"` : ''} ${attrs}>
    <p class="field__error" id="${id}-error" aria-live="polite"></p>
  </div>`;
}

const honeypot = (prefix) =>
  `<div class="hp" aria-hidden="true"><label for="${prefix}-company">Company</label><input id="${prefix}-company" name="botcheck" type="text" tabindex="-1" autocomplete="off"></div>`;

const status = () => `<div class="form__status" role="status" aria-live="polite"></div>`;

export function bookingForm(prefix) {
  const types = visitTypes.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  const times = visitTimes.map((v) => `<option value="${v}">${v}</option>`).join('');
  return `<form class="form booking-form" data-booking-form novalidate>
    <div class="form__grid">
      ${field({ id: `${prefix}-name`, key: 'booking.name', autocomplete: 'name' })}
      ${field({ id: `${prefix}-phone`, key: 'booking.phone', type: 'tel', autocomplete: 'tel' })}
      ${field({ id: `${prefix}-email`, key: 'booking.email', type: 'email', autocomplete: 'email' })}
      <div class="field">
        <label for="${prefix}-type"><span ${tx('booking.visitType')}</span><span class="req" aria-hidden="true">*</span></label>
        <div class="select"><select id="${prefix}-type" name="type" required aria-required="true"><option value="" ${tx('booking.choose')}</option>${types}</select>${icon('down')}</div>
        <p class="field__error" id="${prefix}-type-error" aria-live="polite"></p>
      </div>
      <div class="field">
        <label for="${prefix}-date"><span ${tx('booking.date')}</span><span class="req" aria-hidden="true">*</span></label>
        <input id="${prefix}-date" name="date" type="date" required aria-required="true" aria-describedby="${prefix}-date-hint" data-min-notice>
        <p class="field__hint" id="${prefix}-date-hint" ${tx('booking.hint')}</p>
        <p class="field__error" id="${prefix}-date-error" aria-live="polite"></p>
      </div>
      <div class="field">
        <label for="${prefix}-time"><span ${tx('booking.time')}</span><span class="req" aria-hidden="true">*</span></label>
        <div class="select"><select id="${prefix}-time" name="time" required aria-required="true"><option value="" ${tx('booking.choose')}</option>${times}</select>${icon('down')}</div>
        <p class="field__error" id="${prefix}-time-error" aria-live="polite"></p>
      </div>
      ${field({ id: `${prefix}-people`, key: 'booking.people', type: 'number', attrs: 'min="1" step="1" inputmode="numeric" value="2"' })}
      <div class="field field--full">
        <label for="${prefix}-note"><span ${tx('booking.note')}</span></label>
        <textarea id="${prefix}-note" name="note" rows="3"></textarea>
      </div>
    </div>
    ${honeypot(prefix)}
    <p class="form__required" ${tx('form.requiredNote')}</p>
    ${status()}
    <button type="submit" class="btn btn--solid btn--shimmer form__submit"><span ${tx('booking.submit')}</span></button>
  </form>`;
}

export function checkoutForm() {
  const p = 'co';
  return `<form class="form checkout-form" data-checkout-form novalidate>
    <div class="form__grid">
      ${field({ id: `${p}-name`, key: 'checkout.name', autocomplete: 'name', full: true })}
      ${field({ id: `${p}-phone`, key: 'checkout.phone', type: 'tel', autocomplete: 'tel' })}
      ${field({ id: `${p}-email`, key: 'checkout.email', type: 'email', autocomplete: 'email' })}
      ${field({ id: `${p}-address`, key: 'checkout.address', autocomplete: 'street-address', full: true })}
      ${field({ id: `${p}-city`, key: 'checkout.city', autocomplete: 'address-level2' })}
      ${field({ id: `${p}-zip`, key: 'checkout.zip', autocomplete: 'postal-code', attrs: 'inputmode="numeric"' })}
      <div class="field field--full">
        <label for="${p}-note"><span ${tx('checkout.note')}</span></label>
        <textarea id="${p}-note" name="note" rows="2"></textarea>
      </div>
    </div>
    <fieldset class="payment">
      <legend ${tx('checkout.payment')}</legend>
      <label class="radio"><input type="radio" name="payment" value="cod" checked><span ${tx('checkout.cod')}</span></label>
      <label class="radio is-disabled"><input type="radio" name="payment" value="card" disabled><span ${tx('checkout.card')}</span></label>
    </fieldset>
    <div class="field field--check">
      <label class="check"><input type="checkbox" id="${p}-age" name="age" required aria-required="true"><span><span ${tx('checkout.age')}</span><span class="req" aria-hidden="true">*</span></span></label>
      <p class="field__error" id="${p}-age-error" aria-live="polite"></p>
    </div>
    <div class="field field--check">
      <label class="check"><input type="checkbox" id="${p}-terms" name="terms" required aria-required="true"><span><span data-i18n-html="checkout.termsHtml">${t('checkout.termsHtml', 'sr')}</span><span class="req" aria-hidden="true">*</span></span></label>
      <p class="field__error" id="${p}-terms-error" aria-live="polite"></p>
    </div>
    ${honeypot(p)}
    ${status()}
    <button type="submit" class="btn btn--solid btn--shimmer form__submit btn--block"><span ${tx('checkout.submit')}</span></button>
  </form>`;
}

export function newsletterForm() {
  return `<form class="newsletter" data-newsletter-form novalidate>
    <label for="nl-email" class="sr-only" ${tx('booking.email')}</label>
    <div class="newsletter__row">
      <input id="nl-email" name="email" type="email" required autocomplete="email" data-i18n-attr="placeholder:footer.newsletterPlaceholder" placeholder="${esc(t('footer.newsletterPlaceholder', 'sr'))}">
      <button type="submit" class="btn btn--outline btn--small"><span ${tx('footer.newsletterSubmit')}</span></button>
    </div>
    ${honeypot('nl')}
    <p class="field__error" id="nl-email-error" aria-live="polite"></p>
    ${status()}
  </form>`;
}
