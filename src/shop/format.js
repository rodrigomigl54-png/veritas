import { site } from '../config/site.js';

const priceFormat = new Intl.NumberFormat(site.shop.locale, {
  style: 'currency',
  currency: site.shop.currency,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// 1080 → "1.080,00 RSD"
export const formatPrice = (value) => priceFormat.format(value);

// Serbian plural for "boca": 1 boca, 2–4 boce, 5+ boca (11–14 → boca).
export function bottleWord(n, t) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return t('cart.bottle1');
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return t('cart.bottle2');
  return t('cart.bottle5');
}
