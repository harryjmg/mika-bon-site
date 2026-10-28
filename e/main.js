(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lin = (a, b, x) => clamp((x - a) / (b - a), 0, 1);
  const ss = (a, b, x) => { const t = lin(a, b, x); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  /* ---------- Formulaire : WhatsApp ou e-mail pré-rempli ---------- */
  const form = document.getElementById('quote-form');
  const err = document.getElementById('form-error');
  // À REMPLACER : numéro et adresse réels
  const WA = '33600000000';
  const MAIL = 'contact@mikabon.fr';
  form.addEventListener('submit', e => {
    e.preventDefault();
    const channel = (e.submitter && e.submitter.dataset.channel) || 'whatsapp';
    const missing = [];
    form.querySelectorAll('[required]').forEach(f => {
      const bad = !f.value.trim();
      f.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad) missing.push(form.querySelector(`label[for="${f.id}"]`).textContent.trim());
    });
    if (missing.length) {
      err.hidden = false;
      err.textContent = `Il manque : ${missing.join(', ').toLowerCase()}.`;
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    err.hidden = true;
    const d = new FormData(form);
    const date = d.get('date') ? new Date(d.get('date') + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const lines = [
      'Bonjour Mika, je voudrais un devis.', '',
      `Événement : ${d.get('type')}`,
      `Date : ${date}`,
      `Lieu : ${d.get('lieu')}`,
      `Invités : ${d.get('invites')}`,
      `Nom : ${d.get('nom')}`,
      `Contact : ${d.get('contact')}`
    ];
    if (d.get('message').trim()) lines.push('', d.get('message').trim());
    const text = lines.join('\n');
    if (channel === 'mail') {
      const subject = `Demande de devis : ${d.get('type')}, ${date}`;
      window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    } else {
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
  });
  form.addEventListener('input', e => { if (e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false'); });

  if (reduce) { document.documentElement.classList.add('reduce'); return; }

  /* =====================================================================
     LE PLAN-SÉQUENCE
     p va de 0 à 1 sur toute la hauteur de #film. Chaque plan dit, pour un p
     donné, s'il est visible, son zoom, le point visé et l'ouverture de son
     masque. Les points (f) sont en fraction de l'image source.
     ===================================================================== */
  const film = document.getElementById('film');
  const stage = document.getElementById('stage');
  const plans = {};
  stage.querySelectorAll('.plan').forEach(el => {
    plans[el.dataset.id] = {
      el, cam: el.querySelector('.cam'), img: el.querySelector('img'),
      src: el.dataset.src, w: +el.dataset.w, h: +el.dataset.h,
      srcT: el.dataset.srcTall, wT: +el.dataset.wTall, hT: +el.dataset.hTall,
      subs: [...el.querySelectorAll('[data-in]')].map(s => ({ el: s, a: +s.dataset.in, b: +s.dataset.out })),
      L: null, on: false, masked: false
    };
  });

  const stageSubs = [...stage.querySelectorAll(':scope > .sub')].map(s => ({ el: s, a: +s.dataset.in, b: +s.dataset.out }));
  let W = 0, H = 0, tall = false, mobile = false;

  // point à garder au centre quand l'image est rognée (paysage / portrait)
  const CROP = {
    aube: [[0.5, 0.5], [0.44, 0.6]],
    fumee: [[0.5, 0.5], [0.45, 0.5]],
    poulets: [[0.5, 0.6], [0.5, 0.6]],
    feu: [[0.5, 0.6], [0.52, 0.6]],
    brisket: [[0.55, 0.5], [0.5, 0.55]],
    tire1: [[0.5, 0.5], [0.46, 0.55]],
    tire2: [[0.5, 0.5], [0.46, 0.55]],
    tire3: [[0.5, 0.5], [0.5, 0.55]],
    tablee: [[0.5, 0.5], [0.5, 0.6]],
    mika: [[0.5, 0.5], [0.55, 0.45]]
  };

  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    tall = W / H < 0.8; mobile = W < 700;
    for (const id in plans) {
      const P = plans[id];
      const useT = tall && P.srcT;
      const iw = useT ? P.wT : P.w, ih = useT ? P.hT : P.h;
      const want = useT ? P.srcT : P.src;
      if (P.img.getAttribute('src') !== want) P.img.setAttribute('src', want);
      const c = Math.max(W / iw, H / ih);
      const w = iw * c, h = ih * c;
      const [cx, cy] = CROP[id][W / H < 1 ? 1 : 0];
      const left = clamp(W / 2 - cx * w, W - w, 0);
      const top = clamp(H / 2 - cy * h, H - h, 0);
      P.L = { w, h, left, top };
      P.cam.style.width = w + 'px';
      P.cam.style.height = h + 'px';
    }
    sizeFog();
  }

  // caméra : zoom z autour du point f de l'image, posé à l'écran en (px, py)
  function setCam(P, z, fx, fy, px, py) {
    const { w, h } = P.L;
    const tx = px - z * fx * w, ty = py - z * fy * h;
    P.cam.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${z.toFixed(4)})`;
  }
  // poussée vers un point : le point glisse vers le centre pendant que l'on zoome
  function push(P, z, f, k) {
    const { w, h, left, top } = P.L;
    let px = mix(left + f[0] * w, W / 2, k), py = mix(top + f[1] * h, H / 2, k);
    if (z >= 1) {
      px = clamp(px, W - z * (1 - f[0]) * w, z * f[0] * w);
      py = clamp(py, H - z * (1 - f[1]) * h, z * f[1] * h);
    }
    setCam(P, z, f[0], f[1], px, py);
  }
  // zoom centré sur l'écran (apparition et retrait)
  function center(P, z) {
    const { w, h, left, top } = P.L;
    setCam(P, z, (W / 2 - left) / w, (H / 2 - top) / h, W / 2, H / 2);
  }
  // masque elliptique doux : 0 fermé, 1 plein écran. Il ne dépasse jamais
  // l'image quand elle est réduite (z < 1), sinon on verrait ses bords.
  function mask(P, g, z = 1, hard = 52) {
    if (g >= 0.999) {
      if (P.masked) { P.el.style.maskImage = P.el.style.webkitMaskImage = ''; P.masked = false; }
      return;
    }
    const s = Math.min(1.75 * easeOut(g), z < 1 ? z * 1.02 : 9);
    const rx = (W / 2) * s, ry = (H / 2) * s;
    const m = `radial-gradient(${rx.toFixed(0)}px ${ry.toFixed(0)}px at 50% 50%, #000 ${hard}%, transparent 100%)`;
    P.el.style.maskImage = m; P.el.style.webkitMaskImage = m;
    P.masked = true;
  }
  // apparition : l'image naît au point visé et grandit jusqu'au plein cadre
  function grow(P, g) {
    const z = mix(0.5, 1, easeOut(g));
    center(P, z); mask(P, g, z);
  }
  const zPush = (a, b, zEnd, p) => Math.pow(zEnd, Math.pow(lin(a, b, p), 1.7));

  // grow : [a, b] apparition depuis le centre ; puis drift et push
  const SHOTS = {
    aube: { show: [0, 0.172], run(P, p, t) {
      const breathe = 1 + 0.02 * (0.5 - 0.5 * Math.cos(t / 5200)) * (1 - lin(0, 0.03, p));
      push(P, zPush(0.015, 0.172, 20, p) * breathe, [0.392, 0.47], ss(0.015, 0.165, p));
    } },
    fumee: { show: [0.148, 0.318], run(P, p) {
      if (p < 0.2) grow(P, lin(0.148, 0.2, p));
      else if (p < 0.235) push(P, mix(1, 1.08, lin(0.2, 0.235, p)), [0.42, 0.55], 0);
      else push(P, 1.08 * zPush(0.235, 0.318, 11, p), [0.42, 0.55], ss(0.235, 0.31, p));
    } },
    poulets: { show: [0.298, 0.458], run(P, p) {
      if (p < 0.345) grow(P, lin(0.298, 0.345, p));
      else if (p < 0.375) push(P, mix(1, 1.06, lin(0.345, 0.375, p)), [0.52, 0.92], 0);
      else push(P, 1.06 * zPush(0.375, 0.458, 11, p), [0.52, 0.92], ss(0.375, 0.45, p));
    } },
    feu: { show: [0.44, 0.618], run(P, p) {
      if (p < 0.485) grow(P, lin(0.44, 0.485, p));
      else if (p < 0.53) push(P, mix(1, 1.12, lin(0.485, 0.53, p)), [0.53, 0.74], 0);
      else push(P, 1.12 * zPush(0.53, 0.618, 14, p), [0.53, 0.74], ss(0.53, 0.61, p));
    } },
    brisket: { show: [0.598, 0.695], run(P, p) {
      if (p < 0.635) grow(P, lin(0.598, 0.635, p));
      else push(P, mix(1, 1.22, ss(0.635, 0.695, p)), [0.5, 0.55], 0);
    } },
    tire1: { show: [0.695, 0.735], run(P, p) { push(P, mix(1.02, 1.12, lin(0.695, 0.735, p)), [0.48, 0.55], 0); } },
    tire2: { show: [0.735, 0.775], run(P, p) { push(P, mix(1.04, 1.14, lin(0.735, 0.775, p)), [0.46, 0.55], 0); } },
    // recul : tire-3 part vers le noir, puis la tablée sort du noir. Jamais les deux à la fois.
    tire3: { show: [0.775, 0.836], run(P, p) {
      if (p < 0.81) { P.el.style.opacity = ''; push(P, mix(1.04, 1.12, lin(0.775, 0.81, p)), [0.5, 0.55], 0); }
      else { const t = lin(0.81, 0.836, p); P.el.style.opacity = (1 - ss(0.2, 1, t)).toFixed(3); center(P, mix(1.12, 0.82, easeOut(t))); }
    } },
    tablee: { show: [0.836, 0.962], run(P, p) {
      P.el.style.opacity = ss(0.836, 0.852, p).toFixed(3);
      if (p < 0.905) push(P, mix(1.25, 1, easeOut(lin(0.836, 0.9, p))), [0.49, 0.72], 0); else push(P, zPush(0.905, 0.962, 9, p), [0.235, 0.42], ss(0.905, 0.958, p));
    } },
    mika: { show: [0.938, 1.01], run(P, p) {
      if (p < 0.975) grow(P, lin(0.938, 0.975, p));
      else push(P, mix(1, 1.05, lin(0.975, 1, p)), tall ? [0.55, 0.3] : [0.18, 0.3], 0);
    } }
  };

  // voiles : fumée blanche (s) ou flamme (f), centrés sur une transition
  const BUMPS = [
    { at: 0.158, w: 0.013, kind: 's', k: 1 },
    { at: 0.31, w: 0.013, kind: 's', k: 0.75 },
    { at: 0.452, w: 0.013, kind: 'f', k: 0.75 },
    { at: 0.608, w: 0.013, kind: 'f', k: 1 },
    { at: 0.952, w: 0.013, kind: 's', k: 0.9 }
  ];
  function veilAt(p) {
    let s = 0, f = 0;
    for (const b of BUMPS) {
      const v = b.k * Math.exp(-Math.pow((p - b.at) / b.w, 2));
      if (b.kind === 's') s = Math.max(s, v); else f = Math.max(f, v);
    }
    return { s, f };
  }
  // brume de fond hors transitions : vapeur sur la viande
  const steamAt = p => 0.3 * ss(0.18, 0.2, p) * (1 - ss(0.23, 0.25, p)) + 0.32 * ss(0.62, 0.66, p) * (1 - ss(0.8, 0.83, p));
  const emberAt = p => 0.35 * ss(0.4, 0.45, p) * (1 - ss(0.63, 0.66, p)) + 0.12 * ss(0.69, 0.71, p) * (1 - ss(0.8, 0.82, p));

  const CLOCK = [[0, 340], [0.16, 395], [0.31, 540], [0.45, 780], [0.61, 1110], [0.7, 1170], [0.82, 1215], [0.95, 1290], [1, 1320]];
  const SCENES = [[0, "L'aube"], [0.155, 'La fumée'], [0.305, 'Le fourneau'], [0.45, 'Le foyer'], [0.605, 'La découpe'], [0.695, "L'effilochage"], [0.836, 'La tablée'], [0.95, 'Le chef']];
  const clockTime = document.getElementById('clock-time');
  const clockScene = document.getElementById('clock-scene');
  const clockBar = document.getElementById('clock-bar');
  const clockEl = clockTime.parentElement;
  function clockAt(p) {
    let m = CLOCK[0][1];
    for (let i = 1; i < CLOCK.length; i++) {
      if (p <= CLOCK[i][0]) { m = mix(CLOCK[i - 1][1], CLOCK[i][1], lin(CLOCK[i - 1][0], CLOCK[i][0], p)); break; }
      m = CLOCK[i][1];
    }
    m = Math.round(m / 5) * 5;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  /* ---------- Sprites de fumée ---------- */
  function sprite(tint, n = 14, a = 0.09) {
    const s = 256, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    for (let i = 0; i < n; i++) {
      const x = s / 2 + rand(-42, 42), y = s / 2 + rand(-42, 42), r = rand(46, 86);
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(${tint},${a})`);
      grd.addColorStop(0.5, `rgba(${tint},${a * 0.45})`);
      grd.addColorStop(1, `rgba(${tint},0)`);
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    }
    return c;
  }
  const SMOKE = [sprite('238,232,224'), sprite('230,222,214'), sprite('244,236,230')];
  const FIRE = [sprite('255,170,90', 14, 0.12), sprite('255,120,50', 14, 0.12)];

  /* ---------- Le voile : on traverse la fumée (particules en profondeur) ---------- */
  const veil = document.getElementById('veil');
  const vctx = veil.getContext('2d');
  const puffs = [];
  function newPuff(far) {
    return { x: rand(-1.3, 1.3), y: rand(-0.9, 0.9), z: far ? rand(1.2, 1.8) : rand(0.15, 1.8), r: rand(0.5, 1.1), rot: rand(0, 6.28), vr: rand(-0.004, 0.004), s: (Math.random() * 3) | 0 };
  }
  function sizeCanvas(c, ctx, k) {
    c.width = Math.max(1, Math.round(W * k)); c.height = Math.max(1, Math.round(H * k));
    ctx.setTransform(k, 0, 0, k, 0, 0);
  }

  /* ---------- Braises qui volent vers la caméra ---------- */
  const emb = document.getElementById('embers');
  const ectx = emb.getContext('2d');
  const sparks = [];

  /* ---------- Brume et fumée de l'aube (dans l'image, zoomée avec elle) ---------- */
  const fog = document.getElementById('fog');
  const fctx = fog.getContext('2d');
  const FOGK = 0.35;
  let fw = 0, fh = 0;
  const mist = [], column = [];
  function sizeFog() {
    const L = plans.aube.L;
    fw = L.w; fh = L.h;
    fog.width = Math.round(fw * FOGK); fog.height = Math.round(fh * FOGK);
    fctx.setTransform(FOGK, 0, 0, FOGK, 0, 0);
  }
  function newMist(init) {
    return { x: init ? rand(-0.2, 1.2) : -0.25, y: rand(0.4, 0.78), r: rand(0.1, 0.24), vx: rand(0.00008, 0.00022), a: rand(0.35, 0.8), s: (Math.random() * 3) | 0 };
  }
  function newCol(init) {
    const life = init ? rand(0, 1) : 0;
    return { x: 0.381 + rand(-0.004, 0.004), y: 0.525, vx: rand(0.0003, 0.0007), vy: -rand(0.0006, 0.0011), r: rand(0.012, 0.02), life, ttl: rand(380, 620), s: (Math.random() * 3) | 0, pre: init ? life * 520 : 0 };
  }

  /* ---------- Bande horizontale ---------- */
  const reel = document.getElementById('reel');
  const track = document.getElementById('reel-track');
  let trackRun = 0;
  function sizeReel() {
    trackRun = Math.max(0, track.scrollWidth - window.innerWidth);
    reel.style.height = (window.innerHeight + trackRun) + 'px';
  }

  /* ---------- Démarrage ---------- */
  function onResize() {
    layout();
    sizeCanvas(veil, vctx, 0.5);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    sizeCanvas(emb, ectx, dpr);
    sizeReel();
  }
  onResize();
  for (let i = 0; i < (W < 700 ? 18 : 30); i++) puffs.push(newPuff(false));
  for (let i = 0; i < (W < 700 ? 10 : 16); i++) mist.push(newMist(true));
  for (let i = 0; i < (W < 700 ? 22 : 34); i++) column.push(newCol(true));
  window.addEventListener('resize', onResize);
  track.querySelectorAll('img').forEach(im => im.addEventListener('load', sizeReel));

  const open = document.getElementById('open');
  const bar = document.getElementById('bar');
  const whiteout = document.getElementById('whiteout');
  const flame = document.getElementById('flame');
  const flash = document.getElementById('flash');

  let sm = -1, last = 0, lastCut = -1, prevSm = 0;

  function target() {
    const run = film.offsetHeight - H;
    return clamp((window.scrollY - film.offsetTop) / run, 0, 1);
  }

  function cutIndex(p) {
    if (p < 0.68 || p > 0.81) return -1;
    return p < 0.695 ? 0 : p < 0.735 ? 1 : p < 0.775 ? 2 : 3;
  }

  function frame(t) {
    const dt = Math.min(50, t - (last || t)); last = t;
    const tg = target();
    if (sm < 0) sm = tg;
    sm += (tg - sm) * (1 - Math.pow(0.86, dt / 16.7));
    if (Math.abs(tg - sm) < 0.00004) sm = tg;
    const p = sm;
    const speed = Math.abs(p - prevSm) * 60; prevSm = p;
    const inFilm = p < 1 || film.getBoundingClientRect().bottom > 0;

    if (inFilm) {
      // plans
      for (const id in SHOTS) {
        const S = SHOTS[id], P = plans[id];
        const on = p >= S.show[0] && p < S.show[1];
        if (on !== P.on) { P.el.classList.toggle('is-on', on); P.on = on; }
        if (!on) continue;
        P.masked && mask(P, 1);
        S.run(P, p, t);
        fade(P.subs, p);
      }
      fade(stageSubs, p);
      // ouverture
      const o = 1 - ss(0.002, 0.03, p);
      open.style.opacity = o.toFixed(3);
      open.style.transform = `translate3d(0, ${(-(1 - o) * 60).toFixed(1)}px, 0) scale(${(1 + (1 - o) * 0.08).toFixed(3)})`;
      open.style.visibility = o < 0.01 ? 'hidden' : '';

      // coupes franches : flash et secousse
      const ci = cutIndex(p);
      if (ci !== lastCut) {
        if (ci > -1 && lastCut > -1) {
          flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
          stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake');
        }
        lastCut = ci;
      }

      // voiles
      const V = veilAt(p);
      whiteout.style.opacity = (Math.pow(V.s, 1.6) * 0.6).toFixed(3);
      flame.style.opacity = (Math.pow(V.f, 1.4) * 0.55).toFixed(3);
      drawVeil(V.s * 0.75 + steamAt(p), V.f * 0.7, speed);
      drawEmbers(emberAt(p) + V.f * 1.6, speed);
      if (plans.aube.on) drawFog(t);

      clockTime.textContent = clockAt(p);
      let sc = SCENES[0][1];
      for (const [a, n] of SCENES) if (p >= a) sc = n;
      if (clockScene.textContent !== sc) clockScene.textContent = sc;
      clockBar.style.transform = `scaleX(${p.toFixed(4)})`;
      clockEl.classList.toggle('is-off', p < 0.02 || p > 0.965);
    }

    bar.classList.toggle('is-solid', film.getBoundingClientRect().bottom < 70);
    // bande horizontale
    const rr = reel.getBoundingClientRect();
    if (rr.top < window.innerHeight && rr.bottom > 0) {
      const q = clamp(-rr.top / Math.max(1, rr.height - window.innerHeight), 0, 1);
      track.style.transform = `translate3d(${(-q * trackRun).toFixed(1)}px, 0, 0)`;
    }
    requestAnimationFrame(frame);
  }

  function fade(list, p) {
    for (const s of list) {
      const v = ss(s.a, s.a + 0.014, p) * (1 - ss(s.b - 0.014, s.b, p));
      if (s.v === v) continue;
      s.v = v;
      s.el.style.opacity = v.toFixed(3);
      s.el.style.transform = `translate3d(0, ${((1 - v) * 18).toFixed(1)}px, 0)`;
    }
  }

  function drawVeil(ds, df, speed) {
    vctx.clearRect(0, 0, W, H);
    if (ds < 0.01 && df < 0.01) return;
    const f = Math.min(W, H) * 0.9;
    const vz = 0.004 + Math.min(0.05, speed * 0.6);
    for (const q of puffs) {
      q.z -= vz; q.rot += q.vr;
      if (q.z < 0.12) Object.assign(q, newPuff(true));
      const sx = W / 2 + (q.x / q.z) * f * 0.5, sy = H / 2 + (q.y / q.z) * f * 0.5;
      const r = (q.r / q.z) * f * 0.55;
      const a = ss(1.8, 1.3, q.z) * ss(0.12, 0.4, q.z);
      vctx.save(); vctx.translate(sx, sy); vctx.rotate(q.rot);
      if (ds > 0.01) { vctx.globalAlpha = clamp(a * ds, 0, 1); vctx.drawImage(SMOKE[q.s], -r, -r, r * 2, r * 2); }
      if (df > 0.01) { vctx.globalAlpha = clamp(a * df, 0, 1); vctx.drawImage(FIRE[q.s % 2], -r, -r, r * 2, r * 2); }
      vctx.restore();
    }
    vctx.globalAlpha = 1;
  }

  function drawEmbers(rate, speed) {
    ectx.clearRect(0, 0, W, H);
    const cap = W < 700 ? 70 : 160;
    if (Math.random() < rate && sparks.length < cap) {
      const n = 1 + ((Math.random() * rate * 4) | 0);
      for (let i = 0; i < n; i++) sparks.push({ x: rand(-0.5, 0.5), y: rand(-0.15, 0.55), z: rand(1, 1.4), vx: rand(-0.004, 0.004), vy: rand(-0.008, -0.002), vz: rand(0.006, 0.016), r: rand(1, 2.4), ph: rand(0, 6.28), life: 0 });
    }
    if (!sparks.length) return;
    const f = Math.min(W, H) * 0.6;
    ectx.globalCompositeOperation = 'lighter';
    ectx.lineCap = 'round';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const e = sparks[i];
      const ox = W / 2 + (e.x / e.z) * f, oy = H / 2 + (e.y / e.z) * f;
      e.z -= e.vz * (1 + speed * 25); e.x += e.vx; e.y += e.vy; e.life++;
      if (e.z < 0.06) { sparks.splice(i, 1); continue; }
      const sx = W / 2 + (e.x / e.z) * f, sy = H / 2 + (e.y / e.z) * f;
      if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) { sparks.splice(i, 1); continue; }
      const size = Math.min(9, e.r / e.z);
      const fl = 0.65 + 0.35 * Math.sin(e.life * 0.5 + e.ph);
      ectx.globalAlpha = clamp(fl * Math.min(1, e.life / 10), 0, 1);
      ectx.strokeStyle = e.z > 0.5 ? '#FFB45E' : '#FFD9A0';
      ectx.lineWidth = size;
      ectx.beginPath(); ectx.moveTo(ox, oy); ectx.lineTo(sx, sy); ectx.stroke();
    }
    ectx.globalAlpha = 1; ectx.globalCompositeOperation = 'source-over';
  }

  function drawFog(t) {
    fctx.clearRect(0, 0, fw, fh);
    for (let i = 0; i < mist.length; i++) {
      const m = mist[i];
      m.x += m.vx;
      if (m.x > 1.3) { mist[i] = newMist(false); continue; }
      const r = m.r * fw;
      fctx.globalAlpha = m.a * (0.75 + 0.25 * Math.sin(t / 3000 + i));
      fctx.drawImage(SMOKE[m.s], m.x * fw - r, m.y * fh - r * 0.45, r * 2, r * 0.9);
    }
    for (let i = 0; i < column.length; i++) {
      const c = column[i];
      if (c.pre > 0) { const n = c.pre; c.x += c.vx * n; c.y += c.vy * n; c.r *= Math.pow(1.0032, n); c.pre = 0; }
      c.life += 1 / c.ttl;
      if (c.life >= 1) { column[i] = newCol(false); continue; }
      c.x += c.vx; c.y += c.vy; c.vx += 0.0000025; c.r *= 1.0032;
      const r = c.r * fw;
      fctx.globalAlpha = Math.sin(c.life * Math.PI) * 0.55;
      fctx.drawImage(SMOKE[c.s], c.x * fw - r, c.y * fh - r, r * 2, r * 2);
    }
    fctx.globalAlpha = 1;
  }

  requestAnimationFrame(frame);
})();
