# Cuts a portrait out of a plain grey studio backdrop (used for the Phiraya photos).
# Usage: python3 site/cutout.py input.jpg output.png   (needs pillow, numpy, scipy)
import sys, numpy as np
from PIL import Image
from scipy import ndimage as nd
src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
H, W, _ = im.shape
L = im.mean(2); sat = im.max(2) - im.min(2)
yy, xx = np.mgrid[0:H, 0:W]; X = xx / W - .5; Y = yy / H - .5
cand = (sat < 10) & (L > 80) & (L < 215)
A = np.stack([np.ones_like(X), X, Y, X*X, Y*Y, X*Y], -1)
Ac = A[cand]
bg = np.zeros_like(im)
for c in range(3):
    coef, *_ = np.linalg.lstsq(Ac, im[..., c][cand], rcond=None)
    bg[..., c] = A @ coef
d = np.sqrt(((im - bg) ** 2).sum(2))
# hard background: close to the model AND connected to the image border
near = d < 18
lab, n = nd.label(near)
border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
border = border[border > 0]
hard_bg = np.isin(lab, border)
# enclosed pockets of backdrop (e.g. between arm and body): large, near-grey regions
sizes = nd.sum(near, lab, range(1, n + 1))
for i, sz in enumerate(sizes, 1):
    if sz > 600 and i not in border:
        m = lab == i
        if sat[m].mean() < 9: hard_bg |= m
fg = ~hard_bg
fg = nd.binary_opening(fg, iterations=2)
fg = nd.binary_fill_holes(fg) & ~hard_bg
fg = nd.binary_erosion(fg, iterations=1)
keep_lab, k = nd.label(fg)
if k > 1:
    sizes = nd.sum(fg, keep_lab, range(1, k + 1)); fg = keep_lab == (1 + int(np.argmax(sizes)))
# soft alpha: inside the solid figure = 1; in a band near its edge use colour distance from the backdrop
soft = np.clip((d - 16) / 34, 0, 1)
dist_in = nd.distance_transform_edt(fg); dist_out = nd.distance_transform_edt(~fg)
alpha = np.where(dist_in > 3, 1.0, np.where(dist_out > 3, 0.0, soft))
alpha = nd.gaussian_filter(alpha, 0.7)
alpha = np.clip(alpha, 0, 1)
# de-spill: remove backdrop colour that leaks into semi-transparent edge pixels
a3 = np.maximum(alpha[..., None], 1e-3)
rgb = np.clip((im - (1 - a3) * bg) / a3, 0, 255)
rgb = np.where(alpha[..., None] > 0.02, rgb, 0)
Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA').save(out)
print(out, W, H, 'fg%', round(float(alpha.mean()) * 100, 1))
