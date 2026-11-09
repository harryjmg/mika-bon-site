# Logo MC Cuisine

Vectorisation de l'emblème métal rouillé fourni par Mickael
(`Emblème métallique MC Cuisine rouillé.png`). Aperçu de tout le kit : `planche.html` et `planche.png`.

## Fichiers

### Versions rouillées (le logo tel que Mickael l'a voulu, effets compris)

| Chemin | Contenu |
|---|---|
| `rouille/mc-cuisine-rouille-{512,1024,2048}.png` | Emblème métal rouillé, biseau et reflets, fond transparent |
| `rouille/mc-cuisine-rouille-fumee-*.png` | Même chose avec la fumée claire en transparence : pour fond sombre ou photo |
| `rouille/mc-cuisine-rouille-fumee-sombre-*.png` | Fumée passée en gris charbon : pour fond clair, où la fumée claire disparaît |
| `rouille/*-1600.webp` | Les trois versions en WebP transparent, plus légères pour le site |

Méthode : Nano Banana a agrandi les deux originaux en 4K (texture plus nette, géométrie vérifiée contre
le masque : 1 % d'écart). Les lettres sont détourées avec le masque vectoriel élargi de quelques pixels
pour garder le biseau. La transparence de la fumée est estimée par différence entre la version avec fumée
et le fond lissé de la version sans fumée (`src/detoure.py`).

### Versions vectorielles (aplats)

| Chemin | Contenu |
|---|---|
| `svg/mc-cuisine-maitre.svg` | SVG maître, noir, cinq groupes nommés : `anneau`, `arc`, `taureau`, `monogramme`, `cuisine` |
| `svg/calques/*.svg` | Un fichier par calque, même `viewBox` 0 0 1000 1000 que le maître : ils se superposent exactement |
| `svg/mc-cuisine-{noir,creme,deux-tons,deux-tons-sombre}.svg` | Emblème complet |
| `svg/monogramme-{noir,creme,cuivre}.svg` | Taureau + MC seuls, cadrage carré |
| `svg/horizontal-{noir,creme,deux-tons,deux-tons-sombre}.svg` | Emblème + « MC CUISINE » à droite (texte vectorisé) |
| `png/<version>-512.png`, `png/<version>-2048.png` | Exports transparents ; 512 et 2048 px sur le plus grand côté |
| `favicon.svg`, `favicon-32.png` | Monogramme cuivre sur pastille charbon arrondie |
| `apple-touch-icon.png` | 180 px, fond charbon plein (iOS arrondit lui-même) |
| `src/` | Redessin « flat » de Nano Banana, masque, scripts (`split.py`, `assemble.py`, `render.js`) |

## Couleurs

- Cuivre rouillé `#B5562B` : taureau et MC dans les versions deux tons
- Charbon `#2A2421` : anneau, CUISINE et arc sur fond clair ; fond des icônes
- Crème `#FFEEDF` : version pour fond sombre ou photo
- Noir `#000000` : version unie

## Usages conseillés

- Fond clair : `deux-tons` ou `noir`. Fond sombre ou photo : `creme` ou `deux-tons-sombre`.
- Sous 120 px de large, passer au `monogramme` : CUISINE et l'anneau deviennent illisibles.
- En-tête de site : `horizontal`. Sur photo, assombrir l'image derrière (voile noir 30 à 40 %).
- Pour l'effet métal rouillé (affiche, réseaux), garder l'image originale ; le vectoriel sert à tout le reste (impression, broderie, gravure, découpe vinyle, web).

## Méthode et limites

Le seuillage direct de l'original gardait le grain de rouille et le biseau 3D. Nano Banana a redessiné le logo
en aplat (`src/redessin-flat-nano-banana.jpg`), vérifié par différence avec un masque seuillé de l'original :
les écarts restent sous 2 à 3 px à l'échelle 1402 px, surtout dus au biseau. Puis `potrace` par calque.

Ce qui reste à ajuster :

- Versions rouillées : la texture de rouille vient de l'agrandissement 4K, donc elle est redessinée dans le
  même style, pas copiée pixel pour pixel. Si Mickael tient à la texture exacte, refaire l'export depuis
  l'original 1402 px (`detoure.py` avec une échelle de 1) : le logo utile n'y fait qu'environ 940 px.
- Fumée : la fumée qui passe devant les lettres reste peinte dans les lettres. Dans la version
  `fumee-sombre`, elle reste donc claire sur les lettres et sombre autour.
- Un liseré sombre entoure les formes : c'est le flanc du biseau d'origine. Sur fond très clair, il fait
  un peu contour.

- Le détail des yeux et des naseaux du taureau est une interprétation de l'aplat ; dans l'original, le relief
  3D rend ces creux ambigus. À valider par Mickael.
- Les lettres sont tracées, pas tirées d'une police : quelques angles de serif sont légèrement arrondis.
- Le texte de la version horizontale est en Cinzel 700 (Google Fonts, licence OFL), qui n'est pas la police
  exacte de CUISINE dans l'emblème. Ça répète aussi « MC » ; une variante avec une accroche
  (« Barbecue au smoker, Pays basque ») serait peut-être plus utile.
- Les scripts de `src/` pointent vers un dossier temporaire ; à adapter pour les relancer.
