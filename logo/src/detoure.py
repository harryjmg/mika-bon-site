"""Détoure l'emblème rouillé et la fumée.
usage : detoure.py <sans_fumee.png> <avec_fumee.png> <masque.png> <echelle> <prefixe>
echelle = largeur / 1402 (taille de l'original)."""
import sys, numpy as np
from PIL import Image
from scipy import ndimage as nd

S = '/private/tmp/claude-501/-Users-harry-Dropbox-code-mika-bon/c7ad0577-7d6f-4f28-b91b-f7617250aeaa/scratchpad/'
f_orig, f_smok, f_mask, k, pre = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4]), sys.argv[5]
orig = np.asarray(Image.open(S + f_orig).convert('RGB')).astype(np.float32)
mask = np.asarray(Image.open(S + f_mask).convert('L')) > 127

# masque élargi pour garder le biseau, bord adouci
r = 6 * k
n = int(np.ceil(r))
yy, xx = np.mgrid[-n:n + 1, -n:n + 1]
logo = nd.binary_dilation(mask, structure=(xx**2 + yy**2 <= r * r)).astype(np.float32)
logo = np.clip(nd.gaussian_filter(logo, 1.0 * k) * 1.15, 0, 1)

def lum(a): return a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114

def save(rgb, a, name, pad):
    ys, xs = np.nonzero(a > 0.02)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, a.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, a.shape[1])
    out = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)[y0:y1, x0:x1]
    Image.fromarray(out, 'RGBA').save(S + pre + name)
    print(pre + name, out.shape)

save(orig, logo, 'rouille.png', int(12 * k))

smok = np.asarray(Image.open(S + f_smok).convert('RGB')).astype(np.float32)
bg = np.stack([nd.gaussian_filter(orig[..., c], 8 * k) for c in range(3)], -1)
sm = np.stack([nd.gaussian_filter(smok[..., c], 1.2 * k) for c in range(3)], -1)
del orig
C = np.array([236, 226, 218], np.float32)
a = np.clip((lum(sm) - lum(bg) - 6) / (lum(C[None, None]) - lum(bg)), 0, 1)
del sm
a = np.clip(a * 1.25, 0, 1) ** 1.1
a = nd.gaussian_filter(a, 0.8 * k)
a *= 1 - logo  # la fumée qui passe devant les lettres reste dans les pixels du logo
col = (smok - bg * (1 - a[..., None])) / np.maximum(a[..., None], 1e-3)
del bg
w = np.clip((a - 0.05) / 0.25, 0, 1)[..., None] * 0.2
col = np.clip(col, 0, 255) * w + C * (1 - w)
L = logo[..., None]
save(smok * L + col * (1 - L), logo + (1 - logo) * a, 'fumee.png', int(4 * k))
# variante fumée sombre pour fonds clairs
D = np.array([58, 50, 45], np.float32)
save(smok * L + D * (1 - L), logo + (1 - logo) * np.clip(a * 1.1, 0, 1), 'fumee-sombre.png', int(4 * k))
