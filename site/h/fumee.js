/* MC Cuisine : fumée qui monte du bas du hero, à la jonction avec le temps I.
   Canvas procédural : des volutes floues (une texture dessinée une fois) qui naissent en bas,
   montent lentement, dérivent, grossissent et se dissipent.
   Léger : rendu en demi-résolution (la fumée est floue, l'agrandissement ne se voit pas), 30 images
   par seconde au plus, pause quand le bas du hero sort de l'écran ou que l'onglet est caché.
   Rien du tout avec prefers-reduced-motion. Lancé après le chargement de la page. */
(() => {
  const canvas = document.querySelector('.hero__smoke');
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { canvas.remove(); return; }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const SCALE = 0.5; // demi-résolution
  let W = 0, H = 0, parts = [], running = false, visible = false, raf = 0, last = 0, acc = 0;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* Texture d'une volute : plusieurs bouffées décalées, floutées, pour un bord irrégulier */
  /* Texture d'une volute : une traînée qui monte en s'enroulant (une suite de bouffées le long d'une
     courbe), sur un halo très doux. Le flou reste faible pour garder le dessin des bords. */
  const makePuff = (size) => {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const blob = (x, y, r, a) => {
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(232,226,218,${a})`);
      grd.addColorStop(.55, `rgba(218,211,203,${a * .4})`);
      grd.addColorStop(1, 'rgba(218,211,203,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    };
    blob(size / 2, size * .6, size * .36, .07); // halo
    if ('filter' in g) g.filter = `blur(${Math.max(1, Math.round(size / 48))}px)`;
    const strands = 2 + ((rnd() * 2) | 0);
    for (let k = 0; k < strands; k++) {
      const amp = size * (.06 + rnd() * .1), fq = 1.2 + rnd() * 1.6, ph = rnd() * 6.28, off = (rnd() - .5) * size * .2;
      for (let i = 0; i <= 34; i++) {
        const t = i / 34;
        const y = size * (.9 - t * .8);
        const x = size / 2 + off + Math.sin(ph + t * fq * 6.28) * amp * (.4 + t);
        const r = size * (.035 + t * .09) * (.8 + rnd() * .4);
        blob(x, y, r, .2 * (1 - t * .55));
      }
    }
    return c;
  };
  const sprites = [makePuff(200), makePuff(200), makePuff(200), makePuff(200)];

  const spawn = (p, fresh) => {
    p.x = rnd() * W;
    p.y = H * .82 - (fresh ? rnd() * H * .6 : 0); // naissance autour de la jonction (à 72 % du canvas)
    p.vy = -(7 + rnd() * 10);              // montée, en px par seconde (demi-résolution)
    p.vx = (rnd() - .35) * 5;              // dérive, un peu vers la droite
    p.sway = 6 + rnd() * 10; p.ph = rnd() * 6.28; p.fq = .15 + rnd() * .25;
    p.r0 = 34 + rnd() * 28; p.r1 = p.r0 * (1.8 + rnd() * .8);
    p.rot = (rnd() - .5) * .6; p.vr = (rnd() - .5) * .05; // volutes plutôt droites : elles montent
    p.life = 0; p.max = 12 + rnd() * 10;   // secondes
    if (fresh) p.life = rnd() * p.max * .7;
    p.s = sprites[(rnd() * sprites.length) | 0];
    p.a = .18 + rnd() * .2;
    p.sx = (rnd() < .5 ? -1 : 1) * (1 + rnd() * .5); // largeur variable, parfois en miroir
    return p;
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width * SCALE));
    H = Math.max(1, Math.round(r.height * SCALE));
    canvas.width = W; canvas.height = H;
    const n = Math.min(46, Math.max(10, Math.round(W / 22)));
    parts = Array.from({ length: n }, () => spawn({}, true));
  };

  const draw = (dt) => {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.life += dt;
      if (p.life >= p.max) { spawn(p, false); continue; }
      const t = p.life / p.max;
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      p.rot += p.vr * dt;
      const x = p.x + Math.sin(p.ph + p.life * p.fq * 6.28) * p.sway;
      const r = p.r0 + (p.r1 - p.r0) * t;
      const alpha = Math.sin(Math.PI * t) * p.a; // apparaît, puis se dissipe
      if (alpha <= 0.01) continue;
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(p.sx, 1);
      ctx.drawImage(p.s, -r, -r, r * 2, r * 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  const loop = (now) => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.1, (now - (last || now)) / 1000);
    last = now; acc += dt;
    if (acc < 1 / 30) return; // 30 images par seconde suffisent
    draw(acc); acc = 0;
  };
  const start = () => { if (running || !visible || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(loop); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  const init = () => {
    resize();
    draw(0);
    canvas.classList.add('is-on');
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => {
        visible = es[0].isIntersecting;
        visible ? start() : stop();
      }, { rootMargin: '80px 0px' }).observe(canvas);
    } else { visible = true; start(); }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
  };

  // Rien avant le hero : on attend la fin du chargement de la page
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init, { once: true });
})();
