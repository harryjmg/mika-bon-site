# Brief V2 : trois directions cinématiques (D, E, F)

Lis d'abord `BRIEF.md` (même dossier) pour le client, les règles d'écriture et les contraintes techniques. Ce fichier-ci le complète et **prime en cas de conflit**.

## Ce que Harry a dit des trois premières versions (site/a, site/b, site/c)
- La meilleure est **A « Fumée »** (sombre, titre géant, fumée animée). B est trop technique. C manque d'images et de visuel.
- Il veut une **cinématique** : la page raconte une histoire, on est dans l'ambiance **dès la première seconde**, très visuel, peu de texte.
- L'animation du brisket qui se déchire **ne va pas** : les fibres qui s'étirent font « fromage ». Les anciennes images `dechire-*.jpg` sont **interdites**.
- Les volailles sur les photos sont des **poulets** fumés, pas des canards laqués. Ne jamais écrire « canard » ni « laqué ».
- Les photos d'**assiettes dressées ne sont pas belles** : `assiette.jpg` est **interdite**. Mettre l'accent sur les **gros plans de viande**.

Va voir `site/a/` pour comprendre ce qui a plu (tu peux reprendre des idées de code, par exemple la fumée en canvas, mais tu écris tes propres fichiers).

## Nouvelles images disponibles dans `site/img/`
Générées (Nano Banana, à partir des vraies photos de la machine, très cinéma, 16:9 environ 2000×1116) :
| Fichier | Contenu |
|---|---|
| nuit.jpg | La vraie remorque-smoker dans un pré basque en pleine nuit, foyer ouvert qui rougeoie, fumée sous la lune, silhouette de Mika de dos avec une bûche. Plan d'ouverture idéal. |
| feu.jpg | Macro du foyer : bûches de chêne qui brûlent, braises, étincelles. |
| aube.jpg | La remorque à l'aube dans la brume, collines vertes, ferme basque au loin, colonne de fumée dans la lumière rose. Grand plan large. |
| tablee-soir.jpg | Longue tablée sous une tente au coucher du soleil, guirlandes, vin, des centaines d'invités. |
| brisket-tranche.jpg | Très sombre : mains en gants noirs tranchent un brisket, anneau de fumée rose, croûte noire. Le plus beau plan viande. |
| poulets-fumee.jpg | Poulets entiers dorés dans le fourneau ouvert, fumée qui roule. |
| tire-1.jpg, tire-2.jpg, tire-3.jpg | **La nouvelle séquence de déchirement**, faite à partir d'une vraie photo : deux mains en gants blancs tiennent une épaule fumée sur fond noir (1), la déchirent (2), la séparent avec des morceaux qui tombent et de la vapeur (3). Les mains bougent un peu d'une image à l'autre : **ne pas faire de fondu enchaîné** (ça fait des fantômes). Monter en **coupes franches** pilotées par le scroll, comme un montage de film : cut net, petit zoom avant à chaque plan, léger tremblement ou flash de lumière au moment du cut, vapeur et braises en canvas par-dessus. |

Vraies photos, gros plans en plus (1800 px, paysage) :
| Fichier | Contenu |
|---|---|
| alu-1.jpg → alu-4.jpg | **Vraie rafale** : l'alu ouvert sur une pièce noire (1), le couteau entre, la viande s'ouvre (2, 3), gants orange (4). Utilisable en stop-motion réel au scroll (coupes franches aussi). |
| pulled-mains.jpg, pulled-mains-2.jpg | Mains gantées blanches qui effilochent une pièce fumée, fond d'herbe. |
| pulled-alu.jpg, pulled-alu-2.jpg, pulled-alu-3.jpg | Effilochage dans l'alu. |
| pulled-planche.jpg | Viande effilochée sur planche bleue. |
| decoupe.jpg, decoupe-2.jpg | Découpe au couteau sur planche bleue. |
| brisket-alu.jpg | Pièce noire dans l'alu, fond sombre. |
| poulets.jpg, poulets-2.jpg, poulets-3.jpg | Poulets fumés dorés, gros plans sur grille. |
| poulets-four.jpg | Poulets dans le fourneau horizontal. |
| mika-cri.jpg | Mika qui crie de joie, bras tendus, devant la machine ouverte. |
| mika-sourire-2.jpg | Mika sourit, plateau de poulets. |
Et toutes celles listées dans `BRIEF.md` (renommées : `poulets.jpg`, `poulets-2.jpg`, `mika-poulets-fumee.jpg` vertical). Les photos de jour en plein soleil peuvent être assombries et étalonnées en CSS (`filter`, dégradés, voiles) pour coller à l'ambiance.

## Exigences communes aux trois directions
- **Dès l'ouverture** : plein écran, image et mouvement (fumée, braises, lumière qui vacille, lent zoom). Le premier écran donne envie de scroller. Pas de grand bloc de texte.
- **Histoire** : la page se déroule comme un film en chapitres, du feu à la fête. Image plein cadre presque partout, texte court en surimpression (une ou deux phrases par plan, façon sous-titre ou carton).
- **Le climax viande** avec `tire-*` (coupes franches) et/ou `alu-*` (stop-motion réel) et `brisket-tranche`.
- **Conversion à la fin** : un appel clair, puis un formulaire de devis court (WhatsApp / email pré-remplis, comme dans `site/a`), une FAQ courte (5 questions max, accordéon), contacts placeholder. Un bouton « Devis » toujours accessible.
- Fluide : animations en transform/opacity, images préchargées pour les séquences, canvas léger (limiter les particules sur mobile). `prefers-reduced-motion` : plans fixes, pas de cuts rapides.
- Mobile soigné (390 px) : les plans restent plein écran (`object-fit: cover` bien centré sur le sujet), textes lisibles.
- Lien discret « Voir les autres directions » vers `../index.html`.
- Toutes les règles d'écriture de `BRIEF.md` (pas de tiret cadratin, pas de faux témoignage, pas de prix, placeholders marqués).

## Tester
Sers `site/` avec `python3 -m http.server <port> --directory <chemin de site>` en arrière-plan. Pour les captures, Playwright est installé globalement : script Node `.mjs` avec `createRequire` et `require((await import('child_process')).execSync('npm root -g').toString().trim() + '/playwright')`, `chromium.launch({ channel: 'chrome' })`. Fais défiler par paliers (`window.scrollTo` puis attente 900 ms) et capture chaque chapitre en 1440×900 et 390×844. Regarde les captures avec Read. Écoute `pageerror`. Le navigateur intégré est partagé avec d'autres agents : ne l'utilise pas.
