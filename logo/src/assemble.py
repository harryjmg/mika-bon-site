import re, pathlib, numpy as np
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

S = pathlib.Path(__file__).parent
OUT = pathlib.Path('/Users/harry/Dropbox/code/mika-bon/logo')
LAYERS = ['anneau', 'arc', 'taureau', 'monogramme', 'cuisine']
NOIR, CREME, CUIVRE, CHARBON = '#000000', '#FFEEDF', '#B5562B', '#2A2421'

# cadrage : carré de 3060 px de la source 4608x3688, ramené à 1000 unités
X0, Y0, SIDE, H = 811, 291, 3060, 3688
s = 1000 / SIDE
MAT = f'matrix({0.1*s:.6f} 0 0 {-0.1*s:.6f} {-X0*s:.4f} {(H-Y0)*s:.4f})'

paths, bbox = {}, {}
for k in LAYERS:
    txt = (S / f'T_{k}.svg').read_text()
    paths[k] = [re.sub(r'\s+', ' ', d).strip() for d in re.findall(r'<path d="([^"]+)"', txt)]
    m = np.array(Image.open(S / f'L_{k}.pbm').convert('L')) < 128
    ys, xs = np.nonzero(m)
    bbox[k] = ((xs.min() - X0) * s, (ys.min() - Y0) * s, (xs.max() + 1 - X0) * s, (ys.max() + 1 - Y0) * s)

def layer(k, fill):
    d = ' '.join(paths[k])
    return f'  <g id="{k}" fill="{fill}">\n    <path transform="{MAT}" d="{d}"/>\n  </g>\n'

def svg(vb, body, title='MC Cuisine'):
    w, h = vb[2], vb[3]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.1f} {vb[1]:.1f} {w:.1f} {h:.1f}" '
            f'width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}">\n<title>{title}</title>\n{body}</svg>\n')

def emblem(colors):
    return ''.join(layer(k, colors[k]) for k in LAYERS)

def solid(c): return {k: c for k in LAYERS}
TWO_LIGHT = {'taureau': CUIVRE, 'monogramme': CUIVRE, 'anneau': CHARBON, 'cuisine': CHARBON, 'arc': CHARBON}
TWO_DARK = {'taureau': CUIVRE, 'monogramme': CUIVRE, 'anneau': CREME, 'cuisine': CREME, 'arc': CREME}

FULL = (0, 0, 1000, 1000)
# monogramme seul : taureau + MC, cadré carré
bx = [min(bbox[k][0] for k in ('taureau', 'monogramme')), min(bbox[k][1] for k in ('taureau', 'monogramme')),
      max(bbox[k][2] for k in ('taureau', 'monogramme')), max(bbox[k][3] for k in ('taureau', 'monogramme'))]
side = max(bx[2] - bx[0], bx[3] - bx[1]) + 20
cx, cy = (bx[0] + bx[2]) / 2, (bx[1] + bx[3]) / 2
MONO = (cx - side / 2, cy - side / 2, side, side)

# texte de la version horizontale : Cinzel (OFL), graisse 600, vectorisé
f = instantiateVariableFont(TTFont(S / 'fonts/Cinzel.ttf'), {'wght': 700})
gs, cmap = f.getGlyphSet(), f.getBestCmap()
capH = f['OS/2'].sCapHeight
def text_path(txt, x, base, cap, track):
    k = cap / capH
    out, pen_x = [], x
    for ch in txt:
        g = cmap[ord(ch)]
        sp = SVGPathPen(gs)
        gs[g].draw(TransformPen(sp, (k, 0, 0, -k, pen_x, base)))
        out.append(sp.getCommands())
        pen_x += gs[g].width * k + track
    return ' '.join(out), pen_x - track - x

CAP = 250
base = 500 + CAP / 2
tx = 1000 + 120
_, tw = text_path('MC CUISINE', 0, 0, CAP, CAP * 0.16)
tpath, tw = text_path('MC CUISINE', tx, base, CAP, CAP * 0.16)
HORIZ = (0, 0, tx + tw + 40, 1000)
def horiz(colors, tcolor):
    return emblem(colors) + f'  <g id="texte" fill="{tcolor}">\n    <path d="{tpath}"/>\n  </g>\n'

files = {
    'mc-cuisine-maitre': svg(FULL, emblem(solid(NOIR))),
    'mc-cuisine-noir': svg(FULL, emblem(solid(NOIR))),
    'mc-cuisine-creme': svg(FULL, emblem(solid(CREME))),
    'mc-cuisine-deux-tons': svg(FULL, emblem(TWO_LIGHT)),
    'mc-cuisine-deux-tons-sombre': svg(FULL, emblem(TWO_DARK)),
    'monogramme-noir': svg(MONO, layer('taureau', NOIR) + layer('monogramme', NOIR), 'MC Cuisine, monogramme'),
    'monogramme-creme': svg(MONO, layer('taureau', CREME) + layer('monogramme', CREME), 'MC Cuisine, monogramme'),
    'monogramme-cuivre': svg(MONO, layer('taureau', CUIVRE) + layer('monogramme', CUIVRE), 'MC Cuisine, monogramme'),
    'horizontal-noir': svg(HORIZ, horiz(solid(NOIR), NOIR)),
    'horizontal-creme': svg(HORIZ, horiz(solid(CREME), CREME)),
    'horizontal-deux-tons': svg(HORIZ, horiz(TWO_LIGHT, CHARBON)),
    'horizontal-deux-tons-sombre': svg(HORIZ, horiz(TWO_DARK, CREME)),
}
(OUT / 'svg/calques').mkdir(parents=True, exist_ok=True)
for n, c in files.items():
    (OUT / 'svg' / f'{n}.svg').write_text(c)
for k in LAYERS:
    (OUT / 'svg/calques' / f'{k}.svg').write_text(svg(FULL, layer(k, NOIR), f'MC Cuisine, calque {k}'))
# favicon : monogramme cuivre sur pastille charbon, lisible sur onglets clairs et sombres
r = MONO[2] * 0.12
pad = MONO[2] * 0.06
fv = (MONO[0] - pad, MONO[1] - pad, MONO[2] + 2 * pad, MONO[3] + 2 * pad)
fav = svg(fv, f'  <rect x="{fv[0]:.1f}" y="{fv[1]:.1f}" width="{fv[2]:.1f}" height="{fv[3]:.1f}" rx="{r:.1f}" fill="{CHARBON}"/>\n'
          + layer('taureau', CUIVRE) + layer('monogramme', CUIVRE), 'MC Cuisine')
(OUT / 'favicon.svg').write_text(fav)
# apple-touch-icon : carré plein (iOS arrondit lui-même)
ati = svg(fv, f'  <rect x="{fv[0]:.1f}" y="{fv[1]:.1f}" width="{fv[2]:.1f}" height="{fv[3]:.1f}" fill="{CHARBON}"/>\n'
          + layer('taureau', CUIVRE) + layer('monogramme', CUIVRE), 'MC Cuisine')
(S / 'apple-touch.svg').write_text(ati)
print('bbox', {k: tuple(round(v) for v in b) for k, b in bbox.items()})
print('MONO', [round(v, 1) for v in MONO], 'HORIZ', [round(v) for v in HORIZ])
