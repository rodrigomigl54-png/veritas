#!/usr/bin/env node
// Pexels stock photos — two steps, because every photo must be reviewed by a human
// (real photographs only, no AI-generated images; see the brief, section 11).
//
// 1) `npm run assets:stock -- --search`
//    Queries the Pexels API (PEXELS_API_KEY in .env) for each slot and writes a review page
//    .cache/stock/review.html with candidates (preview, size, photographer, Pexels URL).
// 2) Put the chosen photo IDs into scripts/stock-photos.json, e.g.
//    { "stock-cellar-glass-1": 1234567, ... }
//    then run `npm run assets:stock`. It downloads the originals, optimises them like all other
//    images, adds them to the image manifest and regenerates CREDITS.md.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stockSlots } from '../src/config/images.js';
import { processImage, manifestPath } from './fetch-assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(root, '.cache/stock');
const selectionPath = path.join(root, 'scripts/stock-photos.json');

async function loadEnv() {
  try {
    const env = await fs.readFile(path.join(root, '.env'), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {
    /* no .env */
  }
}

const queries = {
  'stock-about-vineyard': ['vineyard rows hills', 'vineyard aerial', 'vineyard sunset hills'],
  'stock-cellar-glass-1': ['red wine glass barrel cellar', 'wine glass oak barrel'],
  'stock-cellar-glass-2': ['two glasses red wine dark', 'red wine glasses candle light'],
  'stock-cellar-glass-3': ['pouring red wine glass', 'red wine pour'],
  'stock-cellar-glass-4': ['red wine glass vineyard sunset'],
};

async function pexels(endpoint) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('PEXELS_API_KEY is missing (.env)');
  const res = await fetch(`https://api.pexels.com/v1/${endpoint}`, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels ${res.status} for ${endpoint}`);
  return res.json();
}

async function search() {
  await fs.mkdir(cacheDir, { recursive: true });
  const rows = [];
  for (const [slot, terms] of Object.entries(queries)) {
    for (const q of terms) {
      const data = await pexels(`search?query=${encodeURIComponent(q)}&per_page=15&orientation=landscape&size=large`);
      for (const p of data.photos) {
        if (Math.max(p.width, p.height) < 2400) continue;
        rows.push({ slot, q, id: p.id, url: p.url, w: p.width, h: p.height, photographer: p.photographer, preview: p.src.medium, alt: p.alt });
      }
    }
  }
  const html = `<!doctype html><meta charset="utf-8"><title>Stock review</title>
<style>body{font:14px system-ui;background:#120c0d;color:#f2eadb}figure{display:inline-block;width:320px;margin:8px;vertical-align:top}img{width:100%}a{color:#c6a15b}</style>
<p>Reject anything that looks AI-generated (melted glass, warped labels, unnatural liquid, plastic lighting).</p>
${rows.map((r) => `<figure><img src="${r.preview}" loading="lazy"><figcaption><b>${r.slot}</b> · id ${r.id} · ${r.w}×${r.h}<br>${r.photographer} · <a href="${r.url}">${r.url}</a><br><i>${r.alt || ''}</i></figcaption></figure>`).join('\n')}`;
  await fs.writeFile(path.join(cacheDir, 'review.html'), html);
  await fs.writeFile(path.join(cacheDir, 'candidates.json'), JSON.stringify(rows, null, 2));
  console.log(`[stock] ${rows.length} candidates → .cache/stock/review.html`);
}

async function apply() {
  const selection = JSON.parse(await fs.readFile(selectionPath, 'utf8'));
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const credits = [];
  for (const [slot, photoId] of Object.entries(selection)) {
    if (!photoId || !stockSlots[slot]) continue;
    const p = await pexels(`photos/${photoId}`);
    const file = path.join(cacheDir, `${slot}.jpg`);
    await fs.mkdir(cacheDir, { recursive: true });
    const res = await fetch(p.src.original);
    await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
    manifest.images[slot] = await processImage(slot, { candidates: [p.src.original] }, { url: p.url, file });
    manifest.images[slot].credit = { photographer: p.photographer, photographerUrl: p.photographer_url, pexelsUrl: p.url };
    credits.push(`| ${slot} | [${p.url}](${p.url}) | [${p.photographer}](${p.photographer_url}) | ${stockSlots[slot].use} |`);
    console.log(`[stock] ✓ ${slot} ← ${p.url}`);
  }
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  const md = `# Credits — stock photography

All stock photos come from [Pexels](https://www.pexels.com) under the [Pexels License](https://www.pexels.com/license/) (free for commercial use).
Every photo was reviewed by a person and is a real photograph (no AI-generated images).

| Slot | Pexels URL | Photographer | Used on the site |
|---|---|---|---|
${credits.join('\n') || '| — | — | — | No stock photos selected yet |'}

All other photographs, bottle images and logos belong to Vinarija Veritas.
`;
  await fs.writeFile(path.join(root, 'CREDITS.md'), md);
  console.log('[stock] CREDITS.md updated');
}

await loadEnv();
if (process.argv.includes('--search')) await search();
else await apply();
