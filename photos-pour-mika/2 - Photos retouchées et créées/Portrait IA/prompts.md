# Portrait IA de Mika : prompts

Modèle : `google/gemini-nano-banana-2.1` via OpenRouter, sortie 4K au format 3:2 (5056×3392).
Script : copie de `nano-banana/gen.py` avec une option `--aspect` en plus.

Deux images de référence à chaque génération :

1. la photo retouchée `Retouchées/mika-portrait (IMG_0283).jpg` réduite à 2400 px (logo du tablier déjà effacé) ;
2. un gros plan du visage recadré dans cette même photo, pour tenir la ressemblance.

Deux essais par version. Les essais retenus sont les seconds (« b »), écrits avec les corrections notées ci-dessous.
Coût : 6 images à environ 0,12 $, soit 0,73 $ en tout.

## V1, lumière rasante de fin de journée

Premier essai : bon, mais texte des gants déformé et lettres au bas du tablier. Second essai : ajout du paragraphe « Extra details ».

```
Re-photograph this scene (first reference) as a more beautiful, slightly more epic version of the same moment, while staying natural and believable.

Scene: same composition: the cook stands on the left in the foreground, three-quarter view, gazing into the distance to the left, holding his orange and grey Dexter heat-resistant gloves at waist height. Behind him on the right, the black trailer smoker in a grass meadow, with thick white smoke rising from the chimney and the barrel.

Light: late afternoon golden hour, warm low raking sunlight coming from the back right, rim light on his hair and shoulders, his face softly lit with gentle fill, not blown out. The smoke catches the low sun and glows, with visible shafts of light through it. Background: the meadow and trees softly out of focus, darker and cleaner than in the original, giving depth.

IDENTITY (non-negotiable): the man must be the exact same person as in both reference photos. Same face, same features, same narrow face shape, same nose, same hazel eyes, same thin lips, same light goatee and moustache, same messy tousled dark brown hair with lighter sun-bleached tips, same small gold hoop earring in his left ear, same age (early thirties), same slim build. Do not beautify, do not change his face. The second reference image is a close-up of his face: copy it faithfully.

Wardrobe: plain black V-neck t-shirt, dark grey denim apron with brown leather straps and brass grommet, NO logo or text on the apron, silver bangle on his right wrist.

The machine: his custom-built black steel offset smoker on a double-axle trailer: a tall vertical smoking cabinet with a door on the left end, a long horizontal barrel with three lids and wooden handles, a wooden work shelf along the front, a tall chimney, a steel rack frame above. Keep its design as in the reference.

Photographic style: a real documentary photograph shot on a full-frame camera with a 50mm or 85mm lens, natural film-like grain, real skin texture with pores, slight imperfections, true-to-life colors, no HDR, no plastic AI smoothness, no oversharpening, no text, no watermark. Remove distractions: no white bathtub, no tent pole, no clutter. Landscape 3:2.


Extra details: the apron is completely plain, no letters anywhere on it (not even at the bottom edge). The orange and grey gloves have no readable text. On the far right edge there is nothing but meadow: no white tub, no tent, no pole.
```

## V2, contre-plongée et grand ciel

Premier essai : bassine encore là, lettres sur le tablier, contre-plongée trop timide. Second essai : caméra à hauteur de hanche, colonne de fumée plus haute, paragraphe « Extra details ».

