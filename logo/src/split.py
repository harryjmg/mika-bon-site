import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
m = np.array(Image.open('mask4k.png').convert('L'))>127
lab,n = nd.label(m)
objs = nd.find_objects(lab)
layers = {k:np.zeros_like(m) for k in ['taureau','monogramme','anneau','cuisine','arc']}
H,W = m.shape
for i,sl in enumerate(objs,1):
    comp = lab==i
    a = comp.sum()
    if a < 300: print('drop',i,a); continue
    y,x = sl
    cx=(x.start+x.stop)/2/W; cy=(y.start+y.stop)/2/H; w=(x.stop-x.start)/W; h=(y.stop-y.start)/H
    if cy>0.80: k='arc' if w>0.25 else 'cuisine'
    elif cy>0.72: k='cuisine'
    elif a > 0.02*H*W and cy>0.35: k='monogramme'
    elif cy<0.35 and w>0.25 and h>0.2: k='taureau'
    else: k='anneau'
    layers[k] |= comp
    print(i,a,k,round(cx,3),round(cy,3),round(w,3),round(h,3))
for k,v in layers.items():
    Image.fromarray(np.where(v,0,255).astype('uint8')).convert('1').save(f'L_{k}.pbm')
