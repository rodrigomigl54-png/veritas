// Cart drawer, checkout and order confirmation.
import { site } from '../config/site.js';
import { t } from '../i18n/index.js';
import { picture, esc } from '../render/picture.js';
import { icon } from '../render/icons.js';
import { createDialog } from '../ui/dialog.js';
import { formatPrice, bottleWord } from './format.js';
import * as cart from './cart.js';
import { getProvider } from './payment.js';
import { sendForm } from '../forms/submit.js';
import { errorHtml } from '../forms/errors.js';
import { validateForm, liveValidate, setStatus, setLoading } from '../forms/validate.js';

const $ = (sel, root = document) => root.querySelector(sel);

export function orderNumber(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  const ymd = `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`;
  const rnd = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${site.shop.orderPrefix}-${ymd}-${rnd}`;
}

function deliveryText(state) {
  if (state.freeDelivery) return t('cart.deliveryFree');
  return state.delivery == null ? '—' : formatPrice(state.delivery);
}

function summaryHtml(state) {
  const rows = state.lines.map((l) => `<li><span>${l.qty} × ${esc(l.wine.name)}</span><span>${formatPrice(l.lineTotal)}</span></li>`).join('');
  return `<ul>${rows}</ul>
    <div class="sum-row"><span>${esc(t('cart.subtotal'))}</span><span>${formatPrice(state.subtotal)}</span></div>
    <div class="sum-row"><span>${esc(t('cart.delivery'))}</span><span>${esc(deliveryText(state))}</span></div>
    ${state.delivery == null && !state.freeDelivery ? `<p class="cart__note">${esc(t('cart.deliveryTbd'))}</p>` : ''}`;
}

export function initCart() {
  const drawer = document.getElementById('cart');
  const backdrop = $('.drawer-backdrop');
  const views = {
    items: $('[data-cart-view="items"]', drawer),
    checkout: $('[data-cart-view="checkout"]', drawer),
    success: $('[data-cart-view="success"]', drawer),
  };
  const titleSpan = $('[data-cart-view-title]', drawer);
  const form = $('[data-checkout-form]', drawer);
  let view = 'items';

  const showView = (name) => {
    view = name;
    Object.entries(views).forEach(([k, el]) => (el.hidden = k !== name));
    titleSpan.dataset.i18n = name === 'checkout' ? 'checkout.title' : 'cart.title';
    titleSpan.textContent = t(titleSpan.dataset.i18n);
    views[name].scrollTop = 0;
  };

  const dialog = createDialog(drawer, {
    backdrop,
    onClose: () => {
      if (view === 'success') showView('items');
    },
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-cart]')) dialog.open();
    if (e.target.closest('[data-close-cart]')) dialog.close();
  });

  // ---------- Rendering ----------
  const badge = $('[data-cart-count]');
  const cartBtn = $('.cart-btn');
  let lastCount = null;

  const render = (state) => {
    // Header badge
    badge.hidden = state.bottles === 0;
    badge.textContent = String(state.bottles);
    cartBtn.setAttribute('aria-label', `${t('nav.cart')} (${state.bottles})`);
    if (lastCount !== null && state.bottles > lastCount) {
      cartBtn.classList.remove('is-bump');
      void cartBtn.offsetWidth;
      cartBtn.classList.add('is-bump');
    }
    lastCount = state.bottles;

    // Lines
    $('[data-cart-lines]', drawer).innerHTML = state.lines
      .map(
        (l) => `<li class="line" data-id="${l.wine.id}">
        <div class="line__thumb">${picture(l.wine.image, { alt: '', sizes: '56px' })}</div>
        <div><p class="line__name">${esc(l.wine.name)}</p><p class="line__unit">${esc(t('cart.unitPrice'))}: ${formatPrice(l.wine.price)}</p></div>
        <button type="button" class="line__remove" data-remove="${l.wine.id}">${esc(t('cart.remove'))}<span class="sr-only"> ${esc(l.wine.name)}</span></button>
        <div class="line__controls">
          <div class="stepper stepper--sm" role="group" aria-label="${esc(t('wines.quantity'))} — ${esc(l.wine.name)}">
            <button type="button" class="stepper__btn" data-line-step="-1" aria-label="${esc(t('wines.decrease'))}">${icon('minus')}</button>
            <input class="stepper__input" type="number" min="1" max="99" value="${l.qty}" data-line-qty aria-label="${esc(t('wines.quantity'))}">
            <button type="button" class="stepper__btn" data-line-step="1" aria-label="${esc(t('wines.increase'))}">${icon('plus')}</button>
          </div>
          <span class="line__total">${formatPrice(l.lineTotal)}</span>
        </div>
      </li>`,
      )
      .join('');

    const empty = state.lines.length === 0;
    $('[data-cart-empty]', drawer).hidden = !empty;
    $('[data-cart-foot]', drawer).hidden = empty;

    // Free-delivery progress
    const ratio = Math.min(1, state.bottles / site.shop.freeDeliveryFrom);
    $('[data-free-bar]', drawer).style.width = `${ratio * 100}%`;
    $('[data-free-text]', drawer).textContent = state.freeDelivery
      ? t('cart.freeDelivery')
      : t('cart.toFreeDelivery', undefined, { n: state.missingForFree, bottles: bottleWord(state.missingForFree, t) });

    $('[data-cart-subtotal]', drawer).textContent = formatPrice(state.subtotal);
    $('[data-cart-delivery]', drawer).textContent = deliveryText(state);
    $('[data-cart-note]', drawer).textContent = !state.freeDelivery && state.delivery == null ? t('cart.deliveryTbd') : '';
    $('[data-cart-min]', drawer).hidden = state.canCheckout;
    const go = $('[data-checkout-start]', drawer);
    go.disabled = !state.canCheckout;
    go.setAttribute('aria-describedby', state.canCheckout ? '' : 'cart-min-msg');
    $('[data-cart-min]', drawer).id = 'cart-min-msg';

    $('[data-checkout-summary]', drawer).innerHTML = summaryHtml(state);
    if (view === 'checkout' && !state.canCheckout) showView('items');
  };
  cart.subscribe(render);
  document.addEventListener('langchange', () => render(cart.getState()));

  // ---------- Line interactions ----------
  drawer.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      cart.remove(rm.dataset.remove);
      $('[data-close-cart]', drawer).focus();
      return;
    }
    const step = e.target.closest('[data-line-step]');
    if (step) {
      const id = step.closest('.line').dataset.id;
      const line = cart.getState().lines.find((l) => l.id === id);
      cart.setQty(id, line.qty + Number(step.dataset.lineStep));
      // Keep focus on the same control after re-render.
      $(`.line[data-id="${id}"] [data-line-step="${step.dataset.lineStep}"]`, drawer)?.focus();
    }
  });
  drawer.addEventListener('change', (e) => {
    if (!e.target.matches('[data-line-qty]')) return;
    const id = e.target.closest('.line').dataset.id;
    cart.setQty(id, Math.max(1, Number(e.target.value) || 1));
  });

  $('[data-checkout-start]', drawer).addEventListener('click', () => {
    if (!cart.getState().canCheckout) return;
    showView('checkout');
    setStatus(form, null, '');
    $('input', form).focus();
  });
  $('[data-checkout-back]', drawer).addEventListener('click', () => showView('items'));

  // ---------- Add to cart from the wine panels ----------
  document.addEventListener('click', (e) => {
    const step = e.target.closest('.wine-panel [data-step]');
    if (step) {
      const input = step.parentElement.querySelector('.stepper__input');
      input.value = String(Math.min(99, Math.max(1, (Number(input.value) || 1) + Number(step.dataset.step))));
      return;
    }
    const addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) {
      const input = addBtn.closest('.wine-panel').querySelector('.stepper__input');
      const qty = Math.min(99, Math.max(1, Number(input.value) || 1));
      cart.add(addBtn.dataset.addToCart, qty);
      input.value = '1';
      const label = addBtn.querySelector('span');
      label.textContent = t('wines.added');
      setTimeout(() => (label.textContent = t('wines.addToCart')), 1600);
    }
  });

  // ---------- Checkout submit ----------
  liveValidate(form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus(form, null, '');
    const state = cart.getState();
    if (!state.canCheckout) return showView('items');
    if (!validateForm(form)) return;
    const d = Object.fromEntries(new FormData(form));
    const order = {
      number: orderNumber(),
      createdAt: new Date().toISOString(),
      customer: { name: d.name, phone: d.phone, email: d.email, address: d.address, city: d.city, zip: d.zip, note: d.note || '' },
      lines: state.lines.map((l) => ({ id: l.wine.id, name: l.wine.name, qty: l.qty, unitPrice: l.wine.price, total: l.lineTotal })),
      bottles: state.bottles,
      subtotal: state.subtotal,
      delivery: state.delivery,
      freeDelivery: state.freeDelivery,
      total: state.total,
      payment: d.payment || 'cod',
    };
    setLoading(form, true, 'checkout.sending');
    try {
      const result = await getProvider(order.payment).pay(order);
      if (result.status === 'redirect' && result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      const itemsText = order.lines.map((l) => `${l.qty} × ${l.name} — ${formatPrice(l.unitPrice)} = ${formatPrice(l.total)}`).join('\n');
      await sendForm(
        {
          'Broj porudžbine': order.number,
          Vreme: new Date(order.createdAt).toLocaleString('sr-Latn-RS'),
          'Ime i prezime': order.customer.name,
          Telefon: order.customer.phone,
          Email: order.customer.email,
          Adresa: order.customer.address,
          Grad: order.customer.city,
          'Poštanski broj': order.customer.zip,
          Napomena: order.customer.note || '—',
          Stavke: itemsText,
          'Broj boca': String(order.bottles),
          Međuzbir: formatPrice(order.subtotal),
          Isporuka: order.freeDelivery ? 'Besplatna (6+ boca)' : order.delivery == null ? 'Biće potvrđena' : formatPrice(order.delivery),
          Ukupno: formatPrice(order.total),
          'Način plaćanja': 'Plaćanje pouzećem',
          'Potvrda 18+': 'Da',
          'Prihvaćeni uslovi': 'Da',
          'Porudžbina (JSON)': JSON.stringify(order),
        },
        { subject: `Nova porudžbina ${order.number} — ${order.customer.name}`, replyTo: order.customer.email, fromName: order.customer.name, botcheck: d.botcheck, ccEmail: order.customer.email },
      );
      $('[data-order-success]', drawer).innerHTML = `${icon('glass', 'success__icon')}
        <h3 class="success__title">${esc(t('checkout.successTitle'))}</h3>
        <p class="success__number">${esc(t('checkout.orderNumber'))}: <strong>${esc(order.number)}</strong></p>
        <div class="checkout__summary"><p class="eyebrow">${esc(t('checkout.summary'))}</p>${summaryHtml(state)}
          <div class="sum-row"><span>${esc(t('checkout.total'))}</span><span>${formatPrice(order.total)}</span></div></div>
        <button type="button" class="btn btn--outline btn--block" data-close-cart>${esc(t('checkout.done'))}</button>`;
      form.reset();
      cart.clear();
      showView('success');
      $('[data-order-success] .success__title', drawer).setAttribute('tabindex', '-1');
      $('[data-order-success] .success__title', drawer).focus();
    } catch (err) {
      console.error(err);
      setStatus(form, 'error', errorHtml(err));
    } finally {
      setLoading(form, false);
    }
  });

  return { open: dialog.open, close: dialog.close };
}

