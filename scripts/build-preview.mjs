#!/usr/bin/env node
// Builds ONE self-contained HTML file (all JS, CSS, fonts, images and the intro/hero videos embedded)
// for sharing a preview without a server: `npm run preview:file` → preview/veritas-pregled.html
// One rendition per image (WebP ≈1200 px), MP4 video only. Not for production — use `npm run build`.
import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { previewUrl } from '../src/render/picture.js';

const root = process.cwd();
const outDir = path.join(root, '.cache/preview-build');
globalThis.__VERITAS_PREVIEW__ = { map: {} }; // build-time render emits single preview URLs

const base = (await import(path.join(root, 'vite.config.js'))).default;
await build({
  ...base,
  logLevel: 'warn',
  plugins: [...base.plugins, viteSingleFile({ removeViteModuleLoader: true })],
  build: { target: 'es2020', outDir, emptyOutDir: true, assetsInlineLimit: 1e9, rollupOptions: { input: path.join(root, 'index.html') } },
});

const manifest = JSON.parse(await fs.readFile(path.join(root, 'src/config/image-manifest.json'), 'utf8'));
const files = new Set();
for (const m of Object.values(manifest.images)) {
  files.add(previewUrl(m));
  if (m.alpha) files.add(`${m.base}-${m.widths[m.widths.length - 1]}.png`);
}
['/video/intro-drone-720.mp4', '/video/hero-loop.mp4', '/video/intro-poster.jpg'].forEach((f) => files.add(f));
const mime = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
const map = {};
for (const f of files) {
  try {
    const buf = await fs.readFile(path.join(root, 'public', f));
    map[f] = `data:${mime[path.extname(f)]};base64,${buf.toString('base64')}`;
  } catch {
    /* not generated */
  }
}
let html = await fs.readFile(path.join(outDir, 'index.html'), 'utf8');
// Rewrites static references once the DOM is parsed (runs before the deferred app module).
const boot = `<script>globalThis.__VERITAS_PREVIEW__={map:${JSON.stringify(map)}};</script>`;
const fix = `<script>(function(){var M=globalThis.__VERITAS_PREVIEW__.map;function L(v){return v&&M['/'+v.replace(/^\\.?\\//,'')];}
document.querySelectorAll('[src],[poster]').forEach(function(e){['src','poster'].forEach(function(a){var d=L(e.getAttribute(a));if(d)e.setAttribute(a,d);});});
document.querySelectorAll('[style*="--logo-url"]').forEach(function(e){var m=e.style.getPropertyValue('--logo-url').match(/url\\(['"]?([^'")]+)/);var d=m&&L(m[1]);if(d)e.style.setProperty('--logo-url',"url('"+d+"')");});
document.querySelectorAll('video').forEach(function(v){v.load&&v.querySelector('source')&&v.load();});})();</script>`;
html = html.replace('<head>', `<head>${boot}`).replace('</body>', `${fix}</body>`);
await fs.mkdir(path.join(root, 'preview'), { recursive: true });
const out = path.join(root, 'preview/veritas-pregled.html');
await fs.writeFile(out, html);
console.log(`preview: ${out} (${(html.length / 1048576).toFixed(1)} MB, ${Object.keys(map).length} embedded files)`);
