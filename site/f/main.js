(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = window.innerWidth < 760;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const body = document.body;

  /* ---------- Grain : une tuile de bruit générée une fois ---------- */
  (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 180;
    const g = c.getContext('2d');
    const d = g.createImageData(180, 180);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255 | 0;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    document.documentElement.style.setProperty('--noise', `url(${c.toDataURL('image/png')})`);
  })();

  /* ---------- Texte découpé en lettres (cartons) ---------- */
  function splitChars(el) {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const chars = [];
    text.split(' ').forEach((word, wi, arr) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      for (const ch of word) {
        const s = document.createElement('span');
        s.className = 'c';
        s.textContent = ch;
        w.appendChild(s);
        chars.push(s);
      }
      el.appendChild(w);
      if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return chars;
  }

  const reel = document.getElementById('reel');
  const frame = document.getElementById('frame');
  const flashEl = document.getElementById('flash');
  const segs = [...reel.querySelectorAll('.seg')].map(el => ({
    el,
    dur: parseFloat(el.dataset.dur) || 50,
    img: el.querySelector('img'),
    chars: el.querySelector('.card__text') ? splitChars(el.querySelector('.card__text')) : null,
    sub: el.querySelector('.sub'),
    cut: el.dataset.cut || '',
    punch: el.classList.contains('seg--punch'),
    embers: parseFloat(el.dataset.embers || '0.1'),
    smoke: parseFloat(el.dataset.smoke || '0.15'),
    chapter: el.dataset.chapter || null,
    shown: -1
  }));

  /* ---------- Ouverture, pilotée par le temps ---------- */
  const slug = document.getElementById('intro-slug');
  const slugChars = splitChars(slug);
  if (reduce) {
    body.classList.add('t-light', 't-title');
  } else {
    setTimeout(() => body.classList.add('t-light'), 450);
    setTimeout(() => {
      slugChars.forEach((c, i) => setTimeout(() => c.classList.add('on'), i * 55));
    }, 1500);
    setTimeout(() => body.classList.add('t-title'), 1500 + slugChars.length * 55 + 1500);
  }

  /* ---------- Géométrie de la bobine ---------- */
  let vh = window.innerHeight, reelTop = 0, starts = [], totalPx = 0;
  function layout() {
    vh = window.innerHeight;
    if (!reduce) {
      let acc = 0;
      starts = segs.map(s => { const a = acc; acc += s.dur * vh / 100; return a; });
      totalPx = acc;
      reel.style.height = `${Math.round(totalPx + vh)}px`;
    }
    reelTop = reel.getBoundingClientRect().top + window.scrollY;
    buildMarks();
  }

  /* ---------- Montage ---------- */
  let cur = -1;
  function cutTo(i) {
    if (cur >= 0) segs[cur].el.classList.remove('is-on');
    segs[i].el.classList.add('is-on');
    const s = segs[i];
    // un cut en avançant, pas en revenant en arrière
    if (i > cur && cur >= 0) {
      if (s.cut === 'flash') {
        flashEl.className = 'flash'; void flashEl.offsetWidth; flashEl.className = 'flash is-cut';
        frame.classList.remove('is-shake'); void frame.offsetWidth; frame.classList.add('is-shake');
      } else if (s.cut === 'soft') {
        flashEl.className = 'flash'; void flashEl.offsetWidth; flashEl.className = 'flash is-soft';
      }
    }
    cur = i;
  }

  function renderReel() {
    const y = window.scrollY - reelTop;
    let i = 0;
    while (i < segs.length - 1 && y >= starts[i + 1]) i++;
    if (i !== cur) cutTo(i);
    const s = segs[i];
    const len = s.dur * vh / 100;
    const k = clamp((y - starts[i]) / len, 0, 1);

    if (s.img && i > 0) {
      const z = s.punch ? 1.05 + k * 0.09 : 1 + k * 0.07;
      s.img.style.setProperty('--z', z.toFixed(4));
    }
    if (s.chars) {
      // lettre par lettre sur la première moitié du plan
      const n = Math.ceil(clamp(k / 0.5, 0, 1) * s.chars.length);
      if (n !== s.shown) {
        s.chars.forEach((c, j) => c.classList.toggle('on', j < n));
        s.shown = n;
      }
    }
    if (s.sub) s.sub.classList.toggle('on', k > 0.08 && k < 0.94);
    fx.targetEmbers = s.embers;
    fx.targetSmoke = s.smoke;
    // si on fait défiler pendant l'ouverture, on donne le titre tout de suite
    if (y > 40 && !body.classList.contains('t-title')) {
      body.classList.add('t-light', 't-title');
      slugChars.forEach(c => c.classList.add('on'));
    }
  }

  /* ---------- Lecteur : barre de lecture et chapitres ---------- */
  const credits = document.getElementById('seance');
  const played = document.getElementById('player-played');
  const head = document.getElementById('player-head');
  const marksEl = document.getElementById('player-marks');
  const chapterEl = document.getElementById('player-chapter');
  const timeEl = document.getElementById('player-time');
  const RUNTIME = 150; // durée affichée de la bande-annonce, en secondes
  let chapters = [];

  function segTop(i) {
    return reduce ? segs[i].el.getBoundingClientRect().top + window.scrollY - vh * 0.1 : reelTop + starts[i] + 2;
  }
  function buildMarks() {
    chapters = [];
    segs.forEach((s, i) => { if (s.chapter) chapters.push({ name: s.chapter, top: segTop(i) }); });
    chapters.push({ name: credits.dataset.chapter, top: credits.getBoundingClientRect().top + window.scrollY - (small ? 52 : 60) });
    const max = docMax();
    marksEl.innerHTML = '';
    chapters.forEach((c, n) => {
      const li = document.createElement('li');
      li.style.left = `${(clamp(c.top / max, 0, 1) * 100).toFixed(2)}%`;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'player__mark';
      b.setAttribute('aria-label', `Aller au chapitre : ${c.name}`);
      b.innerHTML = `<span>${c.name}</span>`;
      b.addEventListener('click', () => window.scrollTo({ top: c.top, behavior: reduce ? 'auto' : 'smooth' }));
      li.appendChild(b);
      marksEl.appendChild(li);
      c.btn = b;
      // évite que deux noms se chevauchent : on n'affiche que le premier et ceux assez espacés
      c.idx = n;
    });
    let lastShown = -1;
    chapters.forEach(c => {
      const pos = c.top / max;
      const span = c.btn.querySelector('span');
      if (lastShown >= 0 && pos - lastShown < 0.09) span.style.visibility = 'hidden';
      else lastShown = pos;
    });
  }
  function docMax() { return Math.max(1, document.documentElement.scrollHeight - vh); }
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  let lastChapter = '';
  function renderPlayer() {
    const y = window.scrollY;
    const p = clamp(y / docMax(), 0, 1);
    played.style.transform = `scaleX(${p.toFixed(4)})`;
    head.style.left = `${(p * 100).toFixed(2)}%`;
    timeEl.textContent = `${fmt(p * RUNTIME)} / ${fmt(RUNTIME)}`;
    let now = 0;
    chapters.forEach((c, n) => { if (y + 4 >= c.top) now = n; });
    chapters.forEach((c, n) => {
      c.btn.classList.toggle('is-now', n === now);
      c.btn.classList.toggle('is-past', n < now);
    });
    const name = chapters[now] ? chapters[now].name : '';
    if (name !== lastChapter) { chapterEl.textContent = name; lastChapter = name; }
    // la lumière revient au générique
    body.classList.toggle('is-lit', credits.getBoundingClientRect().top < vh * 0.55);
  }

  /* ---------- Fumée et braises sur le cadre ---------- */
  const fx = { targetEmbers: 0.5, targetSmoke: 0.5, embers: 0.5, smoke: 0.5 };

  function makeSprite(tint) {
    const s = 200, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    for (let i = 0; i < 14; i++) {
      const x = s / 2 + rand(-30, 30), y = s / 2 + rand(-30, 30), r = rand(40, 70);
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(${tint},0.09)`);
      grd.addColorStop(0.5, `rgba(${tint},0.04)`);
      grd.addColorStop(1, `rgba(${tint},0)`);
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    return c;
  }

  function startFx() {
    const canvas = document.getElementById('fx');
    const ctx = canvas.getContext('2d');
    const sprites = [makeSprite('230,220,205'), makeSprite('255,190,140')];
    let w = 0, h = 0;
    const SCALE = 0.75;
    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * SCALE));
      canvas.height = Math.max(1, Math.round(h * SCALE));
      ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    const puffs = [];
    const spawnPuff = initial => {
      const r = rand(120, 320) * (small ? 0.7 : 1);
      return {
        x: rand(-0.1, 1.1) * w, y: initial ? rand(0, h + r) : h + r * rand(0.2, 0.7), r,
        vx: rand(-0.1, 0.3), vy: -rand(0.2, 0.6),
        rot: rand(0, 6.28), vr: rand(-0.002, 0.002),
        life: initial ? rand(0, 1) : 0, ttl: rand(700, 1300),
        s: Math.random() < 0.2 ? 1 : 0, grow: rand(1.0004, 1.001)
      };
    };
    const NP = small ? 12 : 24;
    for (let i = 0; i < NP; i++) puffs.push(spawnPuff(true));
    const sparks = [];
    const MAXS = small ? 50 : 120;

    let running = true;
    new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(reel);

    const frameFn = t => {
      requestAnimationFrame(frameFn);
      if (!running) return;
      fx.embers += (fx.targetEmbers - fx.embers) * 0.05;
      fx.smoke += (fx.targetSmoke - fx.smoke) * 0.04;
      ctx.clearRect(0, 0, w, h);

      const wind = Math.sin(t * 0.0002) * 0.15;
      for (let i = 0; i < puffs.length; i++) {
        const q = puffs[i];
        q.life += 1 / q.ttl;
        if (q.life >= 1 || q.y < -q.r) { puffs[i] = spawnPuff(false); continue; }
        q.vx = q.vx * 0.99 + (wind + 0.05) * 0.01;
        q.x += q.vx; q.y += q.vy; q.r *= q.grow; q.rot += q.vr;
        ctx.globalAlpha = clamp(Math.sin(q.life * Math.PI) * fx.smoke, 0, 1);
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot);
        ctx.drawImage(sprites[q.s], -q.r, -q.r, q.r * 2, q.r * 2);
        ctx.restore();
      }

      if (sparks.length < MAXS && Math.random() < fx.embers * 0.9) {
        const n = 1 + (Math.random() * 2 | 0);
        for (let i = 0; i < n; i++) sparks.push({
          x: rand(0.1, 0.9) * w, y: h * rand(0.75, 1.02),
          vx: rand(-0.5, 0.5), vy: -rand(0.8, 2.6), r: rand(0.7, 2.2),
          life: 0, ttl: rand(110, 240), ph: rand(0, 6.28)
        });
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const e = sparks[i];
        e.life++;
        if (e.life > e.ttl) { sparks.splice(i, 1); continue; }
        e.vx += Math.sin(t * 0.003 + e.ph) * 0.04;
        e.x += e.vx; e.y += e.vy;
        const k = 1 - e.life / e.ttl;
        ctx.globalAlpha = k * (0.6 + 0.4 * Math.sin(e.life * 0.45 + e.ph));
        ctx.fillStyle = k > 0.5 ? '#ffc77e' : '#e5652a';
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.6 + k * 0.6), 0, 6.28); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    };
    requestAnimationFrame(frameFn);
  }

  /* ---------- Démarrage ---------- */
  layout();
  if (!reduce) {
    segs[0].el.classList.add('is-on'); cur = 0;
    startFx();
    // précharge des images de la bobine pour des coupes sans trou
    segs.forEach(s => { if (s.img) { const im = new Image(); im.src = s.img.currentSrc || s.img.src; } });
  }
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (!reduce) renderReel();
      renderPlayer();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { layout(); onScroll(); });
  window.addEventListener('load', () => { layout(); onScroll(); });
  if (!reduce) renderReel();
  renderPlayer();

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
      `Budget par personne : ${d.get('budget') || 'à définir'}`,
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
