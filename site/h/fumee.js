/* MC Cuisine : le panache. La fumée naît de la cheminée du fumoir, sur la photo du chef (temps I),
   puis le vent la couche et l'étire vers la droite, comme la fumée de la photo. Elle traverse la bande charbon
   sous la phrase d'accroche et se perd au bas du hero.

   La forme change pendant qu'elle monte : le bruit est en trois dimensions, la troisième est le temps.
   Le motif ne fait donc pas que glisser vers le haut : il s'enroule, se déchire, se dilate et se dissipe.
   Quatre styles, choisis par l'URL (index.html?fumee=a, b, c ou e) ; sans paramètre, le style DEFAUT :
     a. Filaments : des fils fins et soyeux, comme une fumée de bois légère ;
     b. Volutes : une fumée plus épaisse et cotonneuse, qui s'enroule sur elle-même ;
     c. Vapeur : des particules emportées par un champ tourbillonnaire (curl noise) qui change dans le temps ;
     e. Smoke : le composant Smoke de shadcn.io (Pro, sous la licence du client), son moteur WebGL2 et sa scène
        tels quels (vendor/), réglé pour un seul panache couché par le vent. Sans WebGL2, on retombe sur le style a.
   Une pastille en bas à droite permet de basculer, sur localhost seulement : jamais en production.
   24 images par seconde au plus, pause hors écran ou onglet caché, rien avec prefers-reduced-motion. */
