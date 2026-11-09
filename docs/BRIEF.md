# Brief commun : site V1 de Mika Bon, barbecue fumé au smoker

## Le client
- **Michael « Mika » Bon.** Ancien chef privé pendant des années, dans la cuisine depuis longtemps.
- Il lance une activité de traiteur barbecue texan, cuisson lente au bois (« low & slow »), avec son smoker sur remorque.
- **Capacité : jusqu'à 400 personnes** par événement (donné par le client, c'est le seul chiffre sûr).
- But du site : **décrocher de plus en plus d'événements** (mariages, séminaires et fêtes d'entreprise, festivals, fêtes de village, anniversaires, associations).
- Pas encore de nom commercial connu. On utilise **« Mika Bon »** comme marque. Le tablier qu'il porte est d'une marque tierce (Grillin & Chillin) : ne pas l'utiliser.
- Région : les photos ont été prises dans la campagne du **Pays basque** (maison basque blanche, vignes, collines). Écrire « Pays basque et tout le Sud-Ouest » mais c'est une hypothèse à confirmer : le marquer `<!-- À CONFIRMER -->` dans le HTML.

## La machine (ce qu'on voit sur les photos)
Remorque double essieu noire, construite sur mesure. À gauche une grande armoire verticale (fumoir vertical à étagères : volailles, poulets empilés sur 4 niveaux), au centre un long fourneau horizontal à trois couvercles (offset), poignées en bois clair, plan de travail en bois sur toute la longueur, foyer en bas. Ça fume en continu. Une vraie « machine de guerre ».

## Ce qu'il a servi (vu sur les photos de l'événement)
- poulets entiers fumés, peau dorée.
- Dindes / volailles entières fumées.
- Grandes pièces de porc et de bœuf assaisonnées sur grilles (des dizaines à la fois), une table de 3 m couverte de viande crue avant cuisson.
- Brisket et épaules emballés dans l'alu (« Texas crutch »), effilochés à la main avec des gants.
- Assiette servie : viande fumée tranchée, gratin dauphinois, sauce verte herbacée type chimichurri et pimenté. Ça montre la patte de chef.
- Service : buffet sous tentes, longues tablées de plusieurs centaines de convives dans un pré, découpe devant les invités.

