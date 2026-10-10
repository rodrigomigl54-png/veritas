#!/usr/bin/env node
// Downloads every winery image listed in src/config/images.js, optimises it and writes
// src/config/image-manifest.json. Run with `npm run assets`. Re-running is safe: downloads are cached
// in .cache/assets. Use `--force` to re-process everything.
//
// Output per image: /public/images/<group>/<id>-<width>.<avif|webp|jpg>  (photos)
//                   /public/images/<group>/<id>-<width>.<webp|png>       (transparent images)
// Also generates: favicon set, Open Graph image, a traced SVG logo (if `potrace` is installed).

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { allImages, crawlPages } from '../src/config/images.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(root, '.cache/assets');
const publicDir = path.join(root, 'public');
export const manifestPath = path.join(root, 'src/config/image-manifest.json');
const force = process.argv.includes('--force');
const offline = process.argv.includes('--offline');
// `--from <folder>`: use original files from a local folder (e.g. images saved from the old site),
// matched by file name (bela-harmonija.png, 2022-pocetna-2.jpg, DJI_0047.jpg …). URLs are the fallback.
const fromIdx = process.argv.indexOf('--from');
const fromDir = fromIdx > -1 ? path.resolve(process.argv[fromIdx + 1]) : path.join(root, 'assets/source');
let localFiles = null;
async function localIndex() {
  if (localFiles) return localFiles;
  localFiles = new Map();
  if (!(await exists(fromDir))) return localFiles;
  const walk = async (dir) => {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else localFiles.set(e.name.toLowerCase(), full);
    }
  };
  await walk(fromDir);
  return localFiles;
}

const PHOTO_WIDTHS = [480, 800, 1200, 1600, 2400];
const BOTTLE_WIDTHS = [240, 480, 800];
const LOGO_WIDTHS = [160, 320, 640];

const log = (...a) => console.log('[assets]', ...a);

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function download(url, dest) {
  if (!force && (await exists(dest))) return true;
  if (offline) return false;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (veritas-asset-fetch)' }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) return false;
  const type = res.headers.get('content-type') || '';
  if (!type.startsWith('image/')) return false;
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return true;
}

async function fetchFirst(id, candidates) {
  const local = await localIndex();
  for (const url of candidates) {
    const name = path.basename(new URL(url).pathname).toLowerCase();
    const file = local.get(name) || local.get(name.replace(/-\d{2,4}x\d{2,4}(?=\.\w+$)/, ''));
    if (file) return { url: `local:${path.basename(file)}`, file };
  }
  for (const url of candidates) {
    if (url.startsWith('local:')) continue;
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const dest = path.join(cacheDir, `${id}${ext}`);
    try {
      if (await download(url, dest)) return { url, file: dest };
    } catch (err) {
      log(`  ! ${url}: ${err.message}`);
    }
  }
  return null;
}

function groupOf(id, meta) {
  if (meta.bottle) return 'wines';
  if (id.startsWith('logo')) return 'brand';
  if (id.startsWith('gallery')) return 'gallery';
  if (id.startsWith('stock')) return 'stock';
  return 'site';
}

