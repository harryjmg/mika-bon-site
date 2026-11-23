# MC Cuisine, site et photos

Projet du site vitrine de **MC Cuisine** : Mickael (« Mika »), cuisinier et ancien chef privé au Pays basque, cuisine sur place pour des événements, jusqu'à 400 invités, avec un fumoir sur remorque construit sur mesure. Photos prises par Harry lors d'un événement de Mika, en septembre 2026.

Positionnement donné par Mika : « Je vais te faire goûter une viande que t'as déjà mangée, mais pas comme tu la connais. » Ce n'est pas « de la cuisine texane » : c'est un cuisinier qui met son savoir-faire au service d'un outil venu du Texas, le smoker. Éviter le mot « texan ».

## Pour Mika (et ton agent)
1. Récupère le dépôt : `git clone https://github.com/harryjmg/mika-bon-site.git` (ou bouton « Code » puis « Download ZIP » sur GitHub).
2. Ouvre-le en local : `python3 -m http.server 8800` dans le dossier, puis http://localhost:8800/ : une page qui renvoie vers tous les sites, le logo et les documents.
3. Les photos originales (11 Go) ne sont pas dans le dépôt, trop lourdes : elles sont en téléchargement dans la release **Photos originales** : https://github.com/harryjmg/mika-bon-site/releases/tag/photos-originales (JPEG en 2 zips, RAW en 5 zips). Pour les remettre à leur place, dézippe-les dans `photos-pour-mika/1 - Photos originales/JPEG/` et `.../RAW Canon (CR2)/`.
4. La version de travail : `site/h/` (une seule page à liens ancre, sur le modèle de Marché Noir). `site/i/` reste la version courte.
5. Avant de mettre en ligne pour de vrai, remplace ce qui reste marqué `<!-- À REMPLACER -->` ou `<!-- À CONFIRMER -->` dans le HTML : la ville et la zone, ce que tu proposes aux végétariens. Les coordonnées sont les vraies depuis le 23/11/2026 : 07 67 20 76 13 (aussi pour WhatsApp, dans `main.js`), contact@mc-cuisine.fr, Instagram @MccuisineBBQ.

## En ligne
- Site : https://mc-cuisine.fr (GitHub Pages, à chaque push sur `main`, voir `.github/workflows/pages.yml`). C'est la direction H : `scripts/build-site.sh` met `site/h` à la racine, avec seulement les images qu'il utilise, et retire le `noindex`. Les autres directions restent dans le dépôt, hors ligne. Test en local : `bash scripts/build-site.sh /tmp/mc` puis `python3 -m http.server 8800 --directory /tmp/mc`.
- DNS chez Cloudflare (zone mc-cuisine.fr) : 4 enregistrements A vers GitHub Pages et `www` en CNAME vers `harryjmg.github.io`, en « DNS only ».
- Dépôt public : https://github.com/harryjmg/mika-bon-site

## Le dossier
| Dossier | Contenu |
|---|---|
| `site/` | Le site statique. `index.html` présente les versions. `h/` : la version de travail, une seule page à liens ancre (texte de Mika, tarifs, à propos, prestations, contact). `i/` : version courte d'une page. `g/` : première version inspirée de Marché Noir. `d/`, `e/`, `f/` : versions cinématiques (La nuit d'avant, Plan-séquence, La bande-annonce). `a/`, `b/`, `c/` : premières pistes. `img/` : photos en 1800 px, images générées, vidéos d'en-tête. `shots/` : vignettes. |
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
- Le 23/11/2026, H devient la base : une seule page, liens ancre, titres en Trirong (Google Fonts, OFL), la police libre la plus proche des lettres du logo. Sous le hero, uniquement le texte de Mika, sans ajout.
- Tarifs donnés par Mika le 23/11/2026 (`docs/Textes-page-accueil-MC-Cuisine.txt`) : à partir de 25 € par personne, 70 invités minimum, sur devis. Aussi : plus de 20 ans d'expérience, de la haute gastronomie à la street food, et « le plaisir de faire plaisir ». Intégrés dans H et I.
- Vidéo d'en-tête de H : `img/ouverture-aube.mp4` (23 s). Elle ouvre sur le fumoir dans la plaine basque (`aube.jpg`, 6 s, lent zoom), puis enchaîne la vidéo d'origine `ouverture.mp4`, et revient en fondu sur la plaine pour boucler sans coupure. G et I gardent `ouverture.mp4`.
- Portraits générés avec le tablier MC Cuisine (`img/mika-tablier-mc-*.jpg`) et le fumoir de nuit (`img/fumoir-nuit.jpg`), images ChatGPT reçues le 23/11/2026. Deux autres variantes portaient un logo qui n'est pas le sien : écartées.

## Reste à valider par Mika
La ville et la zone desservie, si le 07 67 20 76 13 est bien joignable sur WhatsApp, les producteurs, les menus et le végétarien, ce qu'il faut sur place (eau, électricité, surface), la promesse « réponse sous 48 heures », les yeux du taureau et la police du logo horizontal.
