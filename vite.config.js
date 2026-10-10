import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'vite';

const root = process.cwd();
const publicDir = path.join(root, 'public');
const manifestFile = path.join(root, 'src/config/image-manifest.json');

// Renders the one-page site into index.html at build/dev time, so every text is in the static HTML.
function veritasRender() {
  return {
    name: 'veritas-render',
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        if (!html.includes('<!--app-body-->') && !html.includes('<!--app-head-->')) return html;
        const mod = (file) => pathToFileURL(path.join(root, 'src/render', file)).href;
        const { setManifest } = await import(mod('picture.js'));
        setManifest(JSON.parse(fs.readFileSync(manifestFile, 'utf8')));
        const { renderBody } = await import(mod('page.js'));
        const { renderHead } = await import(mod('head.js'));
        return html.replace('<!--app-head-->', renderHead({ publicDir })).replace('<!--app-body-->', renderBody());
      },
    },
  };
}

export default defineConfig({
  // Relative asset URLs: works at the domain root and under a sub-path (GitHub Pages /veritas/).
  base: './',
  plugins: [veritasRender()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        main: path.join(root, 'index.html'),
        terms: path.join(root, 'uslovi-koriscenja.html'),
        privacy: path.join(root, 'politika-privatnosti.html'),
      },
    },
  },
});
