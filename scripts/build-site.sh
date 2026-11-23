#!/usr/bin/env bash
# Assemble le site de production de mc-cuisine.fr dans le dossier donné (par défaut _site).
# - site/h passe à la racine ;
# - seules les images et vidéos citées par H sont copiées dans img/ ;
# - les chemins ../img/ deviennent img/ ;
# - la balise noindex et le lien vers les autres directions sont retirés.
# Test en local : bash scripts/build-site.sh /tmp/mc && python3 -m http.server 8800 --directory /tmp/mc
set -euo pipefail

out="${1:-_site}"
root="$(cd "$(dirname "$0")/.." && pwd)"
src="$root/site/h"

rm -rf "$out"
mkdir -p "$out/img"
cp -R "$src/." "$out/"

# Images et vidéos réellement utilisées par H
grep -ohE '\.\./img/[A-Za-z0-9_.-]+' "$src"/*.html "$src"/*.css "$src"/*.js | sort -u | while read -r ref; do
  cp "$root/site/img/${ref#../img/}" "$out/img/"
done

# Chemins, référencement, lien de travail
for f in "$out"/*.html "$out"/*.css "$out"/*.js; do
  sed -i.bak -e 's#\.\./img/#img/#g' "$f" && rm "$f.bak"
done
sed -i.bak -e '/<meta name="robots" content="noindex">/d' -e '/Voir les autres directions/d' "$out/index.html" && rm "$out/index.html.bak"

printf 'User-agent: *\nAllow: /\n' > "$out/robots.txt"
echo "mc-cuisine.fr" > "$out/CNAME"

echo "Site assemblé dans $out : $(find "$out" -type f | wc -l | tr -d ' ') fichiers, $(du -sh "$out" | cut -f1)"
