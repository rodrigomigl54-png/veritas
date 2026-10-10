# Vinarija Veritas — website

One-page site for Vinarija Veritas (Sremski Karlovci): a cinematic 3D intro, a circular wine
carousel with a cart and order-by-email checkout, booking form, gallery, maps and an SR/EN switch.

**Stack:** Vite + vanilla JavaScript (ES modules), Three.js (intro), GSAP + ScrollTrigger, Lenis.
Static output — deploy anywhere (Netlify, Vercel, any static host).

---

## Quick start

```bash
npm install
cp .env.example .env        # add VITE_FORM_ACCESS_KEY (see below)
npm run assets              # download + optimise all winery images (needs access to vinarijaveritas.com)
npm run dev                 # http://localhost:5173
npm run build               # → dist/
npm run preview             # serve dist/ locally
```

Useful URL switches for testing the intro: `?intro=2d` (2D fallback), `?intro=high` / `?intro=low`
(force a 3D quality tier).

## Deploy

- **Netlify:** build command `npm run build`, publish directory `dist`. Add `VITE_FORM_ACCESS_KEY`
  under *Site settings → Environment variables*.
- **Vercel:** framework preset “Vite”, output `dist`, same environment variable.

Run `npm run assets` before the first deploy and commit `public/images/**`, the favicons in `public/`
and `src/config/image-manifest.json` (or run it in the build step).

## Images — `npm run assets`

`scripts/fetch-assets.mjs` downloads every image listed in `src/config/images.js` (logos, hero,
section photos, wine bottles, the full gallery) and

- creates responsive sizes (480–2400 px) as **AVIF + WebP + JPG** (transparent images: WebP + PNG),
- trims the bottle PNGs and removes a flat background if a bottle arrives without transparency
  (only pixels connected to the border; the label is never touched),
- tries full-size originals first (e.g. `nasa-filozofija.jpg` before the Elementor thumbnail),
- crawls the old site's pages for additional real photos and adds them to the gallery,
- generates the favicon set, the Open Graph image (`public/images/og-image.jpg`) and a traced
  `public/images/brand/veritas-logo.svg` (review it against the PNG before using it anywhere),
- writes `src/config/image-manifest.json`, which the site reads to build `<picture>` elements.

Until an image exists, the site shows a neutral dark placeholder in its place. Re-running is safe
(downloads are cached in `.cache/`, use `--force` to re-process). Behind a corporate proxy run it with
`NODE_USE_ENV_PROXY=1 npm run assets` (Node ≥ 22.21).

## Stock photos (Pexels) — `npm run assets:stock`

Real photographs only — every photo must be reviewed by a person (no AI-generated images).

1. Get a free key at <https://www.pexels.com/api/> and set `PEXELS_API_KEY` in `.env`.
2. `npm run assets:stock -- --search` → open `.cache/stock/review.html` and pick photos.
3. Put the chosen photo IDs into `scripts/stock-photos.json` (slots: one vineyard backup photo for
   “O nama”, four wine-glass photos for “Podrum”).
4. `npm run assets:stock` → downloads, optimises, adds them to the manifest and regenerates `CREDITS.md`.

The cellar collage only shows the wine-glass slots that have a photo.

## Forms (orders, bookings, newsletter) — Web3Forms

All forms are sent by email through [Web3Forms](https://web3forms.com):

1. Go to <https://web3forms.com>, enter **vinarijaveritas@gmail.com** and create an access key
   (the key is bound to that inbox — all submissions go there).
2. Put it in `.env`: `VITE_FORM_ACCESS_KEY=xxxxxxxx-xxxx-…` (and in the hosting provider's env vars).
3. Rebuild. Without a key, forms show an error with the phone number as a fallback.

Subjects: `Nova porudžbina VER-YYYYMMDD-NNNN — Ime`, `Nova rezervacija — [Vrsta posete] — [Datum]`,
`Newsletter prijava`. Spam protection: honeypot field (`botcheck`).
Sending a copy of the order to the customer uses Web3Forms' `ccemail`, which needs a plan that
supports it — enable with `forms.customerCopy: true` in `src/config/site.js`.

## Where to edit things

| What | Where |
|---|---|
| Prices, wine texts, specs, awards, per-wine colours | `src/config/site.js` → `wines` |
| Phone, email, address, Instagram, coordinates, opening hours | `src/config/site.js` → `site.contact` |
| Shipping rules (min. 3 bottles, free from 6), delivery fee | `src/config/site.js` → `site.shop` |
| Booking visit types / arrival times / 24 h rule | `src/config/site.js` → `visitTypes`, `visitTimes`, `minNoticeHours` |
| Section texts (Serbian) | `src/i18n/sr.js` |
| English texts | `src/i18n/en.js` (keys marked `TODO_EN` fall back to Serbian) |
| Image list | `src/config/images.js` |
| Colours, fonts | `src/styles/base.css` (`:root` tokens) |
| Intro timing / look | `src/intro/` (`scene.js` holds the shot durations) |

- **Opening hours:** set `site.contact.openingHours` (e.g. `'Pon–Sub 10–18, Ned od 12'`); the row is
  hidden while it is `null`.
- **Delivery fee:** `site.shop.deliveryFee` is `null` (“to be confirmed”). Set a number (RSD) to show
  and add it below 6 bottles.

## Replacing the “O nama” photo with a video

The background container is ready for a video. Put the file in `public/video/` and set
`aboutVideo: '/video/vinograd.mp4'` in `src/config/site.js`. It renders as
`<video autoplay muted loop playsinline>` over the current photo (which acts as the poster).

## Adding online card payment later

`src/shop/payment.js` defines a `PaymentProvider` interface and the `CashOnDeliveryProvider`.
To add a card gateway (a Serbian bank gateway or Stripe):

1. Implement `class MyCardProvider extends PaymentProvider` with `id`, `available = true` and
   `async pay(order)` returning `{ status: 'redirect', redirectUrl }` (hosted payment page) or
   `{ status: 'paid', reference }`. Card payments need a small server/serverless function to create
   the payment session — never put secret keys in the front end.
2. Register it in `providers` (replace the `CardProvider` placeholder) and enable the radio button
   in `src/render/forms.js`.
3. The checkout (`src/shop/cartUI.js`) already calls `getProvider(method).pay(order)` before the order
   email is sent and follows redirects.

## Project structure

```
index.html                 one-page shell; sections are rendered at build time (vite.config.js)
uslovi-koriscenja.html     placeholder legal pages (TODO: content from client)
politika-privatnosti.html
public/                    robots.txt, sitemap.xml, favicons, images/ (generated)
scripts/                   fetch-assets.mjs, fetch-stock.mjs
src/config/                site.js (business data), images.js (image registry), image-manifest.json
src/i18n/                  sr.js, en.js, index.js
src/render/                HTML for every section (shared by the build and the browser)
src/intro/                 3D intro (scene, vineyard, props, post, quality, preload, audio)
src/sections/              wine carousel, gallery + lightbox
src/shop/                  cart store, cart drawer + checkout, payment providers, price format
src/forms/                 booking, newsletter, validation, Web3Forms submit
src/ui/                    smooth scroll, header, dialogs (focus trap), animations, cursor
```
