(function () {
  'use strict';

  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Le déchirement piloté par le scroll ---------- */
  var section = document.getElementById('dechire');
  if (section && !reduit) {
    var nuit = section.querySelector('.dechire__nuit');
    var assiette = section.querySelector('.assiette');
    var d1 = section.querySelector('.d1');
    var d2 = section.querySelector('.d2');
    var d3 = section.querySelector('.d3');
    var mots = section.querySelectorAll('.mot');
    var canvas = section.querySelector('.dechire__vapeur');
    var ctx = canvas.getContext('2d');

    var visible = false;
    var progres = 0;

    function borne(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
    function doux(a, b, v) { var t = borne((v - a) / (b - a)); return t * t * (3 - 2 * t); }

    function lireScroll() {
      var r = section.getBoundingClientRect();
      var course = section.offsetHeight - window.innerHeight;
      progres = borne(-r.top / course);
    }

    function peindre() {
      var p = progres;
      nuit.style.opacity = doux(0.02, 0.2, p);
      // l'assiette avance vers vous
      assiette.style.transform = 'scale(' + (0.82 + 0.24 * doux(0, 1, p)) + ')';
      // fondus enchaînés 1 > 2 > 3 avec une poussée de zoom
      var o2 = doux(0.3, 0.46, p);
      var o3 = doux(0.6, 0.76, p);
      var zoom = 1 + 0.1 * p;
      d1.style.transform = d2.style.transform = d3.style.transform = 'scale(' + zoom + ')';
      d2.style.opacity = o2;
      d3.style.opacity = o3;
      // les mots arrivent par étapes
      var seuils = [[0.14, 0.24], [0.42, 0.52], [0.72, 0.84]];
      for (var i = 0; i < mots.length; i++) {
        var t = doux(seuils[i][0], seuils[i][1], p);
        mots[i].style.opacity = t;
        mots[i].style.transform = 'translateY(' + ((1 - t) * 24) + 'px)';
      }
    }

    /* vapeur : quelques volutes douces qui montent de l'assiette */
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0;
    var volute = document.createElement('canvas');
    volute.width = volute.height = 128;
    (function () {
      var c = volute.getContext('2d');
      var g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,250,240,0.55)');
      g.addColorStop(0.5, 'rgba(255,250,240,0.18)');
      g.addColorStop(1, 'rgba(255,250,240,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 128, 128);
    })();

    function taille() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    var brins = [];
    function nouveau(debut) {
      var ray = assiette.getBoundingClientRect();
      var cx = ray.left + ray.width / 2;
      var cy = ray.top + ray.height * 0.55;
      return {
        x: cx + (Math.random() - 0.5) * ray.width * 0.5,
        y: debut ? cy - Math.random() * ray.height * 0.6 : cy,
        r: 40 + Math.random() * 70,
        vy: 0.25 + Math.random() * 0.45,
        vx: (Math.random() - 0.5) * 0.25,
        vie: 0,
        duree: 260 + Math.random() * 220,
        phase: Math.random() * 6.28
      };
    }
    for (var k = 0; k < 26; k++) brins.push(nouveau(true));

    function vapeur() {
      ctx.clearRect(0, 0, W, H);
      // plus de vapeur quand la viande s'ouvre
      var force = 0.25 + 0.75 * doux(0.35, 0.85, progres);
      for (var i = 0; i < brins.length; i++) {
        var b = brins[i];
        b.vie++;
        b.y -= b.vy;
        b.x += b.vx + Math.sin((b.vie / 60) + b.phase) * 0.25;
        b.r += 0.12;
        var t = b.vie / b.duree;
        var a = Math.sin(Math.PI * Math.min(t, 1)) * 0.5 * force;
        if (t >= 1) { brins[i] = nouveau(false); continue; }
        ctx.globalAlpha = a;
        ctx.drawImage(volute, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      ctx.globalAlpha = 1;
    }

    var enCours = false;
    function boucle() {
      if (!visible) { enCours = false; return; }
      lireScroll();
      peindre();
      vapeur();
      requestAnimationFrame(boucle);
    }

    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible && !enCours) { enCours = true; taille(); requestAnimationFrame(boucle); }
    }, { rootMargin: '100px 0px' }).observe(section);

    window.addEventListener('resize', function () { if (visible) taille(); });
    lireScroll(); peindre();
  }

  /* ---------- Formulaire de devis : WhatsApp ou email ---------- */
  var form = document.getElementById('form-devis');
  if (!form) return;
  var erreur = document.getElementById('form-erreur');
  // À REMPLACER : numéro et adresse réels
  var WHATSAPP = '33600000000';
  var EMAIL = 'contact@mikabon.fr';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var canal = (e.submitter && e.submitter.value) || 'whatsapp';
    var requis = ['type', 'date', 'lieu', 'invites', 'nom'];
    var manque = [];
    requis.forEach(function (n) {
      var el = form.elements[n];
      var vide = !el.value.trim();
      el.setAttribute('aria-invalid', vide ? 'true' : 'false');
      if (vide) manque.push(el);
    });
    if (manque.length) {
      erreur.hidden = false;
      erreur.textContent = 'Il manque ' + manque.length + (manque.length > 1 ? ' champs' : ' champ') + ' : type d’événement, date, lieu, nombre d’invités et nom sont nécessaires pour le devis.';
      manque[0].focus();
      return;
    }
    erreur.hidden = true;

    var f = form.elements;
    var date = f.date.value ? new Date(f.date.value + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
    var lignes = [
      'Bonjour Mika, je voudrais un devis.',
      '',
      'Événement : ' + f.type.value,
      'Date : ' + date,
      'Lieu : ' + f.lieu.value.trim(),
      'Invités : ' + f.invites.value,
      f.budget.value.trim() ? 'Budget par personne : ' + f.budget.value.trim() : '',
      f.message.value.trim() ? '\n' + f.message.value.trim() : '',
      '',
      f.nom.value.trim() + (f.tel.value.trim() ? ', ' + f.tel.value.trim() : '')
    ].filter(function (l, i, arr) { return l !== '' || (arr[i - 1] !== '' && i > 0); });
    var texte = lignes.join('\n');

    if (canal === 'mail') {
      var sujet = 'Demande de devis : ' + f.type.value + ', ' + f.invites.value + ' invités';
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(sujet) + '&body=' + encodeURIComponent(texte);
    } else {
      window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texte), '_blank', 'noopener');
    }
  });

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) e.target.setAttribute('aria-invalid', 'false');
  });
})();
