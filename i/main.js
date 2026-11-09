/* MC Cuisine, direction I */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Vidéo : pas de lecture si l'utilisateur limite les animations */
  const video = document.querySelector('.hero__video');
  if (video) {
    if (reduce) { video.removeAttribute('autoplay'); video.pause(); }
    else { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
  }

  /* Barre : fond charbon une fois l'ouverture passée */
  const bar = document.getElementById('bar');
  const hero = document.querySelector('.hero');
  const onScroll = () => bar.classList.toggle('is-on', window.scrollY > hero.offsetHeight - 80);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Apparition des textes */
  const items = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) items.forEach(el => el.classList.add('is-in'));
  else {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { threshold: .2 });
    items.forEach(el => io.observe(el));
  }

  /* Formulaire : ouvre WhatsApp ou un e-mail déjà écrit */
  // À REMPLACER : numéro et adresse réels
  const WA = '33600000000';
  const MAIL = 'contact@mccuisine.fr';
  const form = document.getElementById('quote-form');
  const err = document.getElementById('form-error');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const channel = (e.submitter && e.submitter.dataset.channel) || 'whatsapp';
    const missing = [];
    form.querySelectorAll('[required]').forEach(f => {
      const bad = !f.value.trim();
      f.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad) missing.push(form.querySelector(`label[for="${f.id}"]`).textContent.trim().toLowerCase());
    });
    if (missing.length) {
      err.hidden = false;
      err.textContent = `Il manque : ${missing.join(', ')}.`;
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    err.hidden = true;
    const d = new FormData(form);
    const date = new Date(d.get('date') + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const text = [
      'Bonjour Mika, je voudrais un devis.',
      '',
      `Date : ${date}`,
      `Lieu : ${d.get('lieu')}`,
      `Invités : ${d.get('invites')}`,
      `Téléphone : ${d.get('tel')}`
    ].join('\n');
    if (channel === 'mail') {
      location.href = `mailto:${MAIL}?subject=${encodeURIComponent('Demande de devis, ' + date)}&body=${encodeURIComponent(text)}`;
    } else {
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
  });
  form.addEventListener('input', e => { if (e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false'); });
})();