(() => {
  const DEFAUT = 'e'; // le composant Smoke de shadcn ; sans WebGL2, retombe sur a
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.hero__smoke');
  const photo = document.querySelector('.chef__photo img');
  if (!hero || !canvas || !canvas.getContext) return;
  let style = DEFAUT;
  try { style = new URLSearchParams(location.search).get('fumee') || DEFAUT; } catch (e) { /* vieux navigateur */ }
  if (!/^[abce]$/.test(style)) style = DEFAUT;

  /* ---------- Pastille de choix : localhost seulement ---------- */
  const host = location.hostname;
  const local = /^(localhost|127\.0\.0\.1|\[::1\]|::1)$/.test(host) || /\.localhost$/.test(host);
  if (local) {
    const st = document.createElement('style');
    st.textContent =
      '.fumee-pick{position:fixed;right:14px;bottom:14px;z-index:200;display:flex;align-items:center;gap:2px;padding:4px;' +
      'border-radius:999px;background:rgba(20,16,14,.82);border:1px solid rgba(255,238,223,.25);' +
      'font:500 11px/1 var(--sans,system-ui);letter-spacing:.12em;text-transform:uppercase;color:#FFEEDF;' +
      '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}' +
      '.fumee-pick span{padding:0 8px 0 10px;opacity:.6}' +
      '.fumee-pick a{display:block;padding:8px 11px;border-radius:999px;color:inherit;text-decoration:none}' +
      '.fumee-pick a:hover{background:rgba(255,238,223,.12)}' +
      '.fumee-pick a[aria-current]{background:#FFEEDF;color:#1D1D1D}';
    document.head.appendChild(st);
    const pick = document.createElement('nav');
    pick.className = 'fumee-pick';
    pick.setAttribute('aria-label', 'Choix du style de fumée (local seulement)');
    pick.innerHTML = '<span>Fumée</span>';
    ['a', 'b', 'c', 'e'].forEach(v => {
      const a = document.createElement('a');
      const u = new URL(location.href);
      u.searchParams.set('fumee', v); u.hash = '';
      a.href = u.pathname + u.search;
      a.textContent = v;
      if (v === style) a.setAttribute('aria-current', 'true');
      // garde la position de défilement d'un style à l'autre
      a.addEventListener('click', () => { try { sessionStorage.setItem('fumee-y', String(window.scrollY)); } catch (e) {} });
      pick.appendChild(a);
    });
    document.body.appendChild(pick);
    try {
      const y = sessionStorage.getItem('fumee-y');
      if (y !== null) {
        sessionStorage.removeItem('fumee-y');
        const go = () => window.scrollTo({ top: +y, behavior: 'instant' });
        go(); window.addEventListener('load', go, { once: true });
      }
    } catch (e) {}
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !photo) { canvas.remove(); return; }
  // Style e : sans WebGL2, on retombe sur le style a
  if (style === 'e') {
    let ok = false;
    try { ok = !!document.createElement('canvas').getContext('webgl2'); } catch (e) {}
    if (!ok) style = 'a';
  }
  const ctx = style === 'e' ? null : canvas.getContext('2d');
  if (style !== 'e' && !ctx) return;

  /* ---------- Bruit de valeur 3D (x, y, temps), interpolation quintique, table fixe ---------- */
  const P = new Uint16Array(512), V = new Float32Array(256);
  let seed = 23;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 256; i++) { P[i] = i; V[i] = rnd(); }
  for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; const t = P[i]; P[i] = P[j]; P[j] = t; }
  for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const fade5 = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const noise3 = (x, y, z) => {
    const xf = Math.floor(x), yf = Math.floor(y), zf = Math.floor(z);
    const xi = xf & 255, yi = yf & 255, zi = zf & 255;
    const u = fade5(x - xf), v = fade5(y - yf), w = fade5(z - zf);
    const a = P[xi] + yi, b = P[xi + 1] + yi;
    const aa = P[a] + zi, ab = P[a + 1] + zi, ba = P[b] + zi, bb = P[b + 1] + zi;
    const x00 = V[P[aa]] + (V[P[ba]] - V[P[aa]]) * u, x10 = V[P[ab]] + (V[P[bb]] - V[P[ab]]) * u;
    const x01 = V[P[aa + 1]] + (V[P[ba + 1]] - V[P[aa + 1]]) * u, x11 = V[P[ab + 1]] + (V[P[bb + 1]] - V[P[ab + 1]]) * u;
    const y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
    return y0 + (y1 - y0) * w;
  };
  /* Fractal 3D, chaque octave tournée dans le plan pour casser la grille ; le temps accélère avec l'octave :
     les petits détails changent plus vite que les grandes masses, comme dans une vraie fumée */
  const fbm3 = (x, y, z, oct) => {
    let s = 0, amp = .5, norm = 0;
    for (let o = 0; o < oct; o++) {
      s += amp * noise3(x, y, z); norm += amp;
      const nx = 1.6 * x + 1.2 * y, ny = -1.2 * x + 1.6 * y;
      x = nx + 3.1; y = ny + 7.7; z = z * 1.7 + 5.3; amp *= .5;
    }
    return s / norm;
  };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- Géométrie : la cheminée de la photo, en coordonnées du hero ---------- */
  // Position sans tenir compte des transformations de révélation (maison.css)
  const posIn = (el) => {
    let x = 0, y = 0, n = el;
    while (n) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    let hx = 0, hy = 0; n = hero;
    while (n) { hx += n.offsetLeft; hy += n.offsetTop; n = n.offsetParent; }
    return { x: x - hx, y: y - hy, w: el.offsetWidth, h: el.offsetHeight };
  };
  // Un point de la photo (fractions de l'image d'origine), malgré object-fit: cover et object-position
  const photoPoint = (fx, fy) => {
    const b = posIn(photo);
    const iw = photo.naturalWidth || 1536, ih = photo.naturalHeight || 1024;
    const s = Math.max(b.w / iw, b.h / ih), w = iw * s, h = ih * s;
    const op = getComputedStyle(photo).objectPosition.split(' ').map(v => (v.endsWith('%') ? parseFloat(v) / 100 : .5));
    return { x: b.x + (b.w - w) * op[0] + fx * w, y: b.y + (b.h - h) * (op[1] ?? .5) + fy * h, top: b.y, width: b.w };
  };

  const CELL = style === 'a' ? 3 : style === 'b' ? 4 : 2; // un pixel de calcul pour CELL px affichés
  let W = 0, H = 0, img = null;
  let sx = 0, sy = 0, reach = 1, ph = 0, wide = 1, time = 0;
  const place = () => {
    const c = photoPoint(.4297, .2031); // bouche de la cheminée sur mika-tablier-mc-1.jpg (660, 208 sur 1536 × 1024)
    const heroW = hero.offsetWidth, heroH = hero.offsetHeight;
    const top = heroH - Math.min(heroH * .26, 230); // le panache meurt dans le bas du hero, sous le bouton
    reach = Math.max(80, c.y - top);
    wide = Math.max(.75, Math.min(1.2, c.width / 1000));
    // la boîte déborde peu à gauche de la cheminée, beaucoup à droite : le vent pousse de ce côté
    const left = Math.max(0, c.x - reach * .22);
    const right = Math.min(heroW, c.x + reach * 1.55 * wide);
    const boxW = Math.max(1, right - left), boxH = reach + 12;
    sx = c.x - left; sy = reach; ph = c.top - top; // ph : haut de la photo dans le canvas
    Object.assign(canvas.style, { left: left + 'px', top: top + 'px', width: boxW + 'px', height: boxH + 'px' });
    W = Math.ceil(boxW / CELL); H = Math.ceil(boxH / CELL);
    canvas.width = W; canvas.height = H;
    img = ctx.createImageData(W, H);
  };

  /* Ligne médiane du panache à la hauteur h (px au-dessus de la cheminée) : presque droite à la sortie,
     puis couchée vers la droite, de plus en plus. Une houle lente, qui évolue d'elle-même, la fait onduler. */
  const center = (h, t) => {
    const hn = Math.max(0, h / reach);
    const sway = (noise3(h * .0045, 3.3, t * .17) - .5) * (8 + h * .3);
    return sx + reach * 1.05 * wide * Math.pow(hn, 1.55) + sway;
  };
  /* Demi-largeurs : un filet à la sortie, qui s'élargit en montant, bien plus du côté où le vent l'emporte */
  const thick = style === 'b' ? 1.5 : 1; // les volutes sont plus larges que les fils
  const halfL = (h) => (4 + h * .12 * thick) * wide;
  const halfR = (h) => (4 + h * .34 * thick) * wide;
  /* Opacité selon la hauteur : naissance douce, dissipation dans le haut ; sur la photo, 55 % (elle a déjà sa fumée) */
  const fadeAt = (h, y) => smooth(-2, 22, h) * smooth(1, .45, h / reach) * (1 - .45 * smooth(ph - 10, ph + 30, y));

  /* ---------- Rendu par champ de densité (styles a et b) ----------
     Coordonnées du motif liées au panache : en travers, la distance à la ligne médiane rapportée à la largeur
     (le motif se dilate avec le panache) ; en long, la hauteur moins la montée (le motif monte) ; en z, le temps
     (le motif se transforme). La déformation croît avec la hauteur : colonne nette en bas, déchirée en haut. */
  const field = (t) => {
    const d = img.data;
    d.fill(0);
    const rise = 58;                    // px par seconde
    const filaments = style === 'a';
    const k = filaments ? 1 / 75 : 1 / 125;
    for (let j = 0; j < H; j++) {
      const y = j * CELL, h = sy - y;
      if (h < -4) continue;
      const hn = Math.max(0, h / reach);
      const cx = center(h, t), hl = halfL(h), hr = halfR(h);
      const fade = fadeAt(h, y);
      if (fade < .004) continue;
      const Y = (h - rise * t) * k / (1 + hn * .9); // le motif monte et s'étire en montant
      const A = .5 + hn * 1.7;                        // déformation : faible à la sortie, forte en haut
      for (let i = 0; i < W; i++) {
        const x = i * CELL;
        const dx = x - cx;
        const d0 = dx / (dx > 0 ? hr : hl);
        if (d0 > 3 || d0 < -3) continue;
        // a : coordonnée en travers rapportée à la largeur, les fils s'étirent le long du panache ;
        // b : mêmes échelles dans les deux sens, les volutes restent rondes et se dilatent en montant
        const X = filaments ? d0 * .9 : dx * k / (1 + hn * .9);
        let a, light;
        if (filaments) {
          // a. fils : bruit « en arête » à haute fréquence en travers, étiré le long du panache
          const wx = fbm3(X * .8, Y * .7, t * .22, 2), wy = fbm3(X * .8 + 5.2, Y * .7 + 1.3, t * .22 + 9, 2);
          const dd = d0 + (wx - .5) * 1.5;           // bords déchirés
          const prof = Math.exp(-dd * dd * 1.2);
          if (prof < .01) continue;
          const f = fbm3(X * 2.4 + A * (wx - .5) * 3, Y * 1.1 + A * (wy - .5) * 2.4, t * .3, 3);
          const r = 1 - Math.abs(2 * f - 1);
          const strand = r * r * r * r * r * r;
          a = (strand * .95 + .14 * smooth(.35, .8, f)) * prof * (.55 + .45 * smooth(.3, .7, wy));
          light = .55 + .45 * r;
        } else {
          // b. volutes : double déformation de domaine, qui évolue dans le temps : la fumée s'enroule
          const q1 = fbm3(X, Y, t * .16, 2), q2 = fbm3(X + 5.2, Y + 1.3, t * .16 + 4, 2);
          const dd = d0 + (q1 - .5) * 1.3;
          const prof = Math.exp(-dd * dd * 1.05);
          if (prof < .01) continue;
          const r1 = fbm3(X + 2.4 * q1 + 1.7, Y + 2.4 * q2 + 9.2, t * .24, 2);
          const r2 = fbm3(X + 2.4 * q1 + 8.3, Y + 2.4 * q2 + 2.8, t * .24 + 7, 2);
          const f = fbm3(X + A * .9 * (r1 - .5), Y + A * .9 * (r2 - .5), t * .3, 3);
          const lo = .22 + hn * .2;
          a = smooth(lo, lo + .4, f + (1 - hn) * .2) * prof;
          light = smooth(.2, .9, f * .6 + r1 * .4); // cœur des volutes plus clair, bords plus gris
        }
        a *= fade;
        if (a < .004) continue;
        const o = (j * W + i) * 4;
        d[o] = 186 + 50 * light; d[o + 1] = 181 + 49 * light; d[o + 2] = 175 + 48 * light;
        d[o + 3] = Math.min(255, a * (filaments ? 250 : 225));
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  /* ---------- Rendu par particules (style c) ----------
     Des bouffées naissent à la cheminée, montent (de moins en moins vite), sont poussées vers la droite par un vent
     qui forcit avec la hauteur, et brassées par un champ tourbillonnaire sans divergence (curl noise) qui change
     dans le temps. Elles grossissent et pâlissent en montant. Chaque bouffée est une petite tache de bruit,
     pas un disque, tournée au hasard. */
  const N = 1300;
  const px = new Float32Array(N), py = new Float32Array(N), age = new Float32Array(N), life = new Float32Array(N);
  const rot = new Float32Array(N), spin = new Float32Array(N), sz = new Float32Array(N), kind = new Uint8Array(N);
  const jx = new Float32Array(N), jy = new Float32Array(N); // chaque bouffée a son propre élan
  let alive = 0, emitAcc = 0;
  const sprites = [];
  const makeSprites = () => {
    for (let s = 0; s < 4; s++) {
      const S = 48, c = document.createElement('canvas');
      c.width = c.height = S;
      const g = c.getContext('2d'), id = g.createImageData(S, S);
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
        const dx = (i - S / 2 + .5) / (S / 2), dy = (j - S / 2 + .5) / (S / 2);
        const r = Math.sqrt(dx * dx + dy * dy);
        const n = fbm3(i / 11 + s * 7.3, j / 11, s * 3.1, 3);
        const a = smooth(1, .15, r + (n - .5) * .7) * (.35 + .65 * smooth(.3, .75, n));
        const o = (j * S + i) * 4;
        id.data[o] = 228; id.data[o + 1] = 223; id.data[o + 2] = 217; id.data[o + 3] = a * 255;
      }
      g.putImageData(id, 0, 0);
      sprites.push(c);
    }
  };
  const emit = () => {
    if (alive >= N) return;
    const i = alive++;
    px[i] = sx + (Math.random() - .5) * 5 * wide; py[i] = sy - 2;
    age[i] = 0; life[i] = 9 + Math.random() * 5;
    jx[i] = (Math.random() - .5) * 22; jy[i] = .8 + Math.random() * .4;
    rot[i] = Math.random() * 6.283; spin[i] = (Math.random() - .5) * .5;
    sz[i] = .75 + Math.random() * .5; kind[i] = (Math.random() * 4) | 0;
  };
  const kill = (i) => {
    const l = --alive;
    px[i] = px[l]; py[i] = py[l]; age[i] = age[l]; life[i] = life[l];
    rot[i] = rot[l]; spin[i] = spin[l]; sz[i] = sz[l]; kind[i] = kind[l]; jx[i] = jx[l]; jy[i] = jy[l];
  };
  const curl = (x, y, t, out) => {
    // potentiel de courant scalaire ; sa rotation donne un champ qui tourbillonne sans se tasser
    const k = 1 / 85, e = .08;
    const X = x * k, Y = y * k, T = t * .2;
    const n = (a, b) => noise3(a, b, T) + .5 * noise3(a * 2.1 + 3.7, b * 2.1 + 1.9, T * 1.6);
    out[0] = (n(X, Y + e) - n(X, Y - e)) / (2 * e);
    out[1] = -(n(X + e, Y) - n(X - e, Y)) / (2 * e);
  };
  const cv = [0, 0];
  const stepParticles = (dt, t) => {
    emitAcc += dt * 95;
    while (emitAcc >= 1) { emit(); emitAcc -= 1; }
    for (let i = alive - 1; i >= 0; i--) {
      const h = sy - py[i], hn = Math.max(0, h / reach);
      curl(px[i], py[i], t, cv);
      const amp = (22 + 170 * hn) * wide;      // le brassage forcit en montant : le panache s'ouvre et se déchire
      const vx = (10 + 120 * Math.pow(hn, 1.1)) * wide + jx[i] * hn + amp * cv[0];
      const vy = -62 * jy[i] / (1 + h / 320) + amp * .8 * cv[1];
      const jit = (6 + 40 * hn) * wide * Math.sqrt(dt); // marche au hasard : les bouffées voisines se séparent
      px[i] += vx * dt + (Math.random() - .5) * jit; py[i] += vy * dt + (Math.random() - .5) * jit;
      age[i] += dt; rot[i] += spin[i] * dt;
      if (age[i] > life[i] || hn > 1.08 || px[i] > W * CELL + 60) kill(i);
    }
  };
  const drawParticles = (t) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const inv = 1 / CELL;
    for (let i = 0; i < alive; i++) {
      const y = py[i], h = sy - y, hn = Math.max(0, h / reach);
      const a = .04 * fadeAt(h, y) * smooth(life[i], life[i] - 2.5, age[i]) * (1 - .35 * hn);
      if (a < .003) continue;
      const r = (3 + h * .085) * wide * sz[i] * inv; // la bouffée se dilate en montant
      const c = Math.cos(rot[i]), s = Math.sin(rot[i]);
      ctx.setTransform(c, s, -s, c, px[i] * inv, y * inv);
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(sprites[kind[i]], -r, -r * 1.25, 2 * r, 2.5 * r); // un peu étirée dans le sens de la montée
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
  };

  /* ---------- Boucle : 24 images par seconde au plus, seulement près de l'écran, onglet visible ---------- */
  const FPS = 24;
  const frame = (dt) => {
    time += dt;
    if (style === 'c') { stepParticles(dt, time); drawParticles(time); }
    else field(time);
  };
  let running = false, visible = false, raf = 0, last = 0, acc = 0;
  const loop = (now) => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.1, (now - (last || now)) / 1000);
    last = now; acc += dt;
    if (acc < 1 / FPS) return;
    frame(acc); acc = 0;
  };
  const start = () => { if (running || !visible || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(loop); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  /* La fumée n'apparaît qu'une fois la photo révélée (maison.js pose .is-in sur le temps I) */
  const reveal = (el = canvas) => {
    const chef = document.getElementById('chef');
    const on = () => el.classList.add('is-on');
    if (!chef || !document.querySelector('.maison-on') || chef.classList.contains('is-in')) { setTimeout(on, 600); return; }
    new MutationObserver((m, mo) => { if (chef.classList.contains('is-in')) { mo.disconnect(); setTimeout(on, 900); } })
      .observe(chef, { attributes: true, attributeFilter: ['class'] });
  };

  /* ---------- Curseurs de réglage du style e : localhost seulement, jamais en production ----------
     Les réglages agissent en direct, restent en mémoire dans ce navigateur, et « Copier » donne la ligne
     SMOKE à recopier dans ce fichier. */
  const tuner = (P, placeBox) => {
    const KEY = 'fumee-e-reglages-2'; // nouvelle clé : repart des réglages inscrits dans SMOKE
    const BASE = { ...P };
    try { Object.assign(P, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} };
    const rows = [
      ['spread', 'Largeur en montant', 0, 1.5, .01], ['angle', 'Vent (°)', -40, 40, 1], ['density', 'Densité', .2, 2, .01],
      ['curl', 'Enroulement', 0, 1.5, .01], ['softness', 'Douceur', 0, 1, .01], ['detail', 'Fils secondaires', 0, 1, .01],
      ['rise', 'Vitesse de montée', .2, 2, .01], ['scale', 'Échelle', .4, 2, .01], ['seed', 'Forme (seed)', 0, 30, 1],
      ['dx', 'Décalage horizontal (px)', -200, 200, 1],
    ];
    const st = document.createElement('style');
    st.textContent =
      '.fumee-tune{position:fixed;right:14px;bottom:64px;z-index:200;width:260px;max-height:70vh;overflow:auto;padding:12px 14px;' +
      'border-radius:12px;background:rgba(20,16,14,.88);border:1px solid rgba(255,238,223,.25);color:#FFEEDF;' +
      'font:500 12px/1.3 var(--sans,system-ui);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}' +
      '.fumee-tune label{display:block;margin:0 0 8px}.fumee-tune .r{display:flex;justify-content:space-between;opacity:.85}' +
      '.fumee-tune input[type=range]{width:100%;accent-color:#E36B4F}' +
      '.fumee-tune .b{display:flex;gap:6px;margin-top:10px}.fumee-tune button{flex:1;padding:7px 0;border-radius:6px;cursor:pointer;' +
      'border:1px solid rgba(255,238,223,.35);background:none;color:inherit;font:inherit}' +
      '.fumee-tune summary{cursor:pointer;letter-spacing:.12em;text-transform:uppercase;font-size:11px;margin-bottom:8px}';
    document.head.appendChild(st);
    const box = document.createElement('details');
    box.className = 'fumee-tune'; box.open = true;
    box.innerHTML = '<summary>Réglages fumée (local)</summary>';
    const inputs = {};
    rows.forEach(([k, label, min, max, step]) => {
      const l = document.createElement('label');
      l.innerHTML = `<span class="r"><span>${label}</span><b></b></span>`;
      const i = document.createElement('input');
      Object.assign(i, { type: 'range', min, max, step, value: P[k] });
      const out = l.querySelector('b');
      const show = () => { out.textContent = (+P[k]).toFixed(step < 1 ? 2 : 0); };
      i.addEventListener('input', () => { P[k] = +i.value; show(); save(); if (k === 'seed' || k === 'dx') placeBox(); });
      show(); l.appendChild(i); box.appendChild(l); inputs[k] = [i, show];
    });
    const lc = document.createElement('label');
    lc.innerHTML = '<span class="r"><span>Couleur</span></span>';
    const ci = document.createElement('input'); ci.type = 'color'; ci.value = P.color;
    ci.addEventListener('input', () => { P.color = ci.value; save(); });
    lc.appendChild(ci); box.appendChild(lc);
    const b = document.createElement('div'); b.className = 'b';
    const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Copier';
    copy.addEventListener('click', () => {
      const line = 'const SMOKE = ' + JSON.stringify(P) + ';';
      (navigator.clipboard ? navigator.clipboard.writeText(line) : Promise.reject()).then(() => { copy.textContent = 'Copié'; }, () => { prompt('Réglages', line); });
      setTimeout(() => { copy.textContent = 'Copier'; }, 1500);
    });
    const reset = document.createElement('button'); reset.type = 'button'; reset.textContent = 'Défaut';
    reset.addEventListener('click', () => {
      Object.assign(P, BASE); save(); ci.value = P.color;
      Object.entries(inputs).forEach(([k, [i, show]]) => { i.value = P[k]; show(); }); placeBox();
    });
    b.append(copy, reset); box.appendChild(b);
    document.body.appendChild(box);
  };

  /* ---------- Style e : le composant Smoke de shadcn.io ----------
     Le moteur (vendor/background-runtime.js) et la scène (vendor/smoke-scene.js) sont ceux du composant,
     sans retouche. On fait ici ce que font smoke.tsx (les props deviennent des uniforms) et background-canvas.tsx
     (une boîte, un canvas qui la remplit, les options de mountBackground).
     Réglages pour la page :
     - un seul panache (count 1), dont la source tombe sur la cheminée de la photo ; la scène part du bas de la boîte,
       à 4 % de sa hauteur sous le bord, et un panache seul se tient près du milieu, décalé selon le seed :
       on calcule ce décalage comme le shader (hash32) pour poser la boîte au bon endroit ;
     - couché vers la droite (angle 30°, l'esprit du preset Draught à 28°), montée lente (rise .8) ;
     - seed 1 : parmi les arrangements essayés (0, 1, 3, 5, 7), le plus fin, avec une boucle lisible sous le bouton ;
     - crème #EDE6DD plutôt que le blanc bleuté par défaut (#d6e0f1, essayé) : le bleuté paraît froid à côté
       de la fumée chaude de la photo ;
     - discret : densité basse (.62 au lieu de 1) ;
     - pas de déviation au pointeur (interactive: false) ;
     - le moteur anime à la fréquence de l'écran : pour rester à 24 images par seconde, on lui passe une heure fixe
       (option time) que notre boucle avance, et notre boucle s'arrête hors écran ou onglet caché.
       Avec une heure fixe, le moteur n'a pas d'entrée progressive (uIntro vaut 1) : le fondu CSS de .is-on la remplace. */
  // réglages choisis par Harry le 24/11/2026 avec les curseurs locaux
  const SMOKE = { angle: 30, color: '#EDE6DD', count: 1, curl: .9, density: 1.21, detail: 0, origin: 'bottom',
    rise: .8, scale: 1, seed: 1, softness: 1, spread: 1.5, dx: 0 };
  const fract = (x) => x - Math.floor(x);
  const hash32 = (px, py) => { // même calcul que hash32 dans le prélude du moteur
    let q = [fract(px * .1031), fract(py * .1030), fract(px * .0973)];
    const d = q[0] * (q[1] + 33.33) + q[1] * (q[0] + 33.33) + q[2] * (q[2] + 33.33);
    q = q.map(v => v + d);
    return [fract((q[0] + q[1]) * q[2]), fract((q[0] + q[2]) * q[1]), fract((q[1] + q[2]) * q[0])];
  };
  const smoke = async () => {
    let engine, scene;
    try {
      [engine, scene] = await Promise.all([import('./vendor/background-runtime.js?v=1'), import('./vendor/smoke-scene.js?v=1')]);
    } catch (e) { return; }
    const box = document.createElement('div');
    box.className = canvas.className;
    box.setAttribute('aria-hidden', 'true');
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    box.appendChild(cv);
    canvas.replaceWith(box);
    // pas de flou CSS (les fils sont nets). Le haut de la boîte fond au transparent : la scène n'y descend qu'à 40 %,
    // le panache serait coupé net. Sur les côtés, la boîte est assez large pour que le panache n'y arrive pas.
    const fadeMask = 'linear-gradient(0deg, #000 55%, transparent 100%)';
    Object.assign(box.style, { filter: 'none', webkitMaskImage: fadeMask, maskImage: fadeMask });
    const P = SMOKE;
    const placeBox = () => {
      const seedRnd = hash32(0 * 7.31 + P.seed * 3.17, P.seed + 2.7); // rnd du panache 0, comme dans scene()
      const c = photoPoint(.4297, .2031);
      const heroH = hero.offsetHeight;
      const top = heroH - Math.min(heroH * .34, 300); // monte un peu plus haut que a, b, c : le masque efface le haut
      const H = Math.max(80, (c.y - top) / 1.04);     // la source est à 0,04 H sous le bas de la boîte
      const W = H * 3;                                // assez large pour le panache couché et élargi, de part et d'autre
      const x0 = (seedRnd[1] - .5) * .2 * (W / H) * H; // décalage du panache seul par rapport au milieu, en px
      const left = c.x - W / 2 - x0 + (P.dx || 0);
      Object.assign(box.style, { left: left + 'px', top: top + 'px', width: W + 'px', height: H + 'px' });
    };
    if (local) tuner(P, placeBox);
    placeBox();
    const options = (t) => ({
      colors: { uDayColor: P.color, uNightColor: P.color },
      grain: 0, interactive: false, quality: .8, scene: scene.SCENE, speed: 1, still: 20, time: t,
      uniforms: {
        uCount: P.count, uCurl: P.curl, uDensity: P.density, uDetail: P.detail, uLean: scene.tangentOf(P.angle),
        uOrigin: scene.ORIGINS[P.origin], uRise: P.rise, uScale: P.scale, uSeed: P.seed, uSoftness: P.softness, uSpread: P.spread,
      },
    });
    let t = 20;
    engine.mountBackground(box, cv, options(t));
    if (box.dataset.state === 'unsupported') { box.remove(); return; }
    reveal(box);
    let on = false, vis = false, raf = 0, last = 0, acc = 0;
    const loop = (now) => {
      if (!on) return;
      raf = requestAnimationFrame(loop);
      const dt = Math.min(.1, (now - (last || now)) / 1000);
      last = now; acc += dt;
      if (acc < 1 / FPS) return;
      t += acc; acc = 0;
      engine.mountBackground(box, cv, options(t)); // le moteur met à jour la scène en place
    };
    const go = () => { if (on || !vis || document.hidden) return; on = true; last = 0; raf = requestAnimationFrame(loop); };
    const halt = () => { on = false; cancelAnimationFrame(raf); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { vis = es[0].isIntersecting; vis ? go() : halt(); }, { rootMargin: '80px 0px' }).observe(box);
    } else { vis = true; go(); }
    document.addEventListener('visibilitychange', () => (document.hidden ? halt() : go()));
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(placeBox, 200); });
  };

  const init = () => {
    if (style === 'e') { smoke(); return; }
    place();
    if (style === 'c') {
      makeSprites();
      for (let s = 0; s < 9 * FPS; s++) { time += 1 / FPS; stepParticles(1 / FPS, time); } // le panache est déjà formé
    } else time = 17;
    frame(1 / FPS);
    reveal();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); }, { rootMargin: '80px 0px' }).observe(canvas);
    } else { visible = true; start(); }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { const ox = sx, oy = sy; place(); for (let i = 0; i < alive; i++) { px[i] += sx - ox; py[i] += sy - oy; } frame(0); }, 200);
    });
  };
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init, { once: true });
})();
