(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const NS = 'http://www.w3.org/2000/svg';

  /* Barre qui devient opaque */
  const bar = document.querySelector('.bar');
  const onBar = () => bar.classList.toggle('is-solid', scrollY > 60);

  /* ---------- Fiche technique ---------- */
  const plan = document.querySelector('[data-spec]');
  const frame = plan.querySelector('.spec__frame');
  const svg = plan.querySelector('.spec__svg');
  const labels = [...plan.querySelectorAll('.spec__labels li')];
  let groups = [];

  function layoutSpec() {
    const wide = innerWidth > 1100;
    const fr = frame.getBoundingClientRect();
    const pr = plan.getBoundingClientRect();
    const W = fr.width, H = fr.height;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    groups = [];
    const gap = 28;
    const offL = fr.left - pr.left, offT = fr.top - pr.top;
    let lastBottom = { l: -Infinity, r: -Infinity };

    labels.forEach((li, i) => {
      const px = +li.dataset.x / 100 * W, py = +li.dataset.y / 100 * H;
      const side = li.dataset.side;
      const g = document.createElementNS(NS, 'g');
      if (li.classList.contains('on')) g.classList.add('on');

      if (wide) {
        const colW = side === 'l' ? offL - gap : pr.width - (offL + W) - gap;
        li.style.position = 'absolute';
        li.style.width = Math.max(150, colW - parseFloat(getComputedStyle(plan).paddingLeft)) + 'px';
        if (side === 'l') { li.style.left = ''; li.style.right = (pr.width - offL + gap) + 'px'; li.style.textAlign = 'right'; }
        else { li.style.right = ''; li.style.left = (offL + W + gap) + 'px'; li.style.textAlign = 'left'; }
        let top = offT + py - 12;
        top = Math.max(top, lastBottom[side] + 18);
        li.style.top = top + 'px';
        lastBottom[side] = top + li.offsetHeight;
        // Ligne : du titre du libellé au bord du cadre, puis coude jusqu'au point
        const ly = top - offT + 12;
        const ex = side === 'l' ? -gap + 6 : W + gap - 6;
        const kx = side === 'l' ? Math.min(px - 40, 40) : Math.max(px + 40, W - 40);
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', `M${ex} ${ly} H${side === 'l' ? Math.max(kx, 8) : Math.min(kx, W - 8)} L${px} ${py}`);
        path.setAttribute('class', 'ln');
        path.setAttribute('pathLength', '1');
        g.append(path);
      } else {
        li.removeAttribute('style');
      }
      const ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('cx', px); ring.setAttribute('cy', py); ring.setAttribute('r', wide ? 14 : 15);
      ring.setAttribute('class', 'ring');
      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.setAttribute('r', wide ? 9 : 11);
      dot.setAttribute('class', 'dot');
      const num = document.createElementNS(NS, 'text');
      num.setAttribute('x', px); num.setAttribute('y', py + .5);
      num.setAttribute('class', 'num');
      num.textContent = i + 1;
      g.append(ring, dot, num);
      svg.append(g);
      groups.push(g);
    });
    plan.style.minHeight = wide ? Math.max(H, ...labels.map(l => l.offsetTop + l.offsetHeight)) + 'px' : '';
    onSpec();
  }

  function onSpec() {
    const r = plan.getBoundingClientRect();
    // 0 quand le haut du plan arrive à 85 % de l'écran, 1 quand il atteint 25 %
    const p = reduce ? 1 : clamp((innerHeight * .85 - r.top) / (innerHeight * .6));
    labels.forEach((li, i) => {
      const on = p > (i + .5) / labels.length * .95;
      li.classList.toggle('on', on);
      groups[i] && groups[i].classList.toggle('on', on);
    });
  }

  /* ---------- Déchirement ---------- */
  const tear = document.querySelector('[data-tear]');
  const stage = tear.querySelector('.tear__stage');
  const imgs = [...tear.querySelectorAll('.tear__img')];
  const hours = tear.querySelector('[data-hours]');
  const needle = tear.querySelector('.tear__needle');
  const gauge = tear.querySelector('.tear__gauge');
  const steps = [...tear.querySelectorAll('[data-step]')];
  const canvas = tear.querySelector('.tear__smoke');
  let tearP = 0, tearVisible = false;

  // Les images du déchirement se chargent dès qu'on approche
  imgs.forEach(p => p.querySelector('img').loading = 'eager');

  function onTear() {
    const r = tear.getBoundingClientRect();
    tearVisible = r.top < innerHeight && r.bottom > 0;
    if (!tearVisible || reduce) return;
    const p = clamp(-r.top / (r.height - innerHeight));
    tearP = p;
    const a = clamp((p - .22) / .2), b = clamp((p - .6) / .2);
    imgs[1].style.opacity = a;
    imgs[2].style.opacity = b;
    stage.style.transform = `scale(${1 + p * .09}) translateY(${p * -1.5}%)`;
    const h = Math.round(clamp((p - .04) / .82) * 14);
    hours.textContent = String(h).padStart(2, '0');
    needle.style.transform = `translateY(${clamp((p - .04) / .82) * gauge.clientHeight}px)`;
    const s = p < .3 ? 0 : p < .64 ? 1 : 2;
    steps.forEach((el, i) => el.classList.toggle('on', i === s && p > .03));
  }

  // Fumée : particules douces dessinées sur un canvas, plus denses quand la viande s'ouvre
  const ctx = canvas.getContext('2d');
  let puffs = [], dpr = 1, cw = 0, ch = 0, sprite;
  function sizeCanvas() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    cw = canvas.clientWidth; ch = canvas.clientHeight;
    canvas.width = cw * dpr; canvas.height = ch * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 128;
    const s = sprite.getContext('2d');
    const g = s.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(225,222,215,.32)');
    g.addColorStop(.5, 'rgba(200,198,192,.10)');
    g.addColorStop(1, 'rgba(200,198,192,0)');
    s.fillStyle = g; s.fillRect(0, 0, 128, 128);
  }
  function spawn() {
    return {
      x: cw * (.2 + Math.random() * .6), y: ch * (.42 + Math.random() * .3),
      r: 60 + Math.random() * 120, vx: (Math.random() - .5) * .25, vy: -(.25 + Math.random() * .5),
      life: 0, max: 380 + Math.random() * 300, rot: Math.random() * 6
    };
  }
  function frameSmoke() {
    if (tearVisible) {
      const target = 18 + Math.round(tearP * 34);
      if (puffs.length < target && Math.random() < .35) puffs.push(spawn());
      ctx.clearRect(0, 0, cw, ch);
      puffs = puffs.filter(p => p.life < p.max);
      for (const p of puffs) {
        p.life++; p.x += p.vx + Math.sin((p.life + p.rot * 40) / 70) * .25; p.y += p.vy; p.r += .22;
        const t = p.life / p.max;
        ctx.globalAlpha = Math.sin(t * Math.PI) * (.3 + tearP * .3);
        ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frameSmoke);
  }

  /* ---------- Boucle ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onBar(); onSpec(); onTear(); ticking = false; });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { layoutSpec(); sizeCanvas(); onTear(); });
  const img = frame.querySelector('img');
  if (img.complete) layoutSpec(); else img.addEventListener('load', layoutSpec);
  document.fonts && document.fonts.ready.then(layoutSpec);
  layoutSpec(); onBar(); onTear();
  if (!reduce) { sizeCanvas(); requestAnimationFrame(frameSmoke); }

  /* ---------- Bon de commande ---------- */
  const form = document.querySelector('[data-form]');
  const err = form.querySelector('.slip__err');
  const names = { type: "type d'événement", date: 'date', invites: "nombre d'invités", lieu: 'lieu', nom: 'nom', tel: 'téléphone' };
  form.addEventListener('submit', e => {
    e.preventDefault();
    const via = e.submitter ? e.submitter.value : 'wa';
    const d = Object.fromEntries(new FormData(form));
    const missing = Object.keys(names).filter(k => !String(d[k] || '').trim());
    form.querySelectorAll('.f').forEach(f => f.classList.remove('bad'));
    if (missing.length) {
      missing.forEach(k => form.elements[k].closest('.f').classList.add('bad'));
      err.querySelector('[data-missing]').textContent = missing.map(k => names[k]).join(', ');
      err.hidden = false;
      form.elements[missing[0]].focus();
      return;
    }
    err.hidden = true;
    const date = d.date ? new Date(d.date + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const lines = [
      'Bonjour Mika, je voudrais un devis.',
      '',
      `Événement : ${d.type}`,
      `Date : ${date}`,
      `Lieu : ${d.lieu}`,
      `Invités : ${d.invites}`,
      d.budget ? `Budget par personne : ${d.budget}` : '',
      d.msg ? `Précisions : ${d.msg}` : '',
      '',
      `${d.nom}, ${d.tel}${d.email ? ', ' + d.email : ''}`
    ].filter((l, i, a) => l !== '' || (a[i - 1] !== '' && i > 0));
    const text = lines.join('\n');
    // À REMPLACER : numéro WhatsApp et adresse email réels
    const url = via === 'mail'
      ? `mailto:contact@mikabon.fr?subject=${encodeURIComponent('Demande de devis : ' + d.type + ', ' + date)}&body=${encodeURIComponent(text)}`
      : `https://wa.me/33600000000?text=${encodeURIComponent(text)}`;
    if (via === 'mail') location.href = url; else window.open(url, '_blank', 'noopener');
  });
})();
