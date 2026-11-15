/**
 * Mapa con imagen satelital real (teselas XYZ, Web Mercator).
 * El área de estudio se ve clara con un contorno brillante; el resto se oscurece.
 */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}, parent) => {
    const n = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => v != null && n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  };

  const TILE = 256;
  const OUTLINE = '#C9F7E0';

  // Web Mercator en píxeles del mundo a zoom 0 (256 × 256)
  const merc = ([lat, lon]) => {
    const s = Math.sin(lat * Math.PI / 180);
    return [TILE * (lon + 180) / 360, TILE * (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI))];
  };
  const unmerc = ([x, y]) => {
    const lon = (x / TILE) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * y) / TILE;
    return [(180 / Math.PI) * Math.atan(Math.sinh(n)), lon];
  };

  function createMap(svg, { imagery, onSiteClick, onEmptyClick, onImageryStatus }) {
    let territory = null;
    let view = null;
    let W = 0, H = 0;
    let ringAt = null;
    let selectedId = null;
    let layer = 'ambos';

    function makeView(aoi) {
      const pts = aoi.map(merc);
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      // Espacio para la tarjeta (derecha), el panel lateral (izquierda) y la leyenda (abajo)
      const wide = W > 1000;
      const pad = { t: 56, r: wide ? 390 : 32, b: 72, l: wide ? 300 : 32 };
      const s = Math.min((W - pad.l - pad.r) / (maxX - minX), (H - pad.t - pad.b) / (maxY - minY));
      const ox = pad.l + (W - pad.l - pad.r - (maxX - minX) * s) / 2 - minX * s;
      const oy = pad.t + (H - pad.t - pad.b - (maxY - minY) * s) / 2 - minY * s;
      return {
        s, ox, oy,
        project: ll => { const [x, y] = merc(ll); return [ox + x * s, oy + y * s]; },
        invert: ([x, y]) => unmerc([(x - ox) / s, (y - oy) / s]),
      };
    }

    const pathOf = poly => 'M' + poly.map(p => view.project(p).map(v => v.toFixed(1)).join(',')).join('L') + 'Z';

    // ───────── Teselas satelitales ─────────
    function drawTiles(parent) {
      if (!imagery || !imagery.url) return;
      // zoom de teselas: el primero cuya resolución iguala o supera la de pantalla
      const z = Math.max(0, Math.min(imagery.maxZoom || 18, Math.ceil(Math.log2(view.s * (window.devicePixelRatio || 1)))));
      const n = 2 ** z;
      const size = (TILE * view.s) / n;              // tamaño de una tesela en pantalla
      const x0 = Math.floor((-view.ox / view.s) * n / TILE), x1 = Math.floor(((W - view.ox) / view.s) * n / TILE);
      const y0 = Math.floor((-view.oy / view.s) * n / TILE), y1 = Math.floor(((H - view.oy) / view.s) * n / TILE);
      let pending = 0, failed = 0, loaded = 0;
      const report = () => onImageryStatus && onImageryStatus({ pending, failed, loaded });
      for (let ty = Math.max(0, y0); ty <= Math.min(n - 1, y1); ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const wx = ((tx % n) + n) % n;
          const href = imagery.url.replace('{z}', z).replace('{x}', wx).replace('{y}', ty);
          const img = el('image', {
            href,
            x: (view.ox + (tx * TILE / n) * view.s).toFixed(2),
            y: (view.oy + (ty * TILE / n) * view.s).toFixed(2),
            // +0,5 px evita líneas finas entre teselas
            width: (size + 0.5).toFixed(2),
            height: (size + 0.5).toFixed(2),
            preserveAspectRatio: 'none',
            crossorigin: 'anonymous',
          }, parent);
          pending++;
          img.addEventListener('load', () => { pending--; loaded++; report(); });
          img.addEventListener('error', () => { pending--; failed++; report(); });
        }
      }
      report();
    }

    function toLatLon(e) {
      const r = svg.getBoundingClientRect();
      return view.invert([e.clientX - r.left, e.clientY - r.top]);
    }

    function render() {
      const r = svg.getBoundingClientRect();
      W = r.width; H = r.height;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML = '';
      if (!territory || territory.empty) return;
      view = makeView(territory.aoi);

      const defs = el('defs', {}, svg);
      const glow = el('filter', { id: 'glow', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
      el('feGaussianBlur', { stdDeviation: 6, result: 'b' }, glow);
      const merge = el('feMerge', {}, glow);
      el('feMergeNode', { in: 'b' }, merge); el('feMergeNode', { in: 'SourceGraphic' }, merge);

      const aoiPath = pathOf(territory.aoi);
      const mask = el('mask', { id: 'dimMask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
      el('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }, mask);
      el('path', { d: aoiPath, fill: '#000' }, mask);

      // Imagen satelital
      const base = el('g', { class: 'imagery' }, svg);
      el('rect', { x: 0, y: 0, width: W, height: H, fill: '#071016' }, base);
      drawTiles(base);

      // Fuera del área: oscurecido y desaturado
      el('rect', { x: 0, y: 0, width: W, height: H, fill: '#010507', 'fill-opacity': 0.78, mask: 'url(#dimMask)', 'pointer-events': 'none', class: 'dim' }, svg);

      // Área de estudio: clic en un punto sin datos
      const area = el('path', { d: aoiPath, fill: 'transparent', class: 'aoi' }, svg);
      area.addEventListener('click', e => onEmptyClick && onEmptyClick(toLatLon(e)));
      el('path', { d: aoiPath, fill: 'none', stroke: OUTLINE, 'stroke-width': 2.5, 'stroke-opacity': 0.6, filter: 'url(#glow)', 'pointer-events': 'none' }, svg);
      el('path', { d: aoiPath, fill: 'none', stroke: OUTLINE, 'stroke-width': 1.2, 'pointer-events': 'none' }, svg);

      // Coordenadas de los vértices
      const labels = el('g', { class: 'coords', 'pointer-events': 'none' }, svg);
      const cx = territory.aoi.reduce((s, p) => s + view.project(p)[0], 0) / territory.aoi.length;
      territory.aoi.forEach(pt => {
        const [x, y] = view.project(pt);
        el('circle', { cx: x, cy: y, r: 3, fill: OUTLINE }, labels);
        let right = x >= cx;
        if (!right && x < (W > 1000 ? 420 : 150)) right = true;
        if (right && x > W - 150) right = false;
        const flipped = right !== (x >= cx);
        el('text', { x: x + (right ? 10 : -10), y: y + (flipped ? 18 : 4), 'text-anchor': right ? 'start' : 'end' }, labels)
          .textContent = `${pt[0].toFixed(6)}, ${pt[1].toFixed(6)}`;
      });

      // Puntos de muestreo
      const sites = el('g', { class: 'sites' }, svg);
      territory.sites.forEach(s => {
        const [x, y] = view.project([s.lat, s.lon]);
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
      const [x, y] = view.project(ringAt);
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

    let t = 0;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(render, 150); });

    return {
      setTerritory(tt, { keepSelection = false } = {}) {
        territory = tt;
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

  window.KatouwaMap = { createMap, merc, unmerc };
})();
