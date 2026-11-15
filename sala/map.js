/**
 * Mapa satelital estilizado (SVG plano).
 * Solo el área de estudio se ve con claridad; el resto queda casi negro.
 */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}, parent) => {
    const n = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  };

  const COLORS = {
    land: '#0D1D16',
    sceneWater: '#0A3A55',
    sceneVeg: '#1C4A33',
    zoneVeg: '#43B87E',
    zoneWater: '#2F93C4',
    critical: '#E5604D',
    outline: '#C9F7E0',
    dim: '#010507',
  };

  function createMap(svg, { onZoneClick, onEmptyClick }) {
    let territory = null;
    let proj = null;
    let W = 0, H = 0;
    let ringAt = null;          // [lat, lon]
    let selectedId = null;

    // ───────── Proyección equirectangular ajustada al área de estudio ─────────
    function makeProjection(aoi) {
      const lat0 = aoi.reduce((s, p) => s + p[0], 0) / aoi.length;
      const kx = Math.cos(lat0 * Math.PI / 180);
      const xs = aoi.map(p => p[1] * kx), ys = aoi.map(p => -p[0]);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      // Espacio reservado para la tarjeta (derecha) y la leyenda (abajo)
      const pad = { t: 56, r: W > 1000 ? 380 : 40, b: 84, l: 56 };
      const s = Math.min((W - pad.l - pad.r) / (maxX - minX), (H - pad.t - pad.b) / (maxY - minY));
      const ox = pad.l + (W - pad.l - pad.r - (maxX - minX) * s) / 2;
      const oy = pad.t + (H - pad.t - pad.b - (maxY - minY) * s) / 2;
      return {
        project: ([lat, lon]) => [ox + (lon * kx - minX) * s, oy + (-lat - minY) * s],
        invert: ([x, y]) => [-((y - oy) / s + minY), ((x - ox) / s + minX) / kx],
        scale: s,
      };
    }

    const pathOf = poly => 'M' + poly.map(p => proj.project(p).map(v => v.toFixed(1)).join(',')).join('L') + 'Z';

    function zoneFill(zone) {
      const st = territory.zoneStatus && territory.zoneStatus[zone.id];
      if (st && st.status === 'critico') return COLORS.critical;
      return zone.kind === 'water' ? COLORS.zoneWater : COLORS.zoneVeg;
    }

    // ───────── Dibujo ─────────
    function render() {
      if (!territory) return;
      const r = svg.getBoundingClientRect();
      W = r.width; H = r.height;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      proj = makeProjection(territory.aoi);
      svg.innerHTML = '';

      const defs = el('defs', {}, svg);
      // Textura "satelital" plana
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
      const clip = el('clipPath', { id: 'aoiClip' }, defs);
      el('path', { d: aoiPath }, clip);
      const mask = el('mask', { id: 'dimMask', maskUnits: 'userSpaceOnUse', x: -W, y: -H, width: W * 3, height: H * 3 }, defs);
      el('rect', { x: -W, y: -H, width: W * 3, height: H * 3, fill: '#fff' }, mask);
      el('path', { d: aoiPath, fill: '#000' }, mask);

      // Base: tierra, agua y vegetación (todo el entorno)
      const base = el('g', {}, svg);
      el('rect', { x: -W, y: -H, width: W * 3, height: H * 3, fill: COLORS.land }, base);
      el('rect', { x: 0, y: 0, width: W, height: H, filter: 'url(#tex)' }, base);
      territory.scene.water.forEach(p => {
        el('path', { d: pathOf(p), fill: COLORS.sceneWater }, base);
        el('path', { d: pathOf(p), fill: 'url(#ripple)' }, base);
      });
      territory.scene.vegetation.forEach(p => el('path', { d: pathOf(p), fill: COLORS.sceneVeg }, base));

      // Zonas monitoreadas, recortadas al área de estudio
      const zones = el('g', { 'clip-path': 'url(#aoiClip)' }, svg);
      // Fondo clicable del área (puntos sin zona)
      const empty = el('path', { d: aoiPath, fill: 'transparent' }, zones);
      empty.addEventListener('click', e => onEmptyClick && onEmptyClick(toLatLon(e)));
      const order = [...territory.zones].sort((a, b) => (a.kind === 'water' ? -1 : 1) - (b.kind === 'water' ? -1 : 1));
      order.forEach(z => {
        const fill = zoneFill(z);
        const p = el('path', {
          d: pathOf(z.polygon),
          fill,
          'fill-opacity': z.kind === 'water' ? 0.42 : 0.62,
          stroke: fill,
          'stroke-opacity': 0.5,
          'stroke-width': 1,
          class: 'zone' + (z.id === selectedId ? ' is-selected' : ''),
          'data-zone': z.id,
          tabindex: 0,
          role: 'button',
          'aria-label': z.name,
        }, zones);
        el('title', {}, p).textContent = z.name;
        p.addEventListener('click', e => { e.stopPropagation(); onZoneClick(z, toLatLon(e)); });
        p.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onZoneClick(z, centroid(z.polygon)); }
        });
      });

      // Oscurecer todo lo que está fuera del área de estudio
      el('rect', { x: -W, y: -H, width: W * 3, height: H * 3, fill: COLORS.dim, 'fill-opacity': 0.88, mask: 'url(#dimMask)', 'pointer-events': 'none' }, svg);

      // Contorno brillante
      el('path', { d: aoiPath, fill: 'none', stroke: COLORS.outline, 'stroke-width': 2, 'stroke-opacity': 0.55, filter: 'url(#glow)', 'pointer-events': 'none' }, svg);
      el('path', { d: aoiPath, fill: 'none', stroke: COLORS.outline, 'stroke-width': 1, 'pointer-events': 'none' }, svg);

      // Coordenadas de las esquinas
      const labels = el('g', { 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, fill: 'rgba(232,238,242,0.55)', 'pointer-events': 'none' }, svg);
      const cx = territory.aoi.reduce((s, p) => s + proj.project(p)[0], 0) / territory.aoi.length;
      territory.aoi.forEach(pt => {
        const [x, y] = proj.project(pt);
        el('circle', { cx: x, cy: y, r: 2.5, fill: COLORS.outline }, labels);
        // A la derecha o izquierda del vértice, sin salirse del mapa (~140 px de texto)
        let right = x >= cx;
        if (!right && x < 150) right = true;
        if (right && x > W - 150) right = false;
        const flipped = right !== (x >= cx);
        const t = el('text', { x: x + (right ? 10 : -10), y: y + (flipped ? 18 : 4), 'text-anchor': right ? 'start' : 'end' }, labels);
        t.textContent = `${pt[0].toFixed(6)}, ${pt[1].toFixed(6)}`;
      });

      // Voces de la comunidad
      const voices = el('g', { class: 'voices' }, svg);
      territory.voices.forEach(v => {
        const [x, y] = proj.project([v.lat, v.lon]);
        const g = el('g', { class: 'voice', transform: `translate(${x.toFixed(1)},${y.toFixed(1)})` }, voices);
        el('title', {}, g).textContent = v.label;
        el('circle', { r: 10, fill: 'rgba(3,10,14,0.55)', stroke: 'rgba(217,199,163,0.5)' }, g);
        const waves = el('g', {}, g);
        [3, 6, 9].forEach((h, i) => el('path', { class: 'wave', d: `M${-5 + i * 5} ${-h / 2} V${h / 2}` }, waves));
      });

      // Anillo de selección
      el('g', { class: 'ring', id: 'ring' }, svg);
      drawRing();
      applyLayer();
    }

    function centroid(poly) {
      const n = poly.length;
      return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
    }

    function toLatLon(e) {
      const r = svg.getBoundingClientRect();
      return proj.invert([e.clientX - r.left, e.clientY - r.top]);
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
      el('circle', { r: 5, fill: '#E8EEF2', stroke: 'none' }, g);
      el('circle', { r: 9, 'stroke-width': 1.2, 'stroke-opacity': 0.8 }, g);
    }

    let layer = 'ambos';
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
      select(zoneId, latlon) {
        selectedId = zoneId;
        ringAt = latlon;
        svg.querySelectorAll('.zone').forEach(z => z.classList.toggle('is-selected', z.dataset.zone === zoneId));
        drawRing();
      },
      clear() { selectedId = null; ringAt = null; svg.querySelectorAll('.zone.is-selected').forEach(z => z.classList.remove('is-selected')); drawRing(); },
    };
  }

  window.KatouwaMap = { createMap };
})();
