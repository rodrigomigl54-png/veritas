import sr from './sr.js';
import en from './en.js';

export const dictionaries = { sr, en };
export const languages = ['sr', 'en'];
const htmlLang = { sr: 'sr-Latn', en: 'en' };
const STORAGE_KEY = 'veritas-lang';
const TODO = 'TODO_EN';

let current = 'sr';

const lookup = (dict, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);

// Translate a dotted key. Falls back to Serbian when the English text is missing (TODO_EN).
export function t(key, lang = current, vars) {
  let value = lookup(dictionaries[lang], key);
  if (value == null || value === TODO) value = lookup(sr, key);
  if (value == null) return key;
  if (vars) value = value.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
  return value;
}

// Pick a value from a { sr, en } object (used for wine data in site.js).
export function loc(value, lang = current) {
  if (value == null || typeof value !== 'object') return value;
  const v = value[lang];
  return v == null || v === TODO ? value.sr : v;
}

export const getLang = () => current;

export function initLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (languages.includes(saved)) current = saved;
  } catch {
    /* storage unavailable */
  }
  applyLang();
}

export function setLang(lang) {
  if (!languages.includes(lang) || lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage unavailable */
  }
  applyLang();
}

// Updates every element that carries data-i18n / data-i18n-html / data-i18n-attr.
export function applyLang(root = document) {
  document.documentElement.lang = htmlLang[current];
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
  document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.langBtn === current));
  });
  if (!document.body.classList.contains('legal-page')) document.title = t('meta.title');
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: current } }));
}
