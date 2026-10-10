// Accessible dialog helper: focus trap, Esc to close, focus restore, scroll lock.
import { lockScroll, unlockScroll } from './scroll.js';

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

const stack = [];

function visibleFocusables(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter((el) => !el.closest('[hidden]') && el.offsetParent !== null && !el.closest('.hp'));
}

// Capture phase, so form controls (e.g. date inputs) cannot swallow Esc.
document.addEventListener('keydown', (e) => {
  const top = stack[stack.length - 1];
  if (!top) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    top.close();
    return;
  }
  if (e.key === 'Tab') {
    const items = visibleFocusables(top.el);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    } else if (!top.el.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    }
  }
}, true);

/**
 * @param {HTMLElement} el dialog element (starts [hidden])
 * @param {{ backdrop?: HTMLElement, onOpen?: Function, onClose?: Function, initialFocus?: () => HTMLElement }} opts
 */
export function createDialog(el, opts = {}) {
  let lastFocus = null;
  let closeTimer = null;
  const api = {
    el,
    isOpen: false,
    open() {
      if (api.isOpen) return;
      clearTimeout(closeTimer);
      api.isOpen = true;
      lastFocus = document.activeElement;
      el.hidden = false;
      if (opts.backdrop) opts.backdrop.hidden = false;
      lockScroll();
      stack.push(api);
      requestAnimationFrame(() => {
        el.classList.add('is-open');
        opts.backdrop?.classList.add('is-open');
        const target = opts.initialFocus?.() || visibleFocusables(el)[0];
        target?.focus({ preventScroll: true });
      });
      opts.onOpen?.();
    },
    close() {
      if (!api.isOpen) return;
      api.isOpen = false;
      el.classList.remove('is-open');
      opts.backdrop?.classList.remove('is-open');
      const i = stack.indexOf(api);
      if (i >= 0) stack.splice(i, 1);
      unlockScroll();
      closeTimer = setTimeout(() => {
        el.hidden = true;
        if (opts.backdrop) opts.backdrop.hidden = true;
      }, 450);
      opts.onClose?.();
      lastFocus?.focus?.({ preventScroll: true });
    },
  };
  return api;
}
