#!/usr/bin/env python3
"""Cuts out the intro stills: oak barrel (white background → alpha) and the crystal glass
(black background → alpha from luminance, so only the real glass highlights remain)."""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

S = 'assets/source/intro'
OUT = 'public/intro'

# --- Barrel: flood the white background from the border, keep everything enclosed ---
b = np.asarray(Image.open(f'{S}/barrel-photo.jpg').convert('RGB')).astype(np.int16)
d = (255 - b).max(axis=2)
near = d < 26
lab, _ = ndimage.label(near)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
fg = ndimage.binary_fill_holes(~np.isin(lab, list(border)))
fg = ndimage.binary_opening(fg, iterations=1)
a = Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
img = Image.fromarray(b.astype(np.uint8)).convert('RGBA')
img.putalpha(a)
img = img.crop(img.getbbox())
img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2, 70, 2))
img.save(f'{OUT}/barrel.png', optimize=True)
print('barrel', img.size)

# --- Glass: alpha = luminance (black → transparent), cropped to the glass ---
g = Image.open(f'{S}/glass-photo.jpg').convert('RGB')
arr = np.asarray(g).astype(np.float32) / 255
lum = arr.max(axis=2)
ys, xs = np.where(lum > 0.12)
y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
# drop the floor reflection under the foot
y1 = int(y0 + (y1 - y0) * 0.955)
arr = arr[y0:y1, x0:x1]
lum = arr.max(axis=2)
alpha = np.clip((lum - 0.06) * 1.9, 0, 1)
rgb = np.clip(arr / np.maximum(lum[..., None], 1e-3), 0, 1)  # un-premultiplied colour
rgb = rgb * 0.75 + 0.25  # lift towards white-crystal
out = np.dstack([rgb * 255, alpha * 255]).astype(np.uint8)
gi = Image.fromarray(out, 'RGBA')
gi = gi.resize((int(gi.width * 1100 / gi.height), 1100), Image.LANCZOS)
gi.save(f'{OUT}/glass.png', optimize=True)
print('glass', gi.size)
