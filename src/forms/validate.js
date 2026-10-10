// Inline form validation with accessible error messages.
import { t } from '../i18n/index.js';
import { minNoticeHours } from '../config/site.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s/().-]{6,20}$/;

const pad = (n) => String(n).padStart(2, '0');
export const toDateValue = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const earliestVisit = () => new Date(Date.now() + minNoticeHours * 3600 * 1000);

// Combines a date input value (YYYY-MM-DD) and an optional HH:MM time into a local Date.
export function visitDateTime(date, time = '23:59') {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

function check(el, form) {
  const v = el.type === 'checkbox' ? el.checked : el.value.trim();
  if (el.required && !v) return el.type === 'checkbox' ? 'form.mustAccept' : 'form.required';
  if (!v) return null;
  if (el.type === 'email' && !EMAIL.test(v)) return 'form.invalidEmail';
  if (el.type === 'tel' && !PHONE.test(v)) return 'form.invalidPhone';
  if (el.type === 'number' && (!Number.isInteger(Number(v)) || Number(v) < Number(el.min || 1))) return 'form.invalidPeople';
  if (el.hasAttribute('data-min-notice')) {
    const time = form.querySelector('select[name="time"]')?.value || '23:59';
    if (visitDateTime(v, time) < earliestVisit()) return 'form.invalidDate';
  }
  return null;
}

export function setError(el, key) {
  const field = el.closest('.field');
  const out = document.getElementById(`${el.id}-error`);
  field?.classList.toggle('is-invalid', !!key);
  if (key) {
    el.setAttribute('aria-invalid', 'true');
    if (out) {
      el.setAttribute('aria-describedby', [el.getAttribute('aria-describedby'), out.id].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' '));
      out.textContent = t(key);
    }
  } else {
    el.removeAttribute('aria-invalid');
    if (out) out.textContent = '';
  }
}

export function validateForm(form) {
  const fields = [...form.querySelectorAll('input, select, textarea')].filter((el) => !el.closest('.hp') && el.type !== 'radio');
  let first = null;
  fields.forEach((el) => {
    const err = check(el, form);
    setError(el, err);
    if (err && !first) first = el;
  });
  first?.focus();
  return !first;
}

// Clears an error as soon as the field becomes valid.
export function liveValidate(form) {
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (el.getAttribute('aria-invalid') === 'true' && !check(el, form)) setError(el, null);
  });
  form.addEventListener('change', (e) => {
    const el = e.target;
    if (el.getAttribute('aria-invalid') === 'true' && !check(el, form)) setError(el, null);
  });
}

export function setStatus(form, type, html) {
  const box = form.querySelector('.form__status');
  if (!box) return;
  box.className = `form__status${type ? ` is-${type}` : ''}`;
  box.innerHTML = html || '';
}

export function setLoading(form, loading, labelKey) {
  const btn = form.querySelector('[type="submit"]');
  if (!btn) return;
  btn.classList.toggle('is-loading', loading);
  btn.disabled = loading;
  const span = btn.querySelector('span[data-i18n]');
  if (span) {
    if (loading) {
      span.dataset.i18nIdle = span.dataset.i18n;
      span.dataset.i18n = labelKey;
    } else if (span.dataset.i18nIdle) {
      span.dataset.i18n = span.dataset.i18nIdle;
    }
    span.textContent = t(span.dataset.i18n);
  }
}
