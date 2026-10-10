// <head> tags: SEO meta, Open Graph / Twitter, favicons and JSON-LD (Winery + Products).
import fs from 'node:fs';
import path from 'node:path';
import { site, wines } from '../config/site.js';
import { t, loc } from '../i18n/index.js';
import { esc, imageUrl } from './picture.js';

const exists = (publicDir, file) => fs.existsSync(path.join(publicDir, file));

export function renderHead({ publicDir }) {
  const title = t('meta.title', 'sr');
  const description = t('meta.description', 'sr');
  const ogImage = exists(publicDir, 'images/og-image.jpg') ? `${site.url}/images/og-image.jpg` : null;
  const c = site.contact;

  const winery = {
    '@context': 'https://schema.org',
    '@type': ['Winery', 'LocalBusiness'],
    '@id': `${site.url}/#winery`,
    name: site.name,
    url: site.url,
    description,
    foundingDate: String(site.foundingYear),
    telephone: c.phone.e164,
    email: c.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: c.address.street,
      addressLocality: c.address.city,
      postalCode: c.address.postalCode,
      addressCountry: c.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: c.geo.lat, longitude: c.geo.lng },
    hasMap: site.maps.directions,
    sameAs: [c.instagram.url],
    ...(ogImage ? { image: ogImage } : {}),
  };

  const products = wines.map((w) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: w.name,
    description: loc(w.description, 'sr'),
    brand: { '@type': 'Brand', name: site.name },
    category: loc(w.specs.type, 'sr'),
    ...(imageUrl(w.image, 480, 'png') ? { image: `${site.url}/${imageUrl(w.image, 480, 'png')}` } : {}),
    offers: {
      '@type': 'Offer',
      price: w.price.toFixed(2),
      priceCurrency: site.shop.currency,
      availability: 'https://schema.org/InStock',
      url: `${site.url}/#vino-${w.id}`,
      seller: { '@id': `${site.url}/#winery` },
    },
  }));

  const icons = [
    exists(publicDir, 'favicon-32.png') && '<link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png">',
    exists(publicDir, 'favicon-16.png') && '<link rel="icon" type="image/png" sizes="16x16" href="favicon-16.png">',
    exists(publicDir, 'apple-touch-icon.png') && '<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">',
    exists(publicDir, 'icon-192.png') && '<link rel="manifest" href="site.webmanifest">',
  ].filter(Boolean);
  if (!icons.length) icons.push('<link rel="icon" href="favicon.svg" type="image/svg+xml">');

  return `<title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${site.url}/">
    <meta name="robots" content="index, follow">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${esc(site.name)}">
    <meta property="og:locale" content="sr_RS">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${site.url}/">
    ${ogImage ? `<meta property="og:image" content="${ogImage}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` : ''}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    ${ogImage ? `<meta name="twitter:image" content="${ogImage}">` : ''}
    ${icons.join('\n    ')}
    <script type="application/ld+json">${JSON.stringify([winery, ...products])}</script>`;
}
