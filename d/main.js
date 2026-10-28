(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const root = document.documentElement;

  /* ---------- Les plans ---------- */
  const film = document.getElementById('film');
  const stage = document.getElementById('stage');
  const plans = [...stage.querySelectorAll('.plan')];
  const FADE = 0.09; // fondu au noir, en écrans : un passage occupe au plus 18 % d'un plan
  let T = 0;
  const P = plans.map((el, i) => {
    const w = parseFloat(el.dataset.w || 1);
    const p = {
      el, i, w, s: T,
      t: parseFloat(el.dataset.t),
      fx: parseFloat(el.dataset.fx || .5), fy: parseFloat(el.dataset.fy || .5),
      kbs: [...el.querySelectorAll('.kb')],
      sub: el.querySelector('.sub:not(.sub--cut)'),
      subs: [...el.querySelectorAll('.sub')],
      op: 0, local: 0
    };
    T += w;
    return p;
  });
  P.forEach((p, i) => { p.tEnd = i < P.length - 1 ? P[i + 1].t : parseFloat(p.el.dataset.end || p.t + 40); });
  const byClass = c => P.find(p => p.el.classList.contains(c));
  const pNuit = byClass('plan--nuit');
  const pFeu = P.find(p => p.el.id === 'film-feu');
  const pCut = byClass('plan--cut');
  const hero = document.getElementById('hero');

  /* Les sous-titres passent sur un calque au-dessus de la fumée : jamais voilés */
  const subLayer = document.createElement('div');
  subLayer.className = 'subs';
  hero.before(subLayer);
  P.forEach(p => p.subs.forEach(sb => subLayer.appendChild(sb)));

  /* ---------- Cadrage : chaque image couvre l'écran, centrée sur son sujet ---------- */
  let W = 0, H = 0, lastW = 0, lastH = 0;
  function frameKb(kb, fx, fy) {
    const ar = parseFloat(kb.dataset.ar || 1.5);
    let iw, ih;
    if (W / H > ar) { iw = W; ih = W / ar; } else { ih = H; iw = H * ar; }
    const x = clamp(W / 2 - fx * iw, W - iw, 0);
    const y = clamp(H / 2 - fy * ih, H - ih, 0);
    kb.style.width = iw + 'px'; kb.style.height = ih + 'px';
    kb.style.left = x + 'px'; kb.style.top = y + 'px';
    // le zoom pousse vers le sujet
    kb.style.transformOrigin = `${(fx * 100).toFixed(1)}% ${(fy * 100).toFixed(1)}%`;
    kb._iw = iw;
  }
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    // sur mobile, la barre d'adresse change la hauteur : on ignore les petits écarts
    if (W !== lastW || Math.abs(window.innerHeight - lastH) > 140) {
      lastW = W; lastH = window.innerHeight;
      film.style.height = Math.round((T + 1) * lastH) + 'px';
    }
    P.forEach(p => p.kbs.forEach(kb => frameKb(kb, parseFloat(kb.dataset.fx || p.fx), parseFloat(kb.dataset.fy || p.fy))));
    dayW = clockDay.clientWidth;
    fx.resize();
  }

  /* ---------- Horloge et couleur de la lumière ---------- */
  const clock = document.getElementById('clock');
  const digits = [...document.getElementById('clock-time').children].filter(s => !s.classList.contains('clock__sep'));
  const clockDay = clock.querySelector('.clock__day');
  const dot = document.getElementById('clock-dot');
  let dayW = 0;
  // minute de la journée -> couleur de la lumière
  const LIGHT = [
    [240, [27, 44, 85]],    // nuit bleu-noir
    [282, [200, 74, 30]],   // braise
    [340, [120, 62, 86]],
    [415, [236, 150, 150]], // aube rose
    [560, [238, 192, 108]], // plein jour doré
    [900, [240, 184, 98]],
    [1080, [226, 136, 58]],
    [1120, [205, 102, 42]], // la découpe, braise du soir
    [1200, [226, 130, 52]],
    [1260, [216, 112, 40]], // soir ambré
    [1395, [27, 44, 85]],
    [1440, [18, 26, 54]]
  ];
  function lightAt(m) {
    let i = 0;
    while (i < LIGHT.length - 2 && m > LIGHT[i + 1][0]) i++;
    const [m0, c0] = LIGHT[i], [m1, c1] = LIGHT[i + 1];
    const t = ss(m0, m1, m);
    return c0.map((v, k) => Math.round(lerp(v, c1[k], t)));
  }
  let lastMin = -1, lastLight = '';
  function setClock(m) {
    const mm = Math.floor(m);
    if (mm !== lastMin) {
      lastMin = mm;
      const h = Math.floor(mm / 60) % 24, n = mm % 60;
      const s = String(h).padStart(2, '0') + String(n).padStart(2, '0');
      for (let k = 0; k < 4; k++) if (digits[k].textContent !== s[k]) digits[k].textContent = s[k];
      dot.style.setProperty('--day', ((clamp((m - 240) / 1200, 0, 1)) * (dayW - 7)).toFixed(1) + 'px');
    }
    const c = lightAt(m).join(', ');
    if (c !== lastLight) { lastLight = c; root.style.setProperty('--light', c); }
  }

  /* ---------- Coupes franches ---------- */
  const cutFrames = pCut.kbs.map(kb => ({ kb, g: +kb.dataset.g, hold: parseFloat(kb.dataset.hold || 1) }));
  const frames = reduce
    ? cutFrames.filter((f, i) => i === cutFrames.length - 1 || cutFrames[i + 1].g !== f.g) // plans fixes : une image par temps fort
    : cutFrames;
  const holdSum = frames.reduce((a, f) => a + f.hold, 0);
  const cutSubs = pCut.subs;
  const flash = document.getElementById('flash');
  let curFrame = -1, cutAt = -1e9, curG = -1, frameLocal = 0, cutOp = -1;
  function pickFrame(local) {
    const inner = clamp((local - 0.07) / 0.86, 0, 0.9999) * holdSum;
    let acc = 0;
    for (let i = 0; i < frames.length; i++) {
      if (inner < acc + frames[i].hold) { frameLocal = (inner - acc) / frames[i].hold; return i; }
      acc += frames[i].hold;
    }
    frameLocal = 1;
    return frames.length - 1;
  }
  function setFrame(i, now) {
    if (i === curFrame) return;
    if (curFrame >= 0) frames[curFrame].kb.classList.remove('is-cur');
    frames[i].kb.classList.add('is-cur');
    if (curFrame >= 0 && pCut.op > .5) cutAt = now;
    curFrame = i;
    const g = frames[i].g;
    if (g !== curG) { curG = g; cutSubs.forEach(s => s.classList.toggle('is-cur', +s.dataset.g === g)); }
    cutOp = -1;
  }

  /* ---------- Canvas : fumée de cheminée, braises, balayage de fumée ---------- */
  function makeSprite(tint, n, a) {
    const s = 128, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    for (let i = 0; i < n; i++) {
      const x = s / 2 + rand(-18, 18), y = s / 2 + rand(-18, 18), r = rand(26, 44);
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(${tint},${a})`);
      grd.addColorStop(.5, `rgba(${tint},${a * .45})`);
      grd.addColorStop(1, `rgba(${tint},0)`);
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    }
    return c;
  }
  const small = window.innerWidth < 760;
  const fx = {
    c: document.getElementById('fx'),
    plume: [], embers: [], sweep: [],
    sweepK: 0,
    init() {
      this.ctx = this.c.getContext('2d');
      this.spPlume = [makeSprite('214,220,232', 14, .1), makeSprite('190,198,214', 14, .1)];
      this.spSweep = [makeSprite('226,218,206', 16, .09), makeSprite('200,196,190', 16, .09)];
      const n = small ? 14 : 26;
      for (let i = 0; i < n; i++) this.sweep.push(this.spawnSweep(true));
    },
    resize() {
      if (!this.ctx) return;
      this.dpr = small ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
      this.w = this.c.clientWidth; this.h = this.c.clientHeight;
      this.c.width = Math.round(this.w * this.dpr); this.c.height = Math.round(this.h * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    },
    spawnSweep(initial) {
      const r = rand(.35, .7) * Math.max(this.w || W, 400);
      return {
        x: rand(-.2, 1.2) * (this.w || W), y: initial ? rand(0, 1.2) * (this.h || H) : (this.h || H) + r * .6,
        r, vx: rand(.2, .9), vy: -rand(.4, 1.3), rot: rand(0, 6.28), vr: rand(-.002, .002), s: Math.random() < .5 ? 0 : 1
      };
    },
    step(t, s) {
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);

      // fumée de la cheminée, la nuit
      if (s.chimney) {
        const k = s.chimney.k;
        const n = small ? .35 : .7;
        if (Math.random() < n) this.plume.push({
          x: s.chimney.x + rand(-3, 3) * k, y: s.chimney.y,
          r: rand(10, 18) * k, vx: rand(.05, .35) * k, vy: -rand(.9, 1.5) * k,
          life: 0, ttl: rand(260, 420), s: Math.random() < .5 ? 0 : 1, rot: rand(0, 6.28), g: rand(.22, .36) * k
        });
      }
      const wind = Math.sin(t * .00021) * .12;
      for (let i = this.plume.length - 1; i >= 0; i--) {
        const q = this.plume[i];
        q.life++;
        if (q.life > q.ttl) { this.plume.splice(i, 1); continue; }
        q.vy *= .996; q.vx += (wind + .03) * .02;
        q.x += q.vx; q.y += q.vy; q.r += q.g; q.rot += .002;
        const f = q.life / q.ttl;
        ctx.globalAlpha = Math.min(1, f * 3) * Math.pow(1 - f, 1.4) * .55 * s.plumeA;
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot);
        ctx.drawImage(this.spPlume[q.s], -q.r, -q.r, q.r * 2, q.r * 2);
        ctx.restore();
      }

      // balayage de fumée aux changements de plan, vapeur pendant la découpe
      this.sweepK += (s.sweep - this.sweepK) * .25;
      if (this.sweepK > .015) {
        for (let i = 0; i < this.sweep.length; i++) {
          const q = this.sweep[i];
          q.x += q.vx + s.vel * .0; q.y += q.vy - s.vel * .25; q.rot += q.vr;
          if (q.y < -q.r || q.x > w + q.r) { this.sweep[i] = this.spawnSweep(false); continue; }
          ctx.globalAlpha = clamp(this.sweepK, 0, 1) * .3;
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot);
          ctx.drawImage(this.spSweep[q.s], -q.r, -q.r, q.r * 2, q.r * 2);
          ctx.restore();
        }
      }

      // braises
      for (const em of s.emit) {
        if (Math.random() < em.rate) {
          const n = 1 + (Math.random() * 2 | 0);
          for (let j = 0; j < n; j++) this.embers.push({
            x: em.x + rand(-em.spread, em.spread), y: em.y + rand(-6, 6),
            vx: rand(-.5, .5), vy: -rand(.8, 2.6), r: rand(.6, 2), life: 0, ttl: rand(90, 220), ph: rand(0, 6.28)
          });
        }
      }
      if (this.embers.length > 180) this.embers.splice(0, this.embers.length - 180);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = this.embers.length - 1; i >= 0; i--) {
        const e = this.embers[i];
        e.life++;
        if (e.life > e.ttl) { this.embers.splice(i, 1); continue; }
        e.vx += Math.sin(t * .003 + e.ph) * .035;
        e.x += e.vx; e.y += e.vy - s.vel * .15;
        const k = 1 - e.life / e.ttl;
        ctx.globalAlpha = k * (.6 + .4 * Math.sin(e.life * .45 + e.ph));
        ctx.fillStyle = k > .55 ? '#FFD08A' : '#F0672A';
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (.6 + k * .7), 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  };

  /* ---------- Lueur du foyer qui vacille ---------- */
  const glow = document.getElementById('glow');
  let flick = .8;

  /* ---------- Boucle ---------- */
  const nav = document.getElementById('nav');
  const brandOf = u => ss(.35, .7, u);
  const anchors = {};
  stage.querySelectorAll('.anchor').forEach(a => { anchors[a.dataset.anchor] = a; });
  function anchorPos(name) {
    const r = anchors[name].getBoundingClientRect(), s = stage.getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top };
  }

  let scrollY = window.scrollY, lastScroll = scrollY, vel = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  function render(now) {
    const vh = lastH || window.innerHeight;
    const u = clamp((scrollY - film.offsetTop) / vh, 0, T);
    const filmOn = scrollY < film.offsetTop + film.offsetHeight;
    vel = clamp(vel * .88 + (scrollY - lastScroll) * .05, -8, 8);
    lastScroll = scrollY;

    let minute = P[0].t, sweep = 0;
    for (const p of P) {
      const local = (u - p.s) / p.w;
      p.local = local;
      const f = FADE / p.w;
      const inn = p.i === 0 ? 1 : ss(0, f, local);
      const out = p.i === P.length - 1 ? 1 : 1 - ss(1 - f, 1, local);
      const op = local < -0.01 || local > 1.01 ? 0 : inn * out;
      if (op !== p.op || p.op === undefined) {
        p.op = op;
        p.el.style.opacity = op.toFixed(3);
        if (p.sub) p.sub.style.opacity = op.toFixed(3);
        p.el.classList.toggle('is-on', op > 0.001);
      }
      if (local >= 0 && local < 1) minute = lerp(p.t, p.tEnd, local);
      // balayage court, seulement au passage d'un plan à l'autre, jamais autour de la découpe
      if (p.i > 0 && p !== pCut && P[p.i - 1] !== pCut) sweep = Math.max(sweep, 1 - ss(0, .1, Math.abs(u - p.s)));

      if (op > 0.001 && p !== pCut && !reduce) {
        // lent zoom piloté par le scroll, plus une respiration à peine visible
        const lk = clamp(local, 0, 1);
        const sc = 1.03 + lk * .13 + Math.sin(now * .00025 + p.i) * .006;
        const dx = (lk - .5) * -1.4;
        if (p.kbs[0]) p.kbs[0].style.transform = `translate3d(${dx.toFixed(2)}%, 0, 0) scale(${sc.toFixed(4)})`;
        if (p.sub) p.sub.style.setProperty('--sy', ((1 - ss(0, f * 1.4, local)) * 24 - ss(1 - f, 1, local) * 18).toFixed(1) + 'px');
      }
    }
    if (u >= T) minute = P[P.length - 1].tEnd;
    setClock(minute);
    clock.classList.toggle('is-off', !filmOn || u > T - .5);
    root.style.setProperty('--brand', brandOf(u).toFixed(3));
    nav.classList.toggle('is-solid', scrollY > film.offsetTop + film.offsetHeight - vh * .5);

    // ouverture : le nom s'efface quand la journée démarre
    const hl = clamp(pNuit.local, 0, 1);
    hero.style.opacity = (pNuit.op * (1 - ss(.08, .5, hl))).toFixed(3);
    hero.style.visibility = pNuit.op > .001 && hl < .55 ? 'visible' : 'hidden';
    hero.style.transform = `translate3d(0, ${(-hl * 90).toFixed(1)}px, 0)`;

    // la découpe
    if (pCut.op > 0.001) {
      const i = pickFrame(pCut.local);
      setFrame(i, now);
      const kb = frames[i].kb;
      if (!reduce) {
        const age = now - cutAt;
        const shake = 9 * Math.exp(-age / 95);
        const sx = shake > .3 ? rand(-shake, shake) : 0, sy = shake > .3 ? rand(-shake, shake) : 0;
        const sc = 1.02 + frameLocal * .07 + Math.exp(-age / 160) * .035;
        kb.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) scale(${sc.toFixed(4)})`;
        flash.style.opacity = (.5 * Math.exp(-age / 110)).toFixed(3);
      }
    } else if (curFrame < 0) {
      setFrame(0, now);
    }

    if (cutOp !== pCut.op) { cutOp = pCut.op; cutSubs.forEach(sb => { sb.style.opacity = sb.classList.contains('is-cur') ? cutOp.toFixed(3) : '0'; }); }

    if (!reduce) {
      // le foyer vacille : bruit doux, jamais régulier
      flick += (rand(.62, 1.05) - flick) * .12;
      if (pNuit.op > 0.001) {
        glow.style.setProperty('--go', flick.toFixed(3));
        glow.style.setProperty('--gs', (.92 + flick * .14).toFixed(3));
      }
      const emit = [];
      let chimney = null;
      if (pNuit.op > 0.01) {
        const c = anchorPos('chimney'), fb = anchorPos('firebox');
        chimney = { x: c.x, y: c.y, k: clamp(pNuit.kbs[0]._iw / 2000, .45, 1.6) };
        emit.push({ x: fb.x, y: fb.y, rate: .22 * pNuit.op, spread: 14 });
      }
      if (pFeu.op > 0.01) {
        const c = anchorPos('coals');
        emit.push({ x: c.x, y: c.y, rate: .9 * pFeu.op, spread: W * .22 });
      }
      if (pCut.op > 0.01 && curG === 1) emit.push({ x: W * .5, y: H * .62, rate: .25, spread: W * .15 });
      fx.step(now, { chimney, plumeA: pNuit.op, emit, sweep: filmOn ? sweep : 0, vel });
    }
    requestAnimationFrame(render);
  }

  /* ---------- Préchargement : le premier plan d'abord, le reste ensuite ---------- */
  function preload() {
    stage.querySelectorAll('img').forEach(img => { if (img.decode) img.decode().catch(() => {}); });
  }

  // le lien d'ouverture amène au plan du feu
  hero.querySelector('.hero__hint').addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: film.offsetTop + (pFeu.s + pFeu.w * .5) * (lastH || innerHeight), behavior: reduce ? 'auto' : 'smooth' });
  });

  if (!reduce) fx.init();
  layout();
  window.addEventListener('resize', layout);
  if (document.readyState === 'complete') preload(); else window.addEventListener('load', preload);
  requestAnimationFrame(render);

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
      'Bonjour Mika, je voudrais un devis.',
      '',
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
})();
