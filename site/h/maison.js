/* MC Cuisine, section #maison.
   1. Révèle chaque plan à son entrée dans l'écran. Rien n'est caché tant que ce script n'a pas posé .maison-on.
   2. Fond vidéo du temps I : rien n'est chargé au premier affichage (preload="none"). La vidéo se lance
      quand le plan approche et se met en pause quand il sort. Avec prefers-reduced-motion, elle ne part
      jamais et son poster reste en fond. */
(() => {
  const sec = document.getElementById('maison');
  if (!sec || !('IntersectionObserver' in window)) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const video = sec.querySelector('.chef__video');
  if (video && !reduce) {
    const vio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          const p = video.play();
          if (p && p.catch) p.catch(() => {}); // lecture bloquée : le poster reste
        } else {
          video.pause();
        }
      });
    }, { rootMargin: '200px 0px' });
    vio.observe(video);
  }

  if (reduce) return;
  const parts = sec.querySelectorAll('.temps');
  sec.classList.add('maison-on');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.18 });
  parts.forEach(p => io.observe(p));
})();