## Ce que dit l'étude de marché (résumé)
- Les concurrents français (Pit's BBQ, Marché Noir, Black Smoker, La Bonne Breizh...) ont souvent un site sans prix, sans FAQ, sans preuve. Aucun ne met en avant un **parcours de chef**.
- Ce que les clients craignent : prix flou, fumée et odeur, météo, logistique (place, eau, électricité, accès remorque), végétariens et allergies, tenir le service pour beaucoup de monde, délais.
- Ce qui convertit : un **formulaire de devis court** (date, lieu, nombre d'invités, type d'événement), une promesse de réponse rapide (« réponse sous 48 h »), **téléphone et WhatsApp cliquables**, une **FAQ logistique**, des menus avec photos, des pages ou blocs par type d'événement, des preuves réelles.
- Prix pratiqués en France : de 25 € HT/pers (prix d'appel) à 50-90 €/pers pour un mariage avec service. **N'affiche aucun prix inventé.** Mettre « Sur devis, réponse sous 48 h » ou un champ budget dans le formulaire.

## Angles de différenciation à porter
1. **Un chef, pas un loueur de barbecue.** Accompagnements, sauces maison, assiettes dressées.
2. **400 couverts, sans stress.** La machine cuit tout en même temps, sur place, devant les invités.
3. **Le spectacle.** La fumée, la découpe et l'effilochage devant les gens, c'est une animation en soi.
4. **Zéro logistique pour le client.** Il arrive avec sa cuisine. Dire ce dont il a besoin (une place plane pour la remorque, accès véhicule) en FAQ.

## Règles d'écriture (strictes)
- Français, phrases courtes, mots simples, voix active. Tutoiement interdit : vouvoiement.
- **Aucun tiret cadratin (—) ni demi-cadratin (–)**, nulle part, ni dans le texte ni dans les `title`/`alt`. Virgule, point ou deux-points.
- Pas de « ce n'est pas X, c'est Y », pas de « au cœur de », « robuste », « il convient de », pas de triplets d'adjectifs.
- **Aucun faux témoignage, aucun faux logo client, aucun faux chiffre** (sauf « 400 personnes »). On peut écrire des durées de cuisson génériques vraies pour le BBQ texan (« jusqu'à 14 heures pour un brisket ») sans les attribuer à des événements.
- Les infos manquantes (téléphone, email, Instagram, ville) : placeholders visibles et cohérents : `06 00 00 00 00`, `contact@mikabon.fr`, `@mikabon`. Commenter `<!-- À REMPLACER -->`.

## Contraintes techniques
- Statique. Un dossier par direction : `site/a/index.html`, `site/b/index.html`, `site/c/index.html`. CSS et JS dans le fichier (ou un `style.css` / `main.js` dans ce même dossier). Pas de build, pas de npm.
- Images : `../img/<nom>.jpg` (liste ci-dessous). Ne pas modifier le dossier `img/` ni les fichiers des autres directions.
- Librairies : uniquement via CDN avec version exacte (ex. `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js` et `ScrollTrigger.min.js` 3.12.5, ou `https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js`). Polices Google Fonts. Tout est facultatif, le CSS natif suffit souvent.
- Responsive jusqu'à 375 px de large, pas de scroll horizontal. `prefers-reduced-motion` respecté (l'effet de déchirement devient une simple image fixe). Focus clavier visible. `loading="lazy"` sous la ligne de flottaison, `alt` descriptifs.
- Formulaire de devis sans backend : à l'envoi, il ouvre WhatsApp (`https://wa.me/33600000000?text=...`) ou un `mailto:` pré-rempli avec les champs. Le dire clairement sur le bouton.
- Un petit lien discret en haut ou en bas : « Voir les autres directions » vers `../index.html`.

## L'effet signature demandé : la viande qui se déchire au scroll
Le client veut un « waouh » : de la viande qui se déchire pendant qu'on scrolle. On a trois images générées, **même cadrage exact**, 2200×1228 (16:9), fond noir fumé :
- `dechire-1.jpg` : brisket entier, croûte noire, sur papier boucher rose, planche brûlée.
- `dechire-2.jpg` : le brisket se déchire au milieu, fibres qui s'étirent entre les deux moitiés, jus qui coule.
- `dechire-3.jpg` : ouvert en deux, effiloché tombé sur le papier, vapeur.
- Versions carrées recadrées au centre (1100×1100) : `dechire-1-carre.jpg` etc. pour mobile.

Construire une section « épinglée » (sticky, environ 250 à 300 vh de scroll) où l'avancement du scroll pilote le passage 1 → 2 → 3 (fondus enchaînés), avec une légère poussée de zoom, une vapeur/fumée animée par-dessus (canvas ou couches CSS), et du texte qui arrive par étapes (ex. « 14 heures de bois. » puis « Ça se détache tout seul. »). Chaque direction l'interprète à sa manière. Ça doit être fluide (transform/opacity seulement, `will-change`, pas de reflow).

## Photos disponibles (`img/`, 2200×1467 paysage sauf indication)
| Fichier | Contenu |
|---|---|
| machine.jpg | La remorque-smoker de 3/4, beaucoup de fumée, deux hommes à côté (Mika en casquette jaune de dos). Plein soleil, herbe. |
| fumee.jpg | Gros plan du fourneau horizontal noyé dans une fumée blanche épaisse. Très graphique. |
| remorque.jpg | La remorque vue de profil arrière, armoire verticale à gauche, sans personne, pré et arbres. |
| mika-portrait.jpg | Mika debout à gauche, regard au loin, tablier en jean, la machine fume derrière lui à droite. Super portrait. |
| mika-sourire.jpg | Mika sourit franchement face caméra, gant orange levé, machine qui fume derrière. |
| mika-poulets-fumee.jpg | **Vertical 1467×2200.** Mika de face, lunettes de soleil, porte un plateau de poulets fumés, colonne de fumée qui sort derrière lui. Image d'affiche. |
| mika-presente.jpg | Mika ouvre le couvercle et présente les grilles de viande, bras tendu, enthousiaste. |
| mika-dos.jpg | Mika de dos devant l'armoire ouverte, poulets sur les étagères, fumée. |
| mika-plateau.jpg | Mika tient un plateau de poulets devant la machine, un collègue derrière. |
| poulets.jpg / poulets-2.jpg | Gros plans de poulets fumés dorés sur grille. Très appétissant. |
| dindes.jpg | Gros plan de volailles entières dorées dans le fourneau. |
| dindes-rack.jpg | L'armoire verticale ouverte, trois étages de volailles. |
| grilles.jpg | Trois étages de grilles pleines de pièces de viande crue assaisonnée dans le fourneau. |
| table-viandes.jpg | Longue table couverte de pièces de viande avant cuisson, tente et maison basque au fond. |
| brisket-alu.jpg | Brisket noir dans l'alu ouvert, fond sombre. |
| pulled-mains.jpg | Mains gantées qui effilochent une pièce fumée, fond d'herbe flou. Très « déchirement ». |
| pulled-alu.jpg | Effiloché dans l'alu, mains gantées. |
| decoupe.jpg | Découpe au couteau sur planche bleue, viande effilochée. |
| assiette.jpg | Assiette servie : viande fumée, gratin, sauce verte. Patte de chef. |
| paysage.jpg | Vue large : tentes, longues bandes, vignes, maison basque blanche, collines vertes, ciel bleu. |
| foule.jpg | Tentes blanches, longue file d'invités, maison basque au fond. |
| tablee.jpg | Sous une grande tente, longue tablée de convives des deux côtés, vue en enfilade. |
| service.jpg | Service au buffet, mains gantées, invités qui tendent leur assiette, verdure. |
| file.jpg | Buffet, chef qui sert, invités en file, plein air. |
