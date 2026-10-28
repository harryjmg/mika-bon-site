(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- Navigation : fond au scroll ---------- */
  const nav = document.getElementById('nav');
  const onNav = () => nav.classList.toggle('is-solid', window.scrollY > 40);
  onNav();
  window.addEventListener('scroll', onNav, { passive: true });

  /* ---------- Vitesse de scroll partagée ---------- */
  let lastY = window.scrollY, scrollVel = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    scrollVel = clamp(scrollVel + (y - lastY) * 0.06, -6, 6);
    lastY = y;
  }, { passive: true });

  /* ---------- Sprite de fumée : plusieurs bouffées superposées ---------- */
  function makeSprite(tint) {
    const s = 256, c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    for (let i = 0; i < 16; i++) {
      const x = s / 2 + rand(-40, 40), y = s / 2 + rand(-40, 40), r = rand(50, 88);
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(${tint},0.085)`);
      grd.addColorStop(0.45, `rgba(${tint},0.04)`);
      grd.addColorStop(1, `rgba(${tint},0)`);
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    return c;
  }

  /* ---------- Fumée en canvas ---------- */
  class Smoke {
    constructor(canvas, opts) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = Object.assign({ count: 60, tint: '226,212,196', warm: '255,170,110', rise: 0.35, size: [140, 380], origin: 'bottom', alpha: 1, mouse: false }, opts);
      this.sprites = [makeSprite(this.o.tint), makeSprite(this.o.tint), makeSprite(this.o.warm)];
      this.p = [];
      this.density = 1;
      this.mx = -9999; this.my = -9999;
      this.visible = false;
      this.resize();
      for (let i = 0; i < this.o.count; i++) this.p.push(this.spawn(true));
      window.addEventListener('resize', () => this.resize());
      if (this.o.mouse) {
        const host = canvas.parentElement;
        host.addEventListener('pointermove', e => {
          const r = canvas.getBoundingClientRect();
          this.mx = e.clientX - r.left; this.my = e.clientY - r.top;
        });
        host.addEventListener('pointerleave', () => { this.mx = this.my = -9999; });
      }
      new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; }, { rootMargin: '100px' }).observe(canvas);
    }
    resize() {
      // la fumée est floue par nature : pas besoin de la haute densité
      this.w = this.c.clientWidth; this.h = this.c.clientHeight;
      this.c.width = Math.max(1, Math.round(this.w * 0.75));
      this.c.height = Math.max(1, Math.round(this.h * 0.75));
      this.ctx.setTransform(0.75, 0, 0, 0.75, 0, 0);
    }
    spawn(initial) {
      const [a, b] = this.o.size;
      const k = Math.min(1, this.w / 1200) * 0.6 + 0.4;
      const r = rand(a, b) * k;
      let x, y;
      if (this.o.origin === 'band') {
        x = rand(this.w * 0.2, this.w * 0.8);
        y = initial ? rand(this.h * 0.2, this.h * 0.9) : this.h * rand(0.55, 0.85);
      } else {
        x = rand(-0.1, 1.1) * this.w;
        y = initial ? rand(0, this.h + r) : this.h + r * rand(0.2, 0.8);
      }
      return {
        x, y, r,
        vx: rand(-0.15, 0.25), vy: -rand(0.25, 0.75) * this.o.rise,
        rot: rand(0, 6.28), vr: rand(-0.0015, 0.0015),
        life: initial ? rand(0, 1) : 0, ttl: rand(900, 1700),
        s: Math.random() < 0.18 ? 2 : (Math.random() < 0.5 ? 0 : 1),
        grow: rand(1.0004, 1.0012)
      };
    }
    step(t) {
      if (!this.visible) return;
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);
      const wind = Math.sin(t * 0.00017) * 0.18;
      const sv = scrollVel;
      for (let i = 0; i < this.p.length; i++) {
        const q = this.p[i];
        q.life += 1 / q.ttl;
        if (q.life >= 1 || q.y < -q.r * 1.2) { this.p[i] = this.spawn(false); continue; }
        // la souris écarte doucement la fumée
        if (this.mx > -9000) {
          const dx = q.x - this.mx, dy = q.y - this.my, d2 = dx * dx + dy * dy, R = 220;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 0.55;
            q.vx += (dx / d) * f; q.vy += (dy / d) * f * 0.6;
          }
        }
        q.vx = q.vx * 0.985 + (wind + 0.06) * 0.015;
        q.vy = q.vy * 0.985 + (-0.5 * this.o.rise) * 0.015;
        q.x += q.vx;
        q.y += q.vy - sv * 0.35;
        q.r *= q.grow;
        q.rot += q.vr;
        const fade = Math.sin(q.life * Math.PI);
        ctx.globalAlpha = clamp(fade * this.o.alpha * this.density, 0, 1);
        ctx.save();
        ctx.translate(q.x, q.y); ctx.rotate(q.rot);
        ctx.drawImage(this.sprites[q.s], -q.r, -q.r, q.r * 2, q.r * 2);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- Braises qui montent ---------- */
  class Embers {
    constructor(canvas) {
      this.c = canvas; this.ctx = canvas.getContext('2d');
      this.p = []; this.rate = 0; this.visible = false;
      this.resize();
      window.addEventListener('resize', () => this.resize());
      new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; }).observe(canvas);
    }
    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.w = this.c.clientWidth; this.h = this.c.clientHeight;
      this.c.width = this.w * dpr; this.c.height = this.h * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    step(t) {
      if (!this.visible) return;
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);
      if (Math.random() < this.rate) {
        const n = 1 + (Math.random() * 3 | 0);
        for (let i = 0; i < n; i++) this.p.push({
          x: w * 0.5 + rand(-w * 0.28, w * 0.28), y: h * rand(0.6, 0.85),
          vx: rand(-0.4, 0.4), vy: -rand(0.6, 2.2), r: rand(0.6, 2.2),
          life: 0, ttl: rand(120, 260), ph: rand(0, 6.28)
        });
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = this.p.length - 1; i >= 0; i--) {
        const e = this.p[i];
        e.life++;
        if (e.life > e.ttl) { this.p.splice(i, 1); continue; }
        e.vx += Math.sin(t * 0.003 + e.ph) * 0.03;
        e.x += e.vx; e.y += e.vy - scrollVel * 0.2;
        const k = 1 - e.life / e.ttl;
        const flick = 0.6 + 0.4 * Math.sin(e.life * 0.4 + e.ph);
        ctx.globalAlpha = k * flick;
        ctx.fillStyle = k > 0.5 ? '#FFC37A' : '#E8682C';
        ctx.shadowColor = '#FF7A2E'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (0.6 + k * 0.6), 0, 6.28); ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
  }

  /* ---------- Le déchirement piloté par le scroll ---------- */
  const tear = document.getElementById('dechire');
  const stage = document.getElementById('tear-stage');
  const img2 = tear.querySelector('.tear__img--2');
  const img3 = tear.querySelector('.tear__img--3');
  const words = [...tear.querySelectorAll('.tear__w')];
  const bar = document.getElementById('tear-bar');
  const windows = [[0.0, 0.32], [0.34, 0.64], [0.66, 1.2]];
  let tearP = 0;
  // sur grand écran, la pièce descend un peu pour laisser le haut aux mots
  let stageY = 0, stageS = 1;
  const sizeStage = () => {
    const wide = window.innerWidth > 700;
    stageY = wide ? window.innerHeight * 0.12 : 0;
    stageS = wide ? 1.0 : 1.0;
  };
  sizeStage();
  window.addEventListener('resize', sizeStage);

  function updateTear() {
    const r = tear.getBoundingClientRect();
    const run = r.height - window.innerHeight;
    const p = clamp(-r.top / run, 0, 1);
    tearP = p;
    img2.style.opacity = ss(0.2, 0.44, p).toFixed(3);
    img3.style.opacity = ss(0.54, 0.78, p).toFixed(3);
    stage.style.transform = `translate3d(0, ${(stageY * (1 - p * 0.3)).toFixed(1)}px, 0) scale(${(stageS + p * 0.08).toFixed(4)})`;
    words.forEach((el, i) => {
      const [a, b] = windows[i];
      const inn = ss(a + 0.01, a + 0.1, p);
      const out = 1 - ss(b - 0.07, b, p);
      const y = (1 - inn) * -70 + (1 - out) * 50;
      el.style.opacity = (inn * out).toFixed(3);
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    });
    bar.style.transform = `scaleX(${p.toFixed(3)})`;
  }

  /* ---------- Démarrage ---------- */
  const loops = [];
  if (!reduce) {
    loops.push(new Smoke(document.getElementById('smoke-hero'), { count: window.innerWidth < 700 ? 16 : 30, mouse: true, alpha: 0.38, size: [180, 420] }));
    const tearSmoke = new Smoke(document.getElementById('smoke-tear'), { count: 26, size: [160, 420], rise: 0.5, origin: 'band', tint: '235,225,214', alpha: 0.42 });
    loops.push(tearSmoke);
    loops.push(new Smoke(document.getElementById('smoke-quote'), { count: 18, size: [200, 460], rise: 0.25, alpha: 0.45 }));
    const embers = new Embers(document.getElementById('embers'));
    loops.push(embers);

    window.addEventListener('scroll', updateTear, { passive: true });
    window.addEventListener('resize', updateTear);
    updateTear();

    const frame = t => {
      // la vapeur et les braises montent quand la viande s'ouvre
      tearSmoke.density = 0.5 + Math.sin(Math.PI * ss(0.1, 0.95, tearP)) * 0.6;
      embers.rate = 0.08 + Math.sin(Math.PI * clamp(tearP, 0, 1)) * 0.55;
      for (const l of loops) l.step(t);
      scrollVel *= 0.9;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  } else {
    words.forEach(el => { el.style.opacity = 1; });
  }

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
