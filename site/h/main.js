/* MC Cuisine, direction H : script commun aux quatre pages */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Entrée du titre ---------- */
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));

  /* ---------- Vidéo d'en-tête ---------- */
  const video = document.querySelector('.hero__video');
  if (video) {
    if (reduce) { video.pause(); video.removeAttribute('autoplay'); }
    else {
      const p = video.play();
      if (p && p.catch) p.catch(() => {}); // le poster reste si la lecture est bloquée
    }
  }

  /* ---------- En-tête : passe en barre crème après l'ouverture ---------- */
  const top = document.querySelector('.top');
  const hero = document.querySelector('.hero');
  const onScroll = () => {
    const limit = hero ? hero.offsetHeight - 140 : 40;
    top.classList.toggle('is-solid', window.scrollY > limit);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Brouillard : une texture dessinée une fois, que le CSS fait dériver ---------- */
  const makeFog = () => {
    const W = 900, H = 460;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const puff = (x, y, r, a) => {
      for (const dx of [-W, 0, W]) { // dessiné de part et d'autre : la texture se raccorde
        const cx = x + dx;
        if (cx + r < 0 || cx - r > W) continue;
        const grd = g.createRadialGradient(cx, y, 0, cx, y, r);
        grd.addColorStop(0, `rgba(226,219,212,${a})`);
        grd.addColorStop(.55, `rgba(214,207,200,${a * .45})`);
        grd.addColorStop(1, 'rgba(214,207,200,0)');
        g.fillStyle = grd;
        g.beginPath(); g.arc(cx, y, r, 0, Math.PI * 2); g.fill();
      }
    };
    for (let i = 0; i < 46; i++) puff(rnd() * W, H * (.35 + rnd() * .7), 70 + rnd() * 170, .1 + rnd() * .16);
    for (let i = 0; i < 14; i++) puff(rnd() * W, H * rnd() * .5, 60 + rnd() * 110, .04 + rnd() * .06);
    return c.toDataURL('image/png');
  };
  const fogs = document.querySelectorAll('.fog');
  if (fogs.length) {
    try { root.style.setProperty('--fog', `url(${makeFog()})`); } catch (e) { /* pas de brouillard, rien de grave */ }
    if ('IntersectionObserver' in window && !reduce) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          en.target.querySelectorAll('i').forEach(i => { i.style.animationPlayState = en.isIntersecting ? 'running' : 'paused'; });
        });
      }, { rootMargin: '100px' });
      fogs.forEach(f => io.observe(f));
    }
  }

  /* ---------- Formulaire (page Contact) : WhatsApp ou e-mail pré-rempli ---------- */
  const form = document.getElementById('quote-form');
  if (!form) return;
  const err = document.getElementById('form-error');
  // À REMPLACER : numéro et adresse réels
  const WA = '33600000000';
  const MAIL = 'contact@mccuisine.fr';

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
    const msg = (d.get('message') || '').trim();
    if (msg) lines.push('', msg);
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
