(() => {
  const $ = id => document.getElementById(id);
  const api = window.KATOUWA_API;

  const state = { territory: 'santa-rosa', layer: 'ambos', year: 2025, data: null, selection: null, reading: null, signalId: null };

  const fmt = (v, d = 0) => Number(v).toLocaleString('es', { minimumFractionDigits: d, maximumFractionDigits: d });
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ───────── Mapa ─────────
  const map = window.KatouwaMap.createMap($('mapSvg'), {
    onSiteClick: (id, latlon) => select(id, latlon),
    onWaterClick: latlon => select('WATER', latlon),
    onEmptyClick: () => {
      clearSelection();
      $('pulseEmpty').textContent = 'Elige P1, P2, la zona ROI o el agua';
    },
  });

  // ───────── Pulso ─────────
  const pulse = window.KatouwaPulse.createPulse({
    wave: $('waveCanvas'),
    chladni: $('chladniCanvas'),
    onStep: note => {
      $('notesRow').querySelectorAll('li').forEach(li => li.classList.toggle('is-on', note && Number(li.dataset.year) === note.year));
    },
    onPlayChange: on => {
      $('playBtn').classList.toggle('is-playing', on);
      $('playBtn').setAttribute('aria-label', on ? 'Detener' : 'Reproducir la serie año por año');
    },
  });
  $('playBtn').addEventListener('click', () => pulse.toggle());
  $('chladniToggle').addEventListener('change', e => {
    const on = e.target.checked;
    $('waveCanvas').hidden = on;
    $('chladniCanvas').hidden = !on;
    pulse.setMode(on ? 'chladni' : 'wave');
  });
  $('signalSelect').addEventListener('change', e => { state.signalId = e.target.value; renderSignal(); });

  // ───────── Carga ─────────
  function setStatus(source, error) {
    const el = $('sourceStatus');
    if (source === 'api') el.innerHTML = `Fuente: <b>backend</b><br>${esc(new URL(api.baseUrl, location.href).host)}`;
    else el.innerHTML = `Fuente: <b>paquete validado 2019–2025</b><br>Landsat · MODIS · POWER${error ? '<br>Backend sin respuesta' : ''}`;
  }

  async function loadTerritory() {
    const { data, source, error } = await api.getTerritory(state.territory);
    state.data = data;
    setStatus(source, error);
    clearSelection();

    $('mapEmpty').hidden = !data.empty;
    $('mapEmpty').textContent = data.message || '';
    $('mapSide').hidden = !!data.empty;
    $('legend').hidden = !!data.empty;
    map.setTerritory(data);
    if (data.empty) return;

    const [y0, y1] = data.years;
    const year = $('year');
    year.min = y0; year.max = y1;
    $('yearMin').textContent = y0; $('yearMax').textContent = y1;
    if (state.year < y0 || state.year > y1) { state.year = y1; year.value = y1; }
    paintYear();

    $('roiChip').hidden = !data.roi;
    if (data.roi) $('roiChipTitle').textContent = `≈ ${fmt(data.roi.area_ha, 2)} ha`;
    renderVoices(data.community);
  }

  let reqId = 0;
  async function select(id, latlon) {
    const sameTarget = state.selection && state.selection.id === id;
    state.selection = { id, latlon };
    map.select(id, latlon);
    $('roiChip').classList.toggle('is-selected', id === 'ROI');
    const req = ++reqId;
    const { data } = await api.getReading(state.territory, id, { year: state.year, lat: latlon && latlon[0], lon: latlon && latlon[1] });
    if (req !== reqId || !data) return;
    state.reading = data;
    renderCard(data);
    renderPulse(data, sameTarget);
  }

  function clearSelection() {
    state.selection = null;
    state.reading = null;
    reqId++;
    map.clear();
    $('roiChip').classList.remove('is-selected');
    $('zoneCard').hidden = true;
    $('pulseLive').hidden = true;
    $('pulseEmpty').hidden = false;
    $('pulseEmpty').textContent = 'Selecciona un punto del mapa';
    pulse.hide();
  }

  // ───────── Voces de la comunidad ─────────
  function renderVoices(c) {
    const n = c && c.records ? c.records.length : 0;
    $('voicesCount').innerHTML = n
      ? `<b>${n}</b> registros con consentimiento`
      : `<b>0</b> registros · ${esc(c ? c.pendingMessage : 'Pendiente de autorización de la comunidad')}`;
    $('voicesHistory').innerHTML = (c && c.historical || []).map(h => `
      <div class="voices-panel__item">
        <span class="voices-panel__period">${esc(h.period)} · Contexto histórico</span>
        <p>${esc(h.finding)}</p>
        <span class="voices-panel__src">${esc(h.source_label)}</span>
      </div>`).join('');
  }

  // ───────── Tarjeta ─────────
  function sparkline(series, year, color) {
    const pts = series.filter(p => p.value != null);
    if (pts.length < 2) return '';
    const vals = pts.map(p => p.value);
    const min = Math.min(...vals), max = Math.max(...vals);
    const y0 = series[0].year, y1 = series[series.length - 1].year;
    const W = 300, H = 34, pad = 4;
    const x = yr => pad + ((yr - y0) / Math.max(1, y1 - y0)) * (W - pad * 2);
    const y = v => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.year).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Serie ${y0}–${y1}">
      <path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      ${pts.map(p => `<circle cx="${x(p.year)}" cy="${y(p.value)}" r="${p.year === year ? 3.2 : 1.4}" fill="${color}" opacity="${p.year === year ? 1 : 0.6}"/>`).join('')}
    </svg>`;
  }

  function valueText(r) {
    if (r.text != null) return esc(r.text);
    if (r.value == null) return '<span class="na">sin dato</span>';
    return `${fmt(r.value, r.decimals ?? 0)}${r.unit ? ' ' + esc(r.unit) : ''}`;
  }

  function renderCard(r) {
    $('zcTitle').textContent = r.title;
    $('zcStatus').textContent = r.subtitle || '';
    const badge = $('zcBadge');
    badge.className = `badge badge--${r.verdict.tone}`;
    badge.textContent = r.verdict.label;

    const ev = $('zcEvidence');
    ev.hidden = !r.evidence;
    if (r.evidence) {
      ev.innerHTML = `<p class="evidence__title">Resumen de evidencia</p>
        <p class="evidence__sentence">${esc(r.evidence.sentence)}</p>
        <dl class="evidence__grid">${r.evidence.items.map(i => `<div><dt>${esc(i.label)}</dt><dd>${esc(i.text)}</dd></div>`).join('')}</dl>`;
    }

    const color = r.kind === 'water' ? '#2F93C4' : '#5FD39A';
    $('zcSections').innerHTML = r.sections.map(sec => `
      <section class="card-sec">
        <header><p class="zone-card__sub">${esc(sec.title)}</p><span class="prov">${esc(sec.provenance || '')}</span></header>
        <dl class="rows">${sec.rows.map(row => `
          <div>
            <dt>${esc(row.label)}${row.note ? `<small>${esc(row.note)}</small>` : ''}</dt>
            <dd>${valueText(row)}</dd>
            ${row.series ? sparkline(row.series, r.year, sec.provenance && sec.provenance.startsWith('NASA POWER') ? '#D9C7A3' : color) : ''}
          </div>`).join('')}
        </dl>
      </section>`).join('');

    $('zcNotes').innerHTML = (r.notes || []).map(n => `<li>${esc(n)}</li>`).join('');
    $('zcSource').textContent = r.source === 'api' ? 'Backend' : 'Paquete validado · 2019–2025';
    $('zoneCard').hidden = false;
  }

  // ───────── Pulso ─────────
  function renderPulse(r, keepSignal) {
    $('pulseEmpty').hidden = true;
    $('pulseLive').hidden = false;
    const sel = $('signalSelect');
    const ids = r.signals.map(s => s.id);
    if (!keepSignal || !ids.includes(state.signalId)) state.signalId = ids[0];
    sel.innerHTML = r.signals.map(s => `<option value="${esc(s.id)}"${s.id === state.signalId ? ' selected' : ''}>${esc(s.label)}</option>`).join('');
    renderSignal();
  }

  function renderSignal() {
    const s = state.reading.signals.find(x => x.id === state.signalId);
    const notes = pulse.setSignal(s, state.year);
    $('notesRow').innerHTML = notes.map(n => `
      <li data-year="${n.year}" class="${n.year === state.year ? 'is-on' : ''}${n.hz == null ? ' is-na' : ''}">
        <span>${n.year}</span>
        <b>${n.value == null ? '—' : fmt(n.value, s.decimals ?? 2)}</b>
        <i>${n.hz == null ? 'sin dato' : n.hz + ' Hz'}</i>
      </li>`).join('');
  }

  // ───────── Controles del riel ─────────
  function radioGroup(container, attr, onChange) {
    container.addEventListener('click', e => {
      const btn = e.target.closest(`[${attr}]`);
      if (!btn || btn.getAttribute('aria-checked') === 'true') return;
      container.querySelectorAll(`[${attr}]`).forEach(b => b.setAttribute('aria-checked', String(b === btn)));
      onChange(btn.getAttribute(attr));
    });
  }

  radioGroup($('territorySwitch'), 'data-territory', t => { state.territory = t; loadTerritory(); });
  radioGroup($('layerSwitch'), 'data-layer', l => { state.layer = l; map.setLayer(l); $('mapSide').dataset.layer = l; });

  const year = $('year');
  function paintYear() {
    $('yearOut').textContent = year.value;
    year.style.setProperty('--fill', `${((year.value - year.min) / (year.max - year.min)) * 100}%`);
  }
  year.addEventListener('input', () => {
    paintYear();
    state.year = Number(year.value);
    if (state.selection) select(state.selection.id, state.selection.latlon);
  });

  $('roiChip').addEventListener('click', () => select('ROI', null));
  $('zcClose').addEventListener('click', clearSelection);
  document.addEventListener('keydown', e => e.key === 'Escape' && clearSelection());

  $('mapSide').dataset.layer = state.layer;
  loadTerritory();
})();