```
Create a new photograph of this cook (first reference) with a tighter, more heroic composition, still natural and believable, like an editorial portrait in a food magazine.

Composition: camera placed at hip height, clear low angle looking up at him so he stands tall against the sky. He stands on the left third, framed from mid-thigh up, three-quarter view, gazing into the distance to the left with calm confidence, arms relaxed, holding his orange and grey Dexter heat gloves in one hand. Behind him on the right two thirds, his black trailer smoker seen at a more dynamic diagonal angle, the long barrel leading the eye, tall chimney billowing a thick column of white smoke, lit by the sun, that drifts across a large open sky. More sky visible: soft late-afternoon sky with a few clouds, the tree line low on the horizon. Shallow depth of field, the smoker slightly soft but clearly readable.

Light: warm late-afternoon sun from the side, natural contrast, not harsh midday light, no blown highlights on the face.

IDENTITY (non-negotiable): the man must be the exact same person as in both reference photos. Same face, same features, same narrow face shape, same nose, same hazel eyes, same thin lips, same light goatee and moustache, same messy tousled dark brown hair with lighter sun-bleached tips, same small gold hoop earring in his left ear, same age (early thirties), same slim build. Do not beautify, do not change his face. The second reference image is a close-up of his face: copy it faithfully.

Wardrobe: plain black V-neck t-shirt, dark grey denim apron with brown leather straps and brass grommet, NO logo or text on the apron, silver bangle on his right wrist.

The machine: his custom-built black steel offset smoker on a double-axle trailer: a tall vertical smoking cabinet with a door on the left end, a long horizontal barrel with three lids and wooden handles, a wooden work shelf along the front, a tall chimney, a steel rack frame above. Keep its design as in the reference.

Photographic style: a real documentary photograph shot on a full-frame camera with a 50mm or 85mm lens, natural film-like grain, real skin texture with pores, slight imperfections, true-to-life colors, no HDR, no plastic AI smoothness, no oversharpening, no text, no watermark. Remove distractions: no white bathtub, no tent pole, no clutter. Landscape 3:2.


Extra details: the apron is completely plain, no letters anywhere on it (not even at the bottom edge). The orange and grey gloves have no readable text. On the far right edge there is nothing but meadow: no white tub, no tent, no pole.
```

## V3, veille de fête à l'heure bleue

Premier essai : le modèle avait inventé un foyer à l'extrémité droite de la machine. Second essai : foyer placé sous l'armoire verticale, à gauche, comme sur la vraie machine.

```
Create a new photograph of this cook (first reference) on the evening before a big outdoor feast in the Basque Country, natural and believable, quietly epic.

Scene: dusk, just after sunset, blue hour sky with a last warm orange glow on the horizon behind low green hills. He stands on the left in the foreground, three-quarter view, gazing into the distance to the left, holding his orange and grey Dexter heat gloves. Behind him on the right, his black trailer smoker in a meadow: the firebox is the small low door at the bottom of the tall vertical cabinet on the LEFT end of the machine (as in the reference): that small door is open and the wood fire inside glows deep orange, embers lighting the ground and the side of the machine; smoke rises from the chimney, lit warm from below and cool blue above. A string of warm festoon bulbs hangs in the distance over a few long wooden tables being set up, very soft and out of focus.

Light: the firelight gives a warm orange glow on the right side of his face and apron, the cool blue ambient sky light fills the rest. Moody but the face stays clearly visible and readable.

IDENTITY (non-negotiable): the man must be the exact same person as in both reference photos. Same face, same features, same narrow face shape, same nose, same hazel eyes, same thin lips, same light goatee and moustache, same messy tousled dark brown hair with lighter sun-bleached tips, same small gold hoop earring in his left ear, same age (early thirties), same slim build. Do not beautify, do not change his face. The second reference image is a close-up of his face: copy it faithfully.

Wardrobe: plain black V-neck t-shirt, dark grey denim apron with brown leather straps and brass grommet, NO logo or text on the apron, silver bangle on his right wrist.

The machine: his custom-built black steel offset smoker on a double-axle trailer: a tall vertical smoking cabinet with a door on the left end, a long horizontal barrel with three lids and wooden handles, a wooden work shelf along the front, a tall chimney, a steel rack frame above. Keep its design as in the reference.

Photographic style: a real documentary photograph shot on a full-frame camera with a 50mm or 85mm lens, natural film-like grain, real skin texture with pores, slight imperfections, true-to-life colors, no HDR, no plastic AI smoothness, no oversharpening, no text, no watermark. Remove distractions: no white bathtub, no tent pole, no clutter. Landscape 3:2.


Extra details: the apron is completely plain, no letters anywhere on it (not even at the bottom edge). The orange and grey gloves have no readable text. On the far right edge there is nothing but meadow: no white tub, no tent, no pole.
 The machine keeps exactly the layout of the reference: tall vertical cabinet with its big door on the left end, long horizontal barrel with three lids to its right, no extra firebox on the right end.
```

