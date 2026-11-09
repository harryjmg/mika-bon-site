# MC Cuisine (Mika), site et photos

Nom de l'activité : **MC Cuisine**. Mika ne veut pas du mot « texan » : c'est un cuisinier qui travaille avec un outil venu du Texas, le smoker. Sa phrase : « Je vais te faire goûter une viande que t'as déjà mangée, mais pas comme tu la connais. »

En local : `python3 -m http.server 8800` à la racine, puis http://localhost:8800/ (page qui renvoie vers tout).

Site vitrine pour Michael « Mika » Bon, traiteur barbecue texan au smoker sur remorque (jusqu'à 400 couverts). Photos prises par Harry lors d'un événement de Mika, au Pays basque, en septembre 2026.

## En ligne
- Site : https://harryjmg.fr/mika-bon-site/ (GitHub Pages, accessible à qui a le lien, non indexé)
- Repo privé : https://github.com/harryjmg/mika-bon-site (c'est le dossier `site/`)

## Le dossier
| Dossier | Contenu |
|---|---|
| `site/` | Le site statique (dépôt git). `index.html` présente les directions. `a/`, `b/`, `c/` : premières pistes (Fumée, L'Atelier, La grande tablée). `d/`, `e/`, `f/` : versions cinématiques (La nuit d'avant, Plan-séquence, La bande-annonce). `g/` : première version inspirée de Marché Noir. `h/` : site multipage sur le modèle de Marché Noir (accueil, à propos, prestations, contact). `i/` : version courte d'une page. `img/` : photos retouchées en 1800 px et images générées. `shots/` : vignettes de la page d'accueil. |
| `photos-pour-mika/` | La copie remise à Mika sur carte SD le 05/11/2026. `1 - Photos originales` : 323 JPEG et 323 RAW (CR2), IMG_0240 à IMG_0562. `2 - Photos retouchées et créées` : 37 retouches en pleine résolution et 9 images générées. |
| `logo/` | Logo MC Cuisine vectorisé (voir `logo/README.md` et `logo/planche.html`). |
| `docs/` | `ETUDE-MARCHE.md` (concurrents, prix, angles), `BRIEF.md` et `BRIEF-CINE.md` (consignes données aux agents qui ont construit les pages). |
| `generation/` | `prompts.md` : les prompts Nano Banana des images générées. |

L'album d'origine est « SMOKER MIKA » dans Photos (352 éléments). Les 29 premiers (IMG_0211 à IMG_0239) sont des photos de famille, exclues de tout.

## Retours de Harry
- La meilleure des trois premières : A. B trop technique, C pas assez visuelle.
- Il veut une page qui se vit comme un film, d'où D, E et F.
- Les volailles sont des poulets fumés, pas des canards laqués.
- Les assiettes dressées ne sont pas belles : `img/assiette.jpg` n'est plus utilisée.
- L'ancienne animation du brisket (`img/dechire-*.jpg`) faisait « fromage » : remplacée par `img/tire-*.jpg`.

## Reste à faire pour une V2
Nom commercial, ville et rayon, téléphone, email, Instagram, prix « à partir de », menus, végétarien, besoins sur place (eau, électricité, surface). Tous les placeholders sont marqués `<!-- À REMPLACER -->` ou `<!-- À CONFIRMER -->` dans le HTML.

## Voir le site en local
```bash
python3 -m http.server 8740 --directory site
```
