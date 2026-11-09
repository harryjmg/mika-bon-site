# MC Cuisine, site et photos

Projet du site vitrine de **MC Cuisine** : Mickael (« Mika »), cuisinier et ancien chef privé au Pays basque, cuisine sur place pour des événements, jusqu'à 400 invités, avec un fumoir sur remorque construit sur mesure. Photos prises par Harry lors d'un événement de Mika, en septembre 2026.

Positionnement donné par Mika : « Je vais te faire goûter une viande que t'as déjà mangée, mais pas comme tu la connais. » Ce n'est pas « de la cuisine texane » : c'est un cuisinier qui met son savoir-faire au service d'un outil venu du Texas, le smoker. Éviter le mot « texan ».

## Pour Mika (et ton agent)
1. Récupère le dépôt : `git clone https://github.com/harryjmg/mika-bon-site.git` (ou bouton « Code » puis « Download ZIP » sur GitHub).
2. Ouvre-le en local : `python3 -m http.server 8800` dans le dossier, puis http://localhost:8800/ : une page qui renvoie vers tous les sites, le logo et les documents.
3. Les photos originales (11 Go) ne sont pas dans le dépôt, trop lourdes : elles sont en téléchargement dans la release **Photos originales** : https://github.com/harryjmg/mika-bon-site/releases/tag/photos-originales (JPEG en 2 zips, RAW en 5 zips). Pour les remettre à leur place, dézippe-les dans `photos-pour-mika/1 - Photos originales/JPEG/` et `.../RAW Canon (CR2)/`.
4. Les versions à regarder en premier : `site/h/` (site complet sur le modèle de Marché Noir) et `site/i/` (version courte).
5. Avant de mettre en ligne pour de vrai, remplace les placeholders, tous marqués `<!-- À REMPLACER -->` ou `<!-- À CONFIRMER -->` dans le HTML : téléphone `06 00 00 00 00`, `contact@mccuisine.fr`, `@mccuisine`, le numéro WhatsApp dans `main.js`, la ville et la zone, les producteurs, ce que tu proposes aux végétariens.

## En ligne
- Site : https://harryjmg.fr/mika-bon-site/ (publié par GitHub Pages depuis `site/`, à chaque push sur `main`, voir `.github/workflows/pages.yml`)
- Dépôt public : https://github.com/harryjmg/mika-bon-site

## Le dossier
| Dossier | Contenu |
|---|---|
| `site/` | Le site statique. `index.html` présente les versions. `h/` : site multipage (accueil, à propos, prestations, contact). `i/` : version courte d'une page. `g/` : première version inspirée de Marché Noir. `d/`, `e/`, `f/` : versions cinématiques (La nuit d'avant, Plan-séquence, La bande-annonce). `a/`, `b/`, `c/` : premières pistes. `img/` : photos en 1800 px, images générées, vidéos d'en-tête. `shots/` : vignettes. |
| `logo/` | Logo MC Cuisine vectorisé : SVG par calque et par version, PNG, favicons, planche de présentation, maquettes de barnum. Voir `logo/README.md` et `logo/planche.html`. |
| `photos-pour-mika/` | `2 - Photos retouchées et créées` : 37 retouches en pleine résolution, les images générées et les portraits retravaillés. `1 - Photos originales` : vide dans le dépôt, voir la release ci-dessus. |
| `docs/` | `ETUDE-MARCHE.md` (concurrents, prix, angles), `BRIEF.md` et `BRIEF-CINE.md` (consignes données aux agents qui ont construit les pages ; ils parlent encore de « Mika Bon » et de « texan », remplacés depuis par MC Cuisine et le positionnement ci-dessus). |
| `generation/` | `prompts.md` : les prompts Nano Banana des images générées. |
| `index.html` | La page locale qui renvoie vers tout. |

## Ce qui a déjà été décidé
- Modèle de référence : le site de Marché Noir (https://marchenoir-fumoirurbain.fr/), que Mika aime : vidéo en haut de chaque page, grand titre serif, alternance charbon et crème, pages courtes.
- Aller droit au but, peu de texte.
- Les volailles sont des poulets fumés, pas des canards.
- Les assiettes dressées ne sont pas belles : `img/assiette.jpg` n'est plus utilisée.
- L'ancienne animation du brisket (`img/dechire-*.jpg`) faisait « fromage » : remplacée par `img/tire-*.jpg`.
- Rien d'inventé sur le site : pas de faux avis, presse, logos clients, prix ou producteurs.

## Reste à valider par Mika
Les coordonnées, la ville et la zone desservie, les producteurs, les menus et le végétarien, ce qu'il faut sur place (eau, électricité, surface), la promesse « réponse sous 48 heures », les yeux du taureau et la police du logo horizontal.
