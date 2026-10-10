// Cart store — persisted in localStorage (gracefully in-memory when storage is unavailable).
import { site, wines, findWine } from '../config/site.js';

const KEY = 'veritas-cart-v1';
const listeners = new Set();
let items = load();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((i) => findWine(i.id) && i.qty > 0).map((i) => ({ id: i.id, qty: Math.min(99, Math.floor(i.qty)) })) : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable — keep the cart in memory */
  }
  listeners.forEach((fn) => fn(getState()));
}

export function subscribe(fn) {
  listeners.add(fn);
  fn(getState());
  return () => listeners.delete(fn);
}

export function add(id, qty = 1) {
  if (!findWine(id) || qty < 1) return;
  const line = items.find((i) => i.id === id);
  if (line) line.qty = Math.min(99, line.qty + qty);
  else items.push({ id, qty: Math.min(99, qty) });
  save();
}

export function setQty(id, qty) {
  const line = items.find((i) => i.id === id);
  if (!line) return;
  if (qty < 1) return remove(id);
  line.qty = Math.min(99, Math.floor(qty));
  save();
}

export function remove(id) {
  items = items.filter((i) => i.id !== id);
  save();
}

export function clear() {
  items = [];
  save();
}

export function getState() {
  const { minBottles, freeDeliveryFrom, deliveryFee } = site.shop;
  const lines = items
    .map((i) => {
      const wine = findWine(i.id);
      return { ...i, wine, lineTotal: wine.price * i.qty };
    })
    .sort((a, b) => wines.indexOf(a.wine) - wines.indexOf(b.wine));
  const bottles = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const freeDelivery = bottles >= freeDeliveryFrom;
  // null = delivery cost to be confirmed by the winery (not known yet).
  const delivery = freeDelivery ? 0 : deliveryFee;
  return {
    lines,
    bottles,
    subtotal,
    freeDelivery,
    delivery,
    total: delivery == null ? subtotal : subtotal + delivery,
    missingForFree: Math.max(0, freeDeliveryFrom - bottles),
    canCheckout: bottles >= minBottles,
  };
}
