#!/usr/bin/env node
// Builds a metallic-gold Veritas logo as a real image (assets/source/Veritas-logo.png → public/images/brand/
// logo-gold-*.{png,webp}). Being an <img>, browsers' forced dark modes cannot darken it (they do darken
// CSS-painted gold).
import sharp from 'sharp';
import fs from 'node:fs/promises';

const SRC = 'assets/source/Veritas-logo.png';
const OUT = 'public/images/brand';
await fs.mkdir(OUT, { recursive: true });
const S = 1024;
// alpha of the line art, upscaled smoothly
const alpha = await sharp(SRC).ensureAlpha().extractChannel(3).resize(S, S, { kernel: 'lanczos3' }).toBuffer();
const gold = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#8a5b16"/><stop offset=".22" stop-color="#d6a443"/><stop offset=".38" stop-color="#ffe9a8"/>
    <stop offset=".5" stop-color="#e2b04c"/><stop offset=".68" stop-color="#b07d2a"/><stop offset=".84" stop-color="#f2cf7e"/><stop offset="1" stop-color="#8a5b16"/>
  </linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
const rgb = await sharp(gold).removeAlpha().toBuffer();
const img = sharp(rgb).joinChannel(alpha);
for (const w of [256, 512, 1024]) {
  await img.clone().resize(w, w, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(`${OUT}/logo-gold-${w}.png`);
  await img.clone().resize(w, w, { kernel: 'lanczos3' }).webp({ quality: 92, alphaQuality: 100 }).toFile(`${OUT}/logo-gold-${w}.webp`);
}
console.log('gold logo done');
