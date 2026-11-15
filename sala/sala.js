(() => {
  const $ = id => document.getElementById(id);
  const api = window.KATOUWA_API;

  const state = { territory: 'santa-rosa', layer: 'ambos', year: 2026, data: null, selection: null };

  const fmt = (v, decimals = 0) =>
    Number(v).toLocaleString('es', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const withUnit = (v, unit, decimals) => unit ? `${fmt(v, decimals)} ${unit}` : fmt(v, decimals);
  const STATUS_LABEL = { saludable: 'Saludable', atencion: 'Atención', critico: 'Crítico' };

  // ───────── Mapa ─────────
  const map = window.KatouwaMap.createMap($('mapSvg'), {
    onZoneClick: (zone, latlon) => selectZone(zone.id, latlon),
    onEmptyClick: () => { clearSelection(); $('pulseEmpty').textContent = 'Elige un manglar o el agua dentro del área'; },
  });

  // ───────── Pulso ─────────
  const pulse = window.KatouwaPulse.createPulse({ wave: $('waveCanvas'), chladni: $('chladniCanvas') });
  pulse.onPlayChange(on => {
    $('playBtn').classList.toggle('is-playing', on);
    $('playBtn').setAttribute('aria-label', on ? 'Detener sonificación' : 'Reproducir sonificación');
  });
  $('playBtn').addEventListener('click', () => pulse.toggle());
  $('chladniToggle').addEventListener('change', e => {
    const on = e.target.checked;
    $('waveCanvas').hidden = on;
    $('chladniCanvas').hidden = !on;
    pulse.setMode(on ? 'chladni' : 'wave');
  });

  // ───────── Carga de datos ─────────
  function setStatus(source, error) {
    const el = $('sourceStatus');
    if (source === 'api') el.innerHTML = `Fuente: <b>backend</b><br>${new URL(api.baseUrl, location.href).host}`;
    else el.innerHTML = `Fuente: <b>datos de prueba</b>${error ? '<br>Backend sin respuesta' : ''}`;
  }

  async function loadTerritory({ keepSelection = false } = {}) {
    const { data, source, error } = await api.getTerritory(state.territory, { year: state.year });
    state.data = data;
    setStatus(source, error);
    $('legendVeg').textContent = data.labels?.vegetation || 'manglar';
    $('legendWater').textContent = data.labels?.water || 'lago';
    map.setTerritory(data, { keepSelection });
    if (keepSelection && state.selection) selectZone(state.selection.zoneId, state.selection.latlon);
    else clearSelection();
  }

  let reqId = 0;
  async function selectZone(zoneId, latlon) {
    state.selection = { zoneId, latlon };
    map.select(zoneId, latlon);
    const id = ++reqId;
    const { data } = await api.getZoneReading(state.territory, zoneId, { year: state.year, lat: latlon[0], lon: latlon[1] });
    if (id !== reqId || !data) return;
    renderCard(data);
    renderPulse(data);
  }

  function clearSelection() {
    state.selection = null;
    reqId++;
    map.clear();
    $('zoneCard').hidden = true;
    $('pulseLive').hidden = true;
    $('pulseEmpty').hidden = false;
    $('pulseEmpty').textContent = 'Selecciona un punto del mapa';
    pulse.hide();
  }

  // ───────── Tarjeta ─────────
  function sparkline(series, color) {
    const vals = series.map(p => p.value);
    const min = Math.min(...vals), max = Math.max(...vals);
    const W = 300, H = 34, pad = 3;
    const x = i => pad + (i / Math.max(1, vals.length - 1)) * (W - pad * 2);
    const y = v => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
    const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    const last = vals.length - 1;
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="Serie ${series[0].year}–${series[last].year}">
      <path d="${d}" fill="none" stroke="${color}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      <circle cx="${x(last)}" cy="${y(vals[last])}" r="3" fill="${color}"/>
    </svg>`;
  }

  function row(label, value, extra = '') {
    return `<div><dt>${label}</dt><dd>${value}</dd>${extra}</div>`;
  }

  function renderCard(r) {
    const color = r.health.status === 'saludable' ? '#5FD39A' : '#E5604D';
    $('zcTitle').textContent = r.title;
    const badge = $('zcBadge');
    badge.className = `badge badge--${r.health.status}`;
    badge.innerHTML = `${STATUS_LABEL[r.health.status] || r.health.status} <b>${r.health.score}/100</b>`;

    $('zcRows').innerHTML = r.metrics.map(m =>
      row(m.label, withUnit(m.value, m.unit, m.decimals ?? 0), m.series && m.series.length > 1 ? sparkline(m.series, color) : '')
    ).join('');

    const reg = r.regional;
    $('zcRegionalTitle').textContent = `Contexto regional (~${reg?.radiusKm ?? 50} km)`;
    $('zcRegionalTitle').hidden = !reg;
    $('zcRegional').innerHTML = reg ? reg.values.map(v => row(v.label, withUnit(v.value, v.unit, v.decimals ?? 0))).join('') : '';

    $('zcMock').hidden = !r.isMock;
    $('zoneCard').hidden = false;
  }

  // ───────── Pulso ─────────
  function renderPulse(r) {
    const healthy = r.health.status === 'saludable';
    $('pulseEmpty').hidden = true;
    $('pulseLive').hidden = false;
    $('pulseCaption').textContent = healthy ? 'Sonificación de los datos de esta zona' : 'Más distorsión = menos salud';
    $('chladniToggleWrap').hidden = healthy;
    if (healthy && $('chladniToggle').checked) {
      $('chladniToggle').checked = false;
      $('waveCanvas').hidden = false;
      $('chladniCanvas').hidden = true;
      pulse.setMode('wave');
    }
    pulse.show(r.health);
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
  radioGroup($('layerSwitch'), 'data-layer', l => { state.layer = l; map.setLayer(l); });

  const year = $('year');
  const paintYear = () => {
    $('yearOut').textContent = year.value;
    year.style.setProperty('--fill', `${((year.value - year.min) / (year.max - year.min)) * 100}%`);
  };
  year.addEventListener('input', paintYear);
  year.addEventListener('change', () => { state.year = Number(year.value); loadTerritory({ keepSelection: true }); });
  paintYear();

  $('zcClose').addEventListener('click', clearSelection);
  document.addEventListener('keydown', e => e.key === 'Escape' && clearSelection());

  loadTerritory();
})();
