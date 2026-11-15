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

  const MOON_CY = 180 / 1024;  // centro de la luna en la imagen (fracción del alto)
  const MOON_D = 320 / 572;    // diámetro de la luna (fracción del ancho)

  let imgH = 0, imgW = 0, vh = 0, stops = [0, 0, 0], moon = { s: 1, y: 0 };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  function measure() {
    vh = window.innerHeight;
    // medir sin la transformación actual
    imgW = img.offsetWidth;
    imgH = img.offsetHeight;
    const maxOff = Math.max(0, imgH - vh);
    // Desplazamiento de la imagen hacia arriba para cada etapa
    stops = [
      maxOff,                                                 // bajo el agua: parte inferior
      clamp(WATERLINE * imgH - SURFACE_AT * vh, 0, maxOff),   // superficie
      0                                                       // luna: parte superior
    ];
    // Luna final: escalada para que quepa completa en la mitad superior y quede fija
    const vw = window.innerWidth;
    const s = Math.min(1, (0.56 * vh) / (MOON_D * imgW), (0.6 * vw) / (MOON_D * imgW));
    moon = { s, y: 0.36 * vh - MOON_CY * imgH * s };

    const w = imgW * 0.30;      // ancho de .palafitos (30% del track)
    const h = w * (120 / 400);
    if (palafitos) palafitos.style.top = `${WATERLINE * imgH - h * 0.72}px`;
    update();
  }

  function update() {
    // progreso continuo 0 → 2 a lo largo de las tres etapas
    // (después de la luna, p se queda en 2: la luna permanece fija)
    const p = clamp(window.scrollY / vh, 0, 2);
    const seg = Math.min(1, Math.floor(p));
    const t = ease(p - seg);
    let y = -lerp(stops[seg], stops[seg + 1], t);
    let s = 1;
    if (seg === 1) {            // de la superficie a la luna: sube y se aleja
      y = lerp(-stops[1], moon.y, t);
      s = lerp(1, moon.s, t);
    }
    track.style.transform = `translate3d(-50%, ${y}px, 0) scale(${s})`;
    track.style.setProperty('--edge', `${(1 - s) / (1 - Math.min(moon.s, 0.999)) * 22}%`);

    // Capas por etapa
    const under = clamp(1 - p, 0, 1);
    tintDeep.style.opacity = under;
    rays.style.opacity = under;
    bubbles.style.opacity = clamp(1 - p * 1.4, 0, 1);
    tintDusk.style.opacity = clamp(1 - Math.abs(p - 1) * 1.3, 0, 1);
    tintNight.style.opacity = clamp(p - 1, 0, 1);

    const mid = window.scrollY + vh / 2;
    let active = 0;
    stages.forEach((st, i) => { if (st.offsetTop <= mid) active = i; });
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
  // Texto en añú: cada letra aparece como una pequeña onda sobre el agua
  document.querySelectorAll('[data-anu]').forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const tag = document.createElement('span');
    tag.className = 'anu__tag';
    tag.setAttribute('aria-hidden', 'true');
    tag.textContent = 'Añú';
    el.appendChild(tag);
    const line = document.createElement('span');
    line.className = 'anu__text';
    line.setAttribute('aria-hidden', 'true');
    [...text].forEach((ch, i) => {
      const c = document.createElement('span');
      c.className = 'anu__ch';
      c.style.setProperty('--i', i);
      c.textContent = ch === ' ' ? '\u00a0' : ch;
      line.appendChild(c);
    });
    el.appendChild(line);
  });

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
