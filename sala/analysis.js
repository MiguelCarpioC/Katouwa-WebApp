/**
 * Vista "Análisis integrado": une los resultados de NASA y la memoria de la comunidad.
 * Gráficos en SVG plano, con tooltip al pasar el cursor y tabla equivalente.
 */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}, parent) => {
    const n = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(([k, v]) => v != null && n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  };
  const fmt = (v, d = 0) => Number(v).toLocaleString('es', { minimumFractionDigits: d, maximumFractionDigits: d });
  const signed = (v, d) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), d);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Paleta categórica validada para la superficie oscura (orden fijo)
  const SERIES = { ROI: '#3987e5', P1: '#d95926', P2: '#199e70' };
  const MARK = { ROI: 'circle', P1: 'square', P2: 'diamond' };   // codificación secundaria

  let tip;
  function tooltip() {
    if (!tip) { tip = document.createElement('div'); tip.className = 'viz-tip'; tip.hidden = true; document.body.appendChild(tip); }
    return tip;
  }
  function showTip(html, x, y) {
    const t = tooltip();
    t.innerHTML = html; t.hidden = false;
    const r = t.getBoundingClientRect();
    t.style.left = `${Math.min(window.innerWidth - r.width - 8, x + 14)}px`;
    t.style.top = `${Math.max(8, y - r.height - 10)}px`;
  }
  const hideTip = () => { if (tip) tip.hidden = true; };

  function marker(g, kind, x, y, color, size = 4.5) {
    const a = { fill: color, stroke: 'var(--viz-surface)', 'stroke-width': 2 };
    if (kind === 'square') return el('rect', { ...a, x: x - size, y: y - size, width: size * 2, height: size * 2, rx: 1.5 }, g);
    if (kind === 'diamond') return el('path', { ...a, d: `M${x} ${y - size - 1}L${x + size + 1} ${y}L${x} ${y + size + 1}L${x - size - 1} ${y}Z` }, g);
    return el('circle', { ...a, cx: x, cy: y, r: size }, g);
  }

  // ───────── Gráfico 1: NDVI por zona + eventos comunitarios ─────────
  function ndviChart(host, a) {
    const W = host.clientWidth, H = 250, m = { t: 26, r: 92, b: 28, l: 44 };
    const [y0, y1] = a.period;
    const vals = a.zones.flatMap(z => z.series.map(p => p.value));
    const lo = Math.floor(Math.min(...vals) * 10) / 10, hi = Math.ceil(Math.max(...vals) * 10) / 10;
    // cada año ocupa una franja; el punto va en su centro (deja sitio a las barras de lluvia)
    const step = (W - m.l - m.r) / (y1 - y0 + 1);
    const x = yr => m.l + step * (yr - y0 + 0.5);
    const y = v => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b);
    const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'NDVI por zona 2019–2025 con eventos de la comunidad' }, host);

    // Eventos de la comunidad (bandas y marcas)
    const ev = el('g', { class: 'viz-events' }, svg);
    a.events.forEach(e => {
      const xa = x(e.from) - step * 0.42, xb = x(e.to) + step * 0.42;
      el('rect', { x: xa, y: m.t, width: xb - xa, height: H - m.t - m.b, class: e.from === e.to ? 'viz-event' : 'viz-event viz-event--span' }, ev);
    });
    const years = [...new Set(a.events.flatMap(e => e.from === e.to ? [e.from] : []))];
    years.forEach(yr => {
      el('path', { d: `M${x(yr)} ${m.t - 10}V${H - m.b}`, class: 'viz-event-line' }, ev);
      el('circle', { cx: x(yr), cy: m.t - 12, r: 3.5, class: 'viz-event-dot' }, ev);
    });

    // Rejilla y ejes
    const grid = el('g', { class: 'viz-grid' }, svg);
    for (let v = lo; v <= hi + 1e-9; v += 0.1) {
      el('path', { d: `M${m.l} ${y(v)}H${W - m.r}` }, grid);
      el('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'viz-axis' }, svg).textContent = fmt(v, 1);
    }
    for (let yr = y0; yr <= y1; yr++) el('text', { x: x(yr), y: H - 8, 'text-anchor': 'middle', class: 'viz-axis' }, svg).textContent = yr;

    // Series
    a.zones.forEach(z => {
      const pts = z.series.filter(p => p.value != null);
      el('path', { d: pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.year)} ${y(p.value)}`).join(''), class: 'viz-line', stroke: SERIES[z.id] }, svg);
      const mk = el('g', {}, svg);
      pts.forEach(p => marker(mk, MARK[z.id], x(p.year), y(p.value), SERIES[z.id]));
      const last = pts[pts.length - 1];
      el('text', { x: x(last.year) + 12, y: y(last.value) + 4, class: 'viz-label' }, svg).textContent = z.id;
    });

    // Cursor y tooltip
    const cross = el('path', { class: 'viz-cross', d: '' }, svg);
    const hit = el('rect', { x: m.l, y: 0, width: W - m.l - m.r, height: H, fill: 'transparent' }, svg);
    hit.addEventListener('mousemove', e => {
      const r = svg.getBoundingClientRect();
      const yr = Math.max(y0, Math.min(y1, y0 + Math.floor((e.clientX - r.left - m.l) / step)));
      cross.setAttribute('d', `M${x(yr)} ${m.t}V${H - m.b}`);
      const rows = a.zones.map(z => {
        const p = z.series.find(s => s.year === yr);
        return `<div class="viz-tip__row"><i style="background:${SERIES[z.id]}"></i>${esc(z.label)}<b>${p && p.value != null ? fmt(p.value, 3) : '—'}</b></div>`;
      }).join('');
      const evs = a.events.filter(ev2 => ev2.from <= yr && yr <= ev2.to).map(ev2 => `<li>${esc(ev2.event)}</li>`).join('');
      showTip(`<strong>${yr}</strong>${rows}${evs ? `<p class="viz-tip__sub">Comunidad</p><ul>${evs}</ul>` : ''}`, e.clientX, e.clientY);
    });
    hit.addEventListener('mouseleave', () => { cross.setAttribute('d', ''); hideTip(); });
    return { x, m, W, step };
  }

  // ───────── Gráfico 2: lluvia anual (mismo eje de años) ─────────
  function rainChart(host, a, ref) {
    const { x, m, W, step } = ref;
    const H = 130, b = 24, t = 16;
    const rain = a.climate.rain;
    const max = Math.ceil(Math.max(...rain.map(r => r.value)) / 500) * 500;
    const y = v => t + (1 - v / max) * (H - t - b);
    const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Lluvia anual estimada 2019–2025' }, host);
    const grid = el('g', { class: 'viz-grid' }, svg);
    for (let v = 0; v <= max; v += 500) {
      el('path', { d: `M${m.l} ${y(v)}H${W - m.r}` }, grid);
      el('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'viz-axis' }, svg).textContent = fmt(v, 0);
    }
    const bw = Math.min(36, step * 0.45);
    rain.forEach(r => {
      const h = y(0) - y(r.value);
      const g = el('g', { class: 'viz-bar' + (r.year === a.climate.wet.year ? ' is-wet' : '') }, svg);
      // barra con extremo redondeado arriba, anclada a la base
      const x0 = x(r.year) - bw / 2, top = y(r.value), rr = Math.min(4, h);
      el('path', { d: `M${x0} ${y(0)}V${top + rr}Q${x0} ${top} ${x0 + rr} ${top}H${x0 + bw - rr}Q${x0 + bw} ${top} ${x0 + bw} ${top + rr}V${y(0)}Z` }, g);
      el('rect', { x: x0 - 6, y: t, width: bw + 12, height: H - t - b, fill: 'transparent' }, g)
        .addEventListener('mousemove', e => showTip(`<strong>${r.year}</strong><div class="viz-tip__row">Lluvia estimada<b>${fmt(r.value, 0)} mm</b></div>`, e.clientX, e.clientY));
      g.addEventListener('mouseleave', hideTip);
    });
    const w = a.climate.wet;
    el('text', { x: x(w.year), y: y(w.value) - 6, 'text-anchor': 'middle', class: 'viz-label' }, svg).textContent = `${fmt(w.value, 0)} mm`;
  }

  // ───────── Gráfico 3: calidad MODIS (válidas frente a totales) ─────────
  function qualityChart(host, a) {
    const W = host.clientWidth, H = 150, m = { t: 14, r: 12, b: 24, l: 36 };
    const rows = a.quality.modis;
    const years = rows[0].rows.map(r => r.year);
    const max = Math.max(...rows.flatMap(s => s.rows.map(r => r.total)));
    const gw = (W - m.l - m.r) / years.length;
    const bw = Math.min(14, gw / 2 - 4);
    const y = v => m.t + (1 - v / max) * (H - m.t - m.b);
    const svg = el('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Observaciones MODIS válidas frente a totales por año' }, host);
    const grid = el('g', { class: 'viz-grid' }, svg);
    [0, max / 2, max].forEach(v => {
      el('path', { d: `M${m.l} ${y(v)}H${W - m.r}` }, grid);
      el('text', { x: m.l - 6, y: y(v) + 4, 'text-anchor': 'end', class: 'viz-axis' }, svg).textContent = Math.round(v);
    });
    years.forEach((yr, i) => {
      const cx = m.l + gw * i + gw / 2;
      rows.forEach((s, j) => {
        const r = s.rows[i];
        const x0 = cx + (j ? 2 : -bw - 2);
        const g = el('g', {}, svg);
        el('rect', { x: x0, y: y(r.total), width: bw, height: y(0) - y(r.total), rx: 3, class: 'viz-q-total' }, g);
        if (r.valid) el('rect', { x: x0, y: y(r.valid), width: bw, height: y(0) - y(r.valid), rx: 3, fill: SERIES[s.id] }, g);
        g.addEventListener('mousemove', e => showTip(`<strong>${s.id} · ${yr}</strong><div class="viz-tip__row">Válidas<b>${r.valid} de ${r.total}</b></div>`, e.clientX, e.clientY));
        g.addEventListener('mouseleave', hideTip);
      });
      el('text', { x: cx, y: H - 6, 'text-anchor': 'middle', class: 'viz-axis' }, svg).textContent = yr;
    });
  }

  // ───────── Vista completa ─────────
  function render(root, a) {
    const [y0, y1] = a.period;
    root.innerHTML = `
      <header class="an-head">
        <p class="an-kicker">Análisis integrado · ${y0}–${y1} · Satélite NASA + memoria de la comunidad</p>
        <h2>${esc(a.headline.title)}</h2>
        ${a.headline.text.map(t => `<p class="an-lead">${esc(t)}</p>`).join('')}
      </header>

      <section class="an-block">
        <p class="an-title">Las preguntas del reto</p>
        <div class="an-questions">
          ${a.questions.map(q => `<article><p class="an-q">${esc(q.q)}</p><p class="an-a">${esc(q.a)}</p><p class="an-d">${esc(q.detail)}</p></article>`).join('')}
        </div>
      </section>

      <section class="an-block">
        <div class="an-row">
          <p class="an-title">Dos cielos en el mismo eje de años</p>
          <div class="an-legend">
            ${a.zones.map(z => `<span><i class="an-sw an-sw--${MARK[z.id]}" style="background:${SERIES[z.id]}"></i>${esc(z.label)}</span>`).join('')}
            <span><i class="an-sw an-sw--event"></i>Evento de la comunidad</span>
          </div>
        </div>
        <p class="an-sub">NDVI mediano mayo–octubre · ${esc(a.provenance.landsat)}</p>
        <div class="an-chart" id="anNdvi"></div>
        <p class="an-sub">Lluvia anual estimada (mm) · ${esc(a.climate.provenance)}</p>
        <div class="an-chart" id="anRain"></div>
        <p class="an-note">${esc(a.climate.note)} Temperatura media entre ${fmt(a.climate.tRange[0], 1)} y ${fmt(a.climate.tRange[1], 1)} °C, sin tendencia clara.</p>
        <p class="an-note">El NDVI del ROI (~0,8) no es comparable con el de P1 o P2: son áreas distintas.</p>
      </section>

      <div class="an-grid">
        <section class="an-block">
          <p class="an-title">Tendencia por zona</p>
          <table class="an-table">
            <thead><tr><th>Zona</th><th>NDVI ${y0}</th><th>NDVI ${y1}</th><th>Pendiente /año</th><th>IC 95 %</th><th>p</th></tr></thead>
            <tbody>
              ${a.zones.map(z => `<tr>
                <td><i class="an-sw an-sw--${MARK[z.id]}" style="background:${SERIES[z.id]}"></i>${esc(z.label)}<small>${esc(z.verdict)}</small></td>
                <td>${fmt(z.first.value, 3)}</td><td>${fmt(z.last.value, 3)}</td>
                <td>${signed(z.trend.slope_per_year, 4)}</td>
                <td>${signed(z.trend.ci95[0], 4)} a ${signed(z.trend.ci95[1], 4)}</td>
                <td>${fmt(z.trend.p, 3)}</td></tr>`).join('')}
            </tbody>
          </table>
          <p class="an-note">Theil–Sen y prueba de Kendall, n = ${a.zones[0].trend.n} años. «Robusto» exige p &lt; 0,05 aun quitando cualquier año.</p>
        </section>

        <section class="an-block">
          <p class="an-title">¿Cuánto confiar en los datos?</p>
          <p class="an-sub">MODIS · observaciones válidas (color) frente a totales (gris) · ${esc(a.provenance.modis)}</p>
          <div class="an-chart" id="anQuality"></div>
          <p class="an-note">MODIS: ${a.quality.valid} de ${a.quality.total} observaciones pasan el filtro (${a.quality.modis.map(q => `${q.id}: ${q.valid} de ${q.total}`).join(' · ')}). Landsat cubre el ${fmt(a.quality.landsatCoverage[0], 1)}–${fmt(a.quality.landsatCoverage[1], 1)} % del ROI cada año.</p>
        </section>
      </div>

      <div class="an-grid">
        <section class="an-block">
          <p class="an-title">Límites</p>
          <ul class="an-list">${a.limits.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
        </section>
        <section class="an-block">
          <p class="an-title">Siguiente paso</p>
          <ul class="an-list an-list--next">${a.next.map(l => `<li>${esc(l)}</li>`).join('')}</ul>
        </section>
      </div>`;

    const ref = ndviChart(root.querySelector('#anNdvi'), a);
    rainChart(root.querySelector('#anRain'), a, ref);
    qualityChart(root.querySelector('#anQuality'), a);
  }

  window.KatouwaAnalysis = { render };
})();
