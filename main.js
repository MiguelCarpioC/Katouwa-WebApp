(() => {
  const track = document.getElementById('track');
  const img = document.getElementById('sceneImg');
  const palafitos = track.querySelector('.palafitos');
  const tintDeep = document.getElementById('tintDeep');
  const rays = document.getElementById('rays');
  const tintDusk = document.getElementById('tintDusk');
  const tintNight = document.getElementById('tintNight');
  const bubbles = document.getElementById('bubbles');
  const stages = [...document.querySelectorAll('.stage')];
  const dots = [...document.querySelectorAll('.depth a')];

  const WATERLINE = 0.635;   // línea de agua en la imagen
  const SURFACE_AT = 0.70;   // en la etapa 2 la línea de agua queda en el tercio inferior

  let imgH = 0, vh = 0, stops = [0, 0, 0];

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  function measure() {
    vh = window.innerHeight;
    imgH = img.getBoundingClientRect().height;
    const maxOff = Math.max(0, imgH - vh);
    // Desplazamiento de la imagen hacia arriba para cada etapa
    stops = [
      maxOff,                                                 // bajo el agua: parte inferior
      clamp(WATERLINE * imgH - SURFACE_AT * vh, 0, maxOff),   // superficie
      0                                                       // luna: parte superior
    ];
    const w = palafitos.getBoundingClientRect().width;
    const h = w * (120 / 400);
    palafitos.style.top = `${WATERLINE * imgH - h * 0.72}px`;
    update();
  }

  function update() {
    // progreso continuo 0 → 2 a lo largo de las tres etapas
    const p = clamp(window.scrollY / vh, 0, 2);
    const seg = Math.min(1, Math.floor(p));
    const t = ease(p - seg);
    const off = lerp(stops[seg], stops[seg + 1], t);
    track.style.transform = `translate3d(-50%, ${-off}px, 0)`;

    // Capas por etapa
    const under = clamp(1 - p, 0, 1);
    tintDeep.style.opacity = under;
    rays.style.opacity = under;
    bubbles.style.opacity = clamp(1 - p * 1.4, 0, 1);
    tintDusk.style.opacity = clamp(1 - Math.abs(p - 1) * 1.3, 0, 1);
    tintNight.style.opacity = clamp(p - 1, 0, 1);

    const active = Math.round(p);
    dots.forEach((d, i) => d.classList.toggle('is-active', i === active));
  }

  // Burbujas
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    for (let i = 0; i < 14; i++) {
      const b = document.createElement('span');
      const s = 4 + Math.random() * 12;
      b.style.width = b.style.height = `${s}px`;
      b.style.left = `${8 + Math.random() * 84}%`;
      b.style.animationDuration = `${10 + Math.random() * 12}s`;
      b.style.animationDelay = `${-Math.random() * 20}s`;
      bubbles.appendChild(b);
    }
  }

  // Aparición de los textos
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add('is-visible'));
  }, { threshold: 0.35 });
  stages.forEach(s => io.observe(s));

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', measure);
  if (img.complete) measure(); else img.addEventListener('load', measure);
})();