// Removes a flat background (e.g. white) by flood-filling from the image border.
// Only used for bottle PNGs that arrive without transparency. The label itself is never touched:
// only pixels connected to the border and close to the border colour are cleared.
async function removeFlatBackground(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (x, y) => (y * w + x) * 4;
  const corners = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
  const bg = [0, 1, 2].map((c) => corners.reduce((s, i) => s + data[i + c], 0) / 4);
  const dist = (i) => Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
  const HARD = 28;
  const SOFT = 60;
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push([x, 0], [x, h - 1]);
  for (let y = 0; y < h; y++) stack.push([0, y], [w - 1, y]);
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const k = y * w + x;
    if (seen[k]) continue;
    seen[k] = 1;
    const i = k * 4;
    const d = dist(i);
    if (d > SOFT) continue;
    // Feather the edge between HARD and SOFT.
    data[i + 3] = d <= HARD ? 0 : Math.min(data[i + 3], Math.round(((d - HARD) / (SOFT - HARD)) * 255));
    if (d <= HARD) stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

async function hasTransparency(file) {
  const img = sharp(file);
  const meta = await img.metadata();
  if (!meta.hasAlpha) return false;
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const idx = [0, w - 1, (h - 1) * w, h * w - 1].map((k) => k * 4 + 3);
  return idx.some((i) => data[i] < 250);
}

export async function processImage(id, meta, src) {
  const group = groupOf(id, meta);
  const outDir = path.join(publicDir, 'images', group);
  await fs.mkdir(outDir, { recursive: true });

  let input = await fs.readFile(src.file);
  let transparentFixed = false;
  if (meta.bottle) {
    if (!(await hasTransparency(src.file))) {
      input = await removeFlatBackground(input);
      transparentFixed = true;
    }
    input = await sharp(input).trim({ threshold: 1 }).toBuffer();
  }

  // Small source photos (thumbnails): high-quality 2–3× upscale (Lanczos3 + gentle sharpening) so the
  // browser does not have to stretch them. A real original should replace them whenever available.
  let upscaled = false;
  if (!meta.bottle && !id.startsWith('logo')) {
    const m0 = await sharp(input).metadata();
    if (m0.width < 900) {
      const target = Math.min(1500, Math.round(m0.width * (m0.width < 400 ? 3 : 2)));
      input = await sharp(input).rotate().resize({ width: target, kernel: 'lanczos3' }).sharpen({ sigma: 0.9, m1: 0.6, m2: 1.4 }).modulate({ saturation: 1.04 }).jpeg({ quality: 95 }).toBuffer();
      upscaled = true;
    }
  }
  const base = sharp(input).rotate();
  const { width, height } = await base.metadata();
  const alpha = !!meta.alpha;
  const ladder = meta.bottle ? BOTTLE_WIDTHS : id.startsWith('logo') ? LOGO_WIDTHS : PHOTO_WIDTHS;
  let widths = ladder.filter((x) => x < width);
  if (!widths.length || width <= ladder[ladder.length - 1]) widths.push(width);
  widths = [...new Set(widths)].sort((a, b) => a - b);
  const formats = alpha ? ['webp', 'png'] : ['avif', 'webp', 'jpg'];

  for (const wdt of widths) {
    for (const fmt of formats) {
      const out = path.join(outDir, `${id}-${wdt}.${fmt}`);
      if (!force && (await exists(out))) continue;
      let pipe = sharp(input).rotate().resize({ width: wdt, withoutEnlargement: true });
      if (fmt === 'avif') pipe = pipe.avif({ quality: 50, effort: 4 });
      if (fmt === 'webp') pipe = pipe.webp({ quality: alpha ? 85 : 76, alphaQuality: 90 });
      if (fmt === 'jpg') pipe = pipe.jpeg({ quality: 78, progressive: true, mozjpeg: true });
      if (fmt === 'png') pipe = pipe.png({ compressionLevel: 9, palette: false });
      await pipe.toFile(out);
    }
  }

  const lqipBuf = await sharp(input).rotate().resize({ width: 20 }).webp({ quality: 40 }).toBuffer();
  // Dominant colour → used to tint each section so the palette follows its background photo.
  const { dominant } = await sharp(input).stats();
  const hex = '#' + [dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('');
  return {
    base: `/images/${group}/${id}`,
    width,
    height,
    widths,
    formats,
    alpha,
    lqip: `data:image/webp;base64,${lqipBuf.toString('base64')}`,
    dominant: hex,
    source: src.url,
    ...(transparentFixed ? { backgroundRemoved: true } : {}),
    ...(upscaled ? { upscaled: true } : {}),
  };
}

// Strips WordPress size suffixes (-1024x683) so we can detect duplicates of originals.
const originalOf = (url) => url.replace(/-\d{2,4}x\d{2,4}(?=\.\w+$)/, '').replace(/-scaled(?=\.\w+$)/, '');

async function crawlExtraImages(knownUrls) {
  const found = new Set();
  for (const page of crawlPages) {
    if (offline) break;
    try {
      const res = await fetch(page, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) continue;
      const html = await res.text();
      const re = /https?:\/\/vinarijaveritas\.com\/wp-content\/uploads\/[^"'\s)]+?\.(?:jpe?g|png|webp)/gi;
      for (const m of html.matchAll(re)) found.add(originalOf(m[0]));
    } catch (err) {
      log(`  ! crawl ${page}: ${err.message}`);
    }
  }
  const known = new Set([...knownUrls].map(originalOf));
  const skip = /(logo|favicon|icon|elementor\/thumbs|woocommerce-placeholder|bela-harmonija|domina-rose|monte-karlovci|cuk-cuvee|momentum|bermet)/i;
  return [...found].filter((u) => !known.has(u) && !skip.test(u));
}

async function makeFavicons(emblemFile) {
  const noc = { r: 18, g: 12, b: 13, alpha: 1 };
  const jobs = [
    ['favicon-16.png', 16, null],
    ['favicon-32.png', 32, null],
    ['apple-touch-icon.png', 180, noc],
    ['icon-192.png', 192, noc],
    ['icon-512.png', 512, noc],
  ];
  for (const [name, size, bg] of jobs) {
    let pipe = sharp(emblemFile).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    if (bg) pipe = pipe.flatten({ background: bg });
    await pipe.png().toFile(path.join(publicDir, name));
  }
  log('favicons generated');
}

async function makeOgImage(heroFile) {
  await sharp(heroFile)
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(publicDir, 'images/og-image.jpg'));
  log('og image generated');
}

export async function traceLogo(file, outName) {
  let potrace;
  try {
    potrace = await import('potrace');
  } catch {
    log('potrace not installed — skipping SVG trace (npm i -D potrace to enable)');
    return null;
  }
  const flat = await sharp(file).flatten({ background: '#ffffff' }).png().toBuffer();
  const svg = await new Promise((resolve, reject) =>
    (potrace.default || potrace).trace(flat, { threshold: 160, turdSize: 2, optTolerance: 0.2, color: 'currentColor', background: 'transparent' }, (err, out) =>
      err ? reject(err) : resolve(out),
    ),
  );
  const out = path.join(publicDir, 'images/brand', outName);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, svg);
  log(`traced ${outName} (review it against the PNG before using it in production)`);
  return `/images/brand/${outName}`;
}

async function main() {
  await fs.mkdir(cacheDir, { recursive: true });
  const previous = (await exists(manifestPath)) ? JSON.parse(await fs.readFile(manifestPath, 'utf8')) : {};
  const manifest = { generatedAt: new Date().toISOString(), images: { ...(previous.images || {}) }, galleryExtra: previous.galleryExtra || [], missing: [] };

  const entries = Object.entries(allImages);
  const sources = {};
  for (const [id, meta] of entries) {
    const src = await fetchFirst(id, meta.candidates);
    if (src) sources[id] = src.file;
    if (!src) {
      log(`✗ ${id} — not reachable`);
      manifest.missing.push(id);
      continue;
    }
    manifest.images[id] = await processImage(id, meta, src);
    log(`✓ ${id} (${manifest.images[id].width}×${manifest.images[id].height}) ← ${src.url}`);
  }

  // Extra gallery photos found by crawling the old site.
  const knownUrls = entries.flatMap(([, m]) => m.candidates);
  const extras = await crawlExtraImages(knownUrls);
  manifest.galleryExtra = [];
  let n = 0;
  for (const url of extras) {
    const id = `gallery-extra-${String(++n).padStart(2, '0')}`;
    const src = await fetchFirst(id, [url]);
    if (!src) continue;
    const meta = await sharp(src.file).metadata();
    // Real photos only — skip icons and UI graphics.
    if (Math.max(meta.width, meta.height) < 700) continue;
    manifest.images[id] = await processImage(id, { candidates: [url] }, src);
    manifest.galleryExtra.push(id);
    log(`✓ ${id} (crawled) ← ${url}`);
  }

  const emblem = sources['logo-emblem'];
  if (emblem) await makeFavicons(emblem);
  const hero = sources['hero-desktop'];
  if (hero) await makeOgImage(hero);
  const logoMain = sources['logo-main'];
  if (logoMain) {
    const svg = await traceLogo(logoMain, 'veritas-logo.svg').catch((e) => log('trace failed', e.message));
    if (svg) manifest.logoSvg = svg;
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  log(`manifest written: ${Object.keys(manifest.images).length} images, ${manifest.missing.length} missing`);
  if (manifest.missing.length) log('missing:', manifest.missing.join(', '));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
