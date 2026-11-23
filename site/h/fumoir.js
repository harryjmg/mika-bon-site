/* MC Cuisine, temps II (le fumoir) : révèle le plan à son entrée dans l'écran.
   Rien n'est caché tant que ce script n'a pas posé .fumoir-on. Avec prefers-reduced-motion, il ne fait rien. */
(() => {
  const el = document.querySelector('.fumoir');
  if (!el || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.classList.add('fumoir-on');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      el.classList.add('is-in');
      io.disconnect();
    });
  }, { threshold: 0.15 });
  io.observe(el);
})();
