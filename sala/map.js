/**
 * Mapa satelital estilizado (SVG plano).
 * Solo el área de estudio se ve con claridad; el resto queda casi negro.
 * El fondo (agua / vegetación) es ilustrativo: los datos reales son los puntos de muestreo.
 */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}, parent) => {
    const n = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => v != null && n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  };

  const COLORS = {
    land: '#0D1D16',
    sceneWater: '#0A3A55',
    sceneVeg: '#1C4A33',
    veg: '#43B87E',
    water: '#2F93C4',
    outline: '#C9F7E0',
    site: '#D9C7A3',
    dim: '#010507',
  };

  function createMap(svg, { onSiteClick, onWaterClick, onEmptyClick }) {
    let territory = null;
    let proj = null;
    let W = 0, H = 0;
    let ringAt = null;
    let selectedId = null;
    let layer = 'ambos';

    function makeProjection(aoi) {
      const lat0 = aoi.reduce((s, p) => s + p[0], 0) / aoi.length;
      const kx = Math.cos(lat0 * Math.PI / 180);
      const xs = aoi.map(p => p[1] * kx), ys = aoi.map(p => -p[0]);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      // Espacio para la tarjeta (derecha), el panel de voces (izquierda) y la leyenda (abajo)
      const wide = W > 1000;
      const pad = { t: 64, r: wide ? 390 : 40, b: 84, l: wide ? 150 : 56 };
      const s = Math.min((W - pad.l - pad.r) / (maxX - minX), (H - pad.t - pad.b) / (maxY - minY));
      const ox = pad.l + (W - pad.l - pad.r - (maxX - minX) * s) / 2;
      const oy = pad.t + (H - pad.t - pad.b - (maxY - minY) * s) / 2;
      return {
        project: ([lat, lon]) => [ox + (lon * kx - minX) * s, oy + (-lat - minY) * s],
        invert: ([x, y]) => [-((y - oy) / s + minY), ((x - ox) / s + minX) / kx],
      };
    }

    const pathOf = poly => 'M' + poly.map(p => proj.project(p).map(v => v.toFixed(1)).join(',')).join('L') + 'Z';

    function toLatLon(e) {
      const r = svg.getBoundingClientRect();
      return proj.invert([e.clientX - r.left, e.clientY - r.top]);
    }

    function render() {
      const r = svg.getBoundingClientRect();
      W = r.width; H = r.height;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML = '';
      if (!territory || territory.empty) return;
      proj = makeProjection(territory.aoi);

      const defs = el('defs', {}, svg);
      const tex = el('filter', { id: 'tex', x: 0, y: 0, width: '100%', height: '100%' }, defs);
      el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.012 0.018', numOctaves: 4, seed: 7 }, tex);
      el('feColorMatrix', { values: '0 0 0 0 0.12  0 0 0 0 0.22  0 0 0 0 0.16  0 0 0 0.9 -0.25' }, tex);
      const glow = el('filter', { id: 'glow', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
      el('feGaussianBlur', { stdDeviation: 6, result: 'b' }, glow);
      const merge = el('feMerge', {}, glow);
      el('feMergeNode', { in: 'b' }, merge); el('feMergeNode', { in: 'SourceGraphic' }, merge);
      const ripple = el('pattern', { id: 'ripple', width: 14, height: 14, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-18)' }, defs);
      el('path', { d: 'M0 7 Q3.5 4 7 7 T14 7', fill: 'none', stroke: 'rgba(200,235,255,0.10)', 'stroke-width': 1 }, ripple);

      const aoiPath = pathOf(territory.aoi);
      el('path', { d: aoiPath }, el('clipPath', { id: 'aoiClip' }, defs));
      const mask = el('mask', { id: 'dimMask', maskUnits: 'userSpaceOnUse', x: -W, y: -H, width: W * 3, height: H * 3 }, defs);
      el('rect', { x: -W, y: -H, width: W * 3, height: H * 3, fill: '#fff' }, mask);
      el('path', { d: aoiPath, fill: '#000' }, mask);

      // Entorno
      const base = el('g', {}, svg);
      el('rect', { x: -W, y: -H, width: W * 3, height: H * 3, fill: COLORS.land }, base);
      el('rect', { x: 0, y: 0, width: W, height: H, filter: 'url(#tex)' }, base);
      territory.scene.water.forEach(p => {
        el('path', { d: pathOf(p), fill: COLORS.sceneWater }, base);
        el('path', { d: pathOf(p), fill: 'url(#ripple)' }, base);
      });
      territory.scene.vegetation.forEach(p => el('path', { d: pathOf(p), fill: COLORS.sceneVeg }, base));

      // Dentro del área de estudio: tintes y clics
      const inside = el('g', { 'clip-path': 'url(#aoiClip)', class: 'tints' }, svg);
      const empty = el('path', { d: aoiPath, fill: 'transparent' }, inside);
      empty.addEventListener('click', e => onEmptyClick && onEmptyClick(toLatLon(e)));
      territory.scene.water.forEach(p => {
        const w = el('path', { d: pathOf(p), fill: COLORS.water, 'fill-opacity': 0.42, class: 'water' }, inside);
        el('title', {}, w).textContent = 'Lago de Maracaibo';
        w.addEventListener('click', e => { e.stopPropagation(); onWaterClick(toLatLon(e)); });
      });
      territory.scene.vegetation.forEach(p => {
        const v = el('path', { d: pathOf(p), fill: COLORS.veg, 'fill-opacity': 0.5, class: 'veg' }, inside);
        v.addEventListener('click', e => { e.stopPropagation(); onEmptyClick && onEmptyClick(toLatLon(e)); });
      });

      el('rect', { x: -W, y: -H, width: W * 3, height: H * 3, fill: COLORS.dim, 'fill-opacity': 0.88, mask: 'url(#dimMask)', 'pointer-events': 'none' }, svg);
      el('path', { d: aoiPath, fill: 'none', stroke: COLORS.outline, 'stroke-width': 2, 'stroke-opacity': 0.55, filter: 'url(#glow)', 'pointer-events': 'none' }, svg);
      el('path', { d: aoiPath, fill: 'none', stroke: COLORS.outline, 'stroke-width': 1, 'pointer-events': 'none' }, svg);

      // Coordenadas de las esquinas
      const labels = el('g', { 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, fill: 'rgba(232,238,242,0.55)', 'pointer-events': 'none' }, svg);
      const cx = territory.aoi.reduce((s, p) => s + proj.project(p)[0], 0) / territory.aoi.length;
      territory.aoi.forEach(pt => {
        const [x, y] = proj.project(pt);
        el('circle', { cx: x, cy: y, r: 2.5, fill: COLORS.outline }, labels);
        let right = x >= cx;
        if (!right && x < 150) right = true;
        if (right && x > W - 150) right = false;
        const flipped = right !== (x >= cx);
        el('text', { x: x + (right ? 10 : -10), y: y + (flipped ? 18 : 4), 'text-anchor': right ? 'start' : 'end' }, labels)
          .textContent = `${pt[0].toFixed(6)}, ${pt[1].toFixed(6)}`;
      });

      // Puntos de muestreo (datos reales)
      const sites = el('g', { class: 'sites' }, svg);
      territory.sites.forEach(s => {
        const [x, y] = proj.project([s.lat, s.lon]);
        const g = el('g', {
          class: 'site' + (s.id === selectedId ? ' is-selected' : ''),
          transform: `translate(${x.toFixed(1)},${y.toFixed(1)})`,
          tabindex: 0, role: 'button', 'data-site': s.id,
          'aria-label': `${s.name}. ${s.status}`,
        }, sites);
        el('title', {}, g).textContent = `${s.name}\n${s.lat.toFixed(6)}, ${s.lon.toFixed(6)}\n${s.status}`;
        el('circle', { r: 16, class: 'site__hit' }, g);
        el('circle', { r: 7, class: 'site__halo' }, g);
        el('circle', { r: 3.5, class: 'site__dot' }, g);
        el('text', { x: 12, y: -10, class: 'site__label' }, g).textContent = s.id;
        const go = () => onSiteClick(s.id, [s.lat, s.lon]);
        g.addEventListener('click', e => { e.stopPropagation(); go(); });
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });

      el('g', { class: 'ring', id: 'ring' }, svg);
      drawRing();
      applyLayer();
    }

    function drawRing() {
      const g = svg.querySelector('#ring');
      if (!g) return;
      g.innerHTML = '';
      if (!ringAt) return;
      const [x, y] = proj.project(ringAt);
      g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      el('circle', { class: 'ring__pulse', r: 12 }, g);
      el('circle', { class: 'ring__pulse', r: 12 }, g);
      el('circle', { r: 9, 'stroke-width': 1.2, 'stroke-opacity': 0.8 }, g);
    }

    function applyLayer() {
      const map = svg.parentElement;
      map.classList.toggle('layer-nasa', layer === 'nasa');
      map.classList.toggle('layer-voces', layer === 'voces');
    }

    window.addEventListener('resize', render);

    return {
      setTerritory(t, { keepSelection = false } = {}) {
        territory = t;
        if (!keepSelection) { ringAt = null; selectedId = null; }
        render();
      },
      setLayer(l) { layer = l; applyLayer(); },
      select(id, latlon) {
        selectedId = id;
        ringAt = latlon;
        svg.querySelectorAll('.site').forEach(s => s.classList.toggle('is-selected', s.dataset.site === id));
        drawRing();
      },
      clear() {
        selectedId = null; ringAt = null;
        svg.querySelectorAll('.site.is-selected').forEach(s => s.classList.remove('is-selected'));
        drawRing();
      },
    };
  }

  window.KatouwaMap = { createMap };
})();
