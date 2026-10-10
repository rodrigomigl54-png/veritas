#!/usr/bin/env python3
"""Cuts the wine bottles out of the shop screenshots (flat grey background → transparent PNG).
Usage: python3 scripts/cutout-bottles.py <screenshot> <out.png> [threshold]
Background = pixels connected to the crop border whose colour is close to the page grey; everything
enclosed by the bottle outline is kept, so labels and light glass are never punched out."""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

src, out = sys.argv[1], sys.argv[2]
T = float(sys.argv[3]) if len(sys.argv) > 3 else 20
im = np.asarray(Image.open(src).convert('RGB')).astype(np.int16)
H, W, _ = im.shape
top, bottom = 230, H - 140  # skip browser chrome / nav bar
bg = np.median(im[400:1600, 10:40].reshape(-1, 3), axis=0)
diff = np.abs(im - bg).max(axis=2)
STRONG = float(sys.argv[4]) if len(sys.argv) > 4 else 45
strong = diff > STRONG
strong[:top] = False
strong[bottom:] = False
lab, n = ndimage.label(ndimage.binary_closing(strong, iterations=3))
sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
# the bottle is the tallest big component
best, best_h = 0, 0
for i, sz in enumerate(sizes, 1):
    if sz < 5000:
        continue
    ys, xs = np.where(lab == i)
    h = ys.max() - ys.min()
    if h > best_h:
        best, best_h = i, h
ys, xs = np.where(lab == best)
y0, y1, x0, x1 = max(top, ys.min() - 6), min(bottom, ys.max() + 6), max(0, xs.min() - 6), min(W, xs.max() + 6)
crop = im[y0:y1, x0:x1]
d = diff[y0:y1, x0:x1]
near_bg = d < T
# background = near-bg pixels connected to the crop border
lab2, _ = ndimage.label(near_bg)
border = set(np.unique(np.concatenate([lab2[0], lab2[-1], lab2[:, 0], lab2[:, -1]]))) - {0}
bgmask = np.isin(lab2, list(border))
fg = ~bgmask
fg = ndimage.binary_opening(fg, iterations=1)
fg = ndimage.binary_fill_holes(fg)
# drop the soft grey floor shadow under the base (low contrast, bottom 7 % of the crop)
hh = fg.shape[0]
sat = crop.max(axis=2) - crop.min(axis=2)
val = crop.max(axis=2)
shadow = (sat < 26) & (val > 105)
shadow[: int(hh * 0.92)] = False
fg &= ~shadow
fg = ndimage.binary_opening(fg, iterations=1)
alpha = Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
a = np.asarray(alpha).astype(np.float32) / 255
# soften the anti-aliased rim against the grey: partially transparent where colour ≈ background
rim = (a > 0) & (a < 1)
rgb = crop.astype(np.float32)
# un-premultiply the grey fringe so edges don't look dirty on dark backgrounds
with np.errstate(divide='ignore', invalid='ignore'):
    clean = np.where(rim[..., None] & (a[..., None] > 0.05), (rgb - (1 - a[..., None]) * bg) / a[..., None], rgb)
clean = np.clip(clean, 0, 255).astype(np.uint8)
rgba = np.dstack([clean, (a * 255).astype(np.uint8)])
# trim fully transparent margins
ys, xs = np.where(rgba[..., 3] > 8)
rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
Image.fromarray(rgba, 'RGBA').save(out, optimize=True)
print(out, rgba.shape[1], 'x', rgba.shape[0])
