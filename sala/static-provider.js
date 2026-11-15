/**
 * Proveedor local: convierte el paquete validado (sala/data/katouwa-data.js,
 * generado desde data/nasa/) en las mismas respuestas que debe dar el backend
 * (docs/API.md). Si el backend está configurado, este archivo no se usa.
 */
(() => {
  const D = window.KATOUWA_DATA;
  const P = D.provenance;
  const [Y0, Y1] = D.period;

  const fmt = (v, d) => Number(v).toLocaleString('es', { minimumFractionDigits: d, maximumFractionDigits: d });
  const signed = (v, d) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), d);

  // Traducción al español de las afirmaciones históricas (el CSV original está en inglés)
  const HISTORICAL_ES = {
    '2006–2007|Community perception study': {
      event: 'Estudio de percepción comunitaria',
      finding: 'Encuesta a 50 personas / hogares de Capitán Chico sobre cómo perciben los efectos de la destrucción del manglar en su calidad de vida.',
      verification_status: 'Encuesta histórica documentada; no es una medición actual',
    },
    '2007|Mangrove conservation perceptions': {
      event: 'Percepciones sobre la conservación del manglar',
      finding: 'Las personas encuestadas reconocieron la importancia del ecosistema y expresaron la necesidad de apoyo institucional.',
      verification_status: 'Interpretación histórica reportada por la autora de la tesis',
    },
  };

  const santaRosa = {
    id: 'santa-rosa',
    name: 'Santa Rosa de Agua',
    years: [Y0, Y1],
    aoi: [[10.687936, -71.599144], [10.716956, -71.607556], [10.724620, -71.584958], [10.691958, -71.575592]],
    sites: D.sites,
    roi: { id: 'ROI', name: 'Zona candidata ROI', area_ha: D.roi.area_ha, polygon: D.roi.polygon, status: D.roi.status },
    community: {
      records: D.community,
      pendingMessage: 'Pendiente de autorización de la comunidad',
      historical: D.historical.map(h => ({ ...h, ...(HISTORICAL_ES[h.period + '|' + h.event] || {}) })),
      chronology: D.chronology,
    },
  };

  const territories = {
    'santa-rosa': santaRosa,
    donana: { id: 'donana', name: 'Doñana', empty: true, message: 'Doñana: sin datos cargados todavía' },
  };

  // ───────── Ayudas ─────────
  const at = (series, year, key) => {
    const p = series && series.find(r => r.year === year);
    return p && p[key] != null ? p[key] : null;
  };
  const series = (rows, key) => rows.map(r => ({ year: r.year, value: r[key] }));
  const power = year => D.power.find(r => r.year === year);

  function verdict(t) {
    if (!t) return { label: 'Sin tendencia calculable', tone: 'neutral' };
    const stable = t.leave_one_out_p.every(p => p < 0.05);
    const p = fmt(t.p, 3);
    if (t.p < 0.05 && stable) return { label: `${t.slope_per_year > 0 ? 'Aumento' : 'Descenso'} significativo · p = ${p}`, tone: t.slope_per_year > 0 ? 'up' : 'down' };
    if (t.p < 0.05) return { label: `${t.slope_per_year > 0 ? 'Aumento' : 'Descenso'} nominal · p = ${p} · sensible a quitar un año`, tone: 'neutral' };
    return { label: `Cambio no significativo · p = ${p}`, tone: 'neutral' };
  }

  // Memoria del territorio: eventos de la cronología comunitaria que tocan ese año
  function memory(year) {
    const ev = D.chronology.events.filter(e => e.from <= year && year <= e.to);
    return {
      title: `Memoria del territorio · ${year}`,
      provenance: 'Cronología comunitaria',
      kind: 'events',
      events: ev.map(e => ({ period: e.period, event: e.event, impact: e.impact })),
      empty: 'Sin eventos registrados para este año',
      note: D.chronology.status,
    };
  }

  function trendRow(t, label = 'Tendencia (Theil–Sen)') {
    return {
      label,
      text: `${signed(t.slope_per_year, 4)} /año`,
      note: `IC 95 %: ${signed(t.ci95[0], 4)} a ${signed(t.ci95[1], 4)} · p = ${fmt(t.p, 3)} · n = ${t.n}`,
    };
  }

  function climate(year) {
    const c = power(year);
    return {
      title: 'Contexto regional',
      provenance: P.power,
      rows: c ? [
        { label: `Temperatura media ${year}`, value: c.t2m_c, unit: '°C', decimals: 1, series: series(D.power, 't2m_c') },
        { label: `Lluvia anual estimada ${year}`, value: c.rain_mm, unit: 'mm', decimals: 0, series: series(D.power, 'rain_mm') },
      ] : [{ label: 'Sin dato', text: '—' }],
    };
  }

  const t2mSignal = { id: 'power-t2m', label: 'Temperatura media · POWER', provenance: P.power, unit: '°C', decimals: 1, series: series(D.power, 't2m_c') };

  // ───────── Lecturas ─────────
  function siteReading(id, year) {
    const site = D.sites.find(s => s.id === id);
    const mo = D.landsat.may_oct[id], fy = D.landsat.full_year[id];
    const t = D.landsat.trends[id];
    const m = D.modis[id];
    const ndviM = at(m.series.NDVI, year, 'median'), eviM = at(m.series.EVI, year, 'median');
    const nM = at(m.series.NDVI, year, 'count');
    const valid = m.quality.reduce((s, q) => s + q.valid, 0), total = m.quality.reduce((s, q) => s + q.total, 0);

    return {
      id, kind: 'site', year,
      title: `Punto ${id} · Capitán Chico`,
      subtitle: site.status,
      location: [site.lat, site.lon],
      verdict: verdict(t),
      sections: [
        {
          title: 'Landsat · mayo–octubre',
          provenance: P.landsat,
          rows: [
            { label: `NDVI ${year}`, value: at(mo, year, 'ndvi'), decimals: 3, series: series(mo, 'ndvi') },
            trendRow(t),
            { label: `Todo el año ${year} (sensibilidad)`, value: at(fy, year, 'ndvi'), decimals: 3 },
          ],
        },
        {
          title: 'MODIS · calidad estricta',
          provenance: P.modis,
          rows: [
            { label: `NDVI ${year}`, value: ndviM, decimals: 3, note: nM != null ? `${nM} obs. válidas` : null },
            { label: `EVI ${year}`, value: eviM, decimals: 3 },
            { label: 'Datos que pasan el filtro', text: `${valid} de ${total}` },
          ],
        },
        climate(year),
        memory(year),
      ],
      notes: [
        'Un cambio de NDVI no prueba mortandad, contaminación ni recuperación.',
        'MODIS (250 m) puede mezclar agua, vegetación y construcciones.',
      ],
      signals: [
        { id: 'landsat-mo', label: `NDVI Landsat ${id} · may–oct`, provenance: P.landsat, decimals: 3, series: series(mo, 'ndvi') },
        { id: 'landsat-fy', label: `NDVI Landsat ${id} · año completo`, provenance: P.landsat, decimals: 3, series: series(fy, 'ndvi') },
        { id: 'modis-ndvi', label: `NDVI MODIS ${id}`, provenance: P.modis, decimals: 3, series: m.series.NDVI.map(r => ({ year: r.year, value: r.median })) },
        { id: 'modis-evi', label: `EVI MODIS ${id}`, provenance: P.modis, decimals: 3, series: m.series.EVI.map(r => ({ year: r.year, value: r.median })) },
        t2mSignal,
      ],
      source: 'static',
    };
  }

  function roiReading(year) {
    const r = D.roi, t = r.trend;
    const row = r.rows.find(x => x.year === year);
    const coverage = row ? (row.observed_area_ha / r.area_ha) * 100 : null;
    return {
      id: 'ROI', kind: 'roi', year,
      title: `Zona candidata ROI · ${fmt(r.area_ha, 2)} ha`,
      subtitle: r.status,
      location: null,
      verdict: verdict(t),
      evidence: {
        sentence: t.p >= 0.05 ? 'Cambio no significativo' : 'Cambio estadísticamente significativo',
        items: [
          { label: 'Periodo', text: `${t.first_year}–${t.last_year} · may–oct` },
          { label: 'n', text: `${t.n} años` },
          { label: 'Pendiente', text: `${signed(t.slope_per_year, 4)} /año` },
          { label: 'IC 95 %', text: `${signed(t.ci95[0], 4)} a ${signed(t.ci95[1], 4)}` },
          { label: 'p (Kendall)', text: fmt(t.p, 3) },
          { label: `Cobertura ${year}`, text: coverage != null ? `${fmt(coverage, 1)} %` : '—' },
        ],
      },
      sections: [
        {
          title: 'Landsat · mayo–octubre',
          provenance: P.landsat,
          rows: [
            { label: `NDVI mediano ${year}`, value: row && row.ndvi_median, decimals: 3, series: series(r.rows, 'ndvi_median') },
            { label: `Área observada ${year}`, text: row ? `${fmt(row.observed_area_ha, 2)} de ${fmt(r.area_ha, 2)} ha` : '—' },
            { label: `Escenas ${year}`, value: row && row.scene_count, decimals: 0 },
          ],
        },
        climate(year),
        memory(year),
      ],
      notes: [
        'El paquete no incluye el polígono del ROI: por eso no se dibuja en el mapa.',
        'Su NDVI (~0,8) no es comparable con el de P1 o P2.',
        'Aumento modesto y no significativo: no presentarlo como recuperación.',
      ],
      signals: [
        { id: 'roi-ndvi', label: 'NDVI mediano del ROI', provenance: P.landsat, decimals: 3, series: series(r.rows, 'ndvi_median') },
        t2mSignal,
      ],
      source: 'static',
    };
  }

  function waterReading(year, latlon) {
    return {
      id: 'WATER', kind: 'water', year,
      title: 'Lago de Maracaibo',
      subtitle: 'Sin datos satelitales del agua en este paquete',
      location: latlon,
      verdict: { label: 'Sin datos del agua todavía', tone: 'none' },
      sections: [
        {
          title: 'Siguiente paso',
          provenance: 'Landsat · pendiente',
          rows: [
            { label: 'NDWI', text: '—', note: 'Pendiente' },
            { label: 'Temperatura superficial del agua', text: '—', note: 'Pendiente' },
          ],
        },
        climate(year),
        memory(year),
      ],
      notes: [],
      signals: [t2mSignal],
      source: 'static',
    };
  }

  // ───────── Análisis integrado: NASA + comunidad ─────────
  function analysis() {
    const zones = [
      { id: 'ROI', label: 'Zona candidata ROI', note: '~20 ha · Landsat may–oct', series: series(D.roi.rows, 'ndvi_median'), trend: D.roi.trend },
      ...['P1', 'P2'].map(id => ({
        id, label: `Punto ${id}`, note: 'Landsat may–oct',
        series: series(D.landsat.may_oct[id], 'ndvi'),
        trend: D.landsat.trends[id],
      })),
    ].map(z => {
      const v = verdict(z.trend);
      const first = z.series[0], last = z.series[z.series.length - 1];
      return { ...z, first, last, verdict: v.label, robust: v.tone !== 'neutral' };
    });

    const events = D.chronology.events
      .filter(e => e.to >= Y0 && e.from <= Y1)
      .map(e => ({ from: Math.max(e.from, Y0), to: Math.min(e.to, Y1), period: e.period, event: e.event, impact: e.impact }));

    const rain = D.power.map(r => ({ year: r.year, value: r.rain_mm }));
    const wet = rain.reduce((a, b) => (b.value > a.value ? b : a));
    const dry = rain.reduce((a, b) => (b.value < a.value ? b : a));
    const wetEvents = events.filter(e => e.from === wet.year && e.to === wet.year);
    const t2m = D.power.map(r => r.t2m_c);

    const quality = ['P1', 'P2'].map(id => ({
      id, rows: D.modis[id].quality,
      valid: D.modis[id].quality.reduce((s, q) => s + q.valid, 0),
      total: D.modis[id].quality.reduce((s, q) => s + q.total, 0),
    }));
    const qValid = quality.reduce((s, q) => s + q.valid, 0), qTotal = quality.reduce((s, q) => s + q.total, 0);
    const cov = D.roi.rows.map(r => (r.observed_area_ha / D.roi.area_ha) * 100);

    const byId = Object.fromEntries(zones.map(z => [z.id, z]));
    const tx = z => `${signed(z.trend.slope_per_year, 4)}/año (p = ${fmt(z.trend.p, 3)})`;
    const lost = zones.filter(z => z.trend.slope_per_year < 0 && z.robust).length;

    return {
      period: [Y0, Y1],
      headline: {
        title: lost ? 'Hay zonas con pérdida de vegetación' : 'La vegetación se ve estable; la crisis que relata la comunidad está sobre todo en el agua y la costa',
        text: [
          `Entre ${Y0} y ${Y1} ${lost ? 'algunas zonas' : 'ninguna de las tres zonas'} muestra${lost ? 'n' : ''} una pérdida de vegetación detectable por satélite: ROI ${tx(byId.ROI)}, P2 ${tx(byId.P2)} y P1 ${tx(byId.P1)}, este último frágil porque depende de un solo año.`,
          `En esos mismos años la comunidad registra ${events.length} eventos: ${events.map(e => e.event.toLowerCase()).slice(0, 4).join('; ')}. Casi todos ocurren en el agua y la orilla.`,
          'El NDVI mide el verdor de la copa de la vegetación: no ve la calidad del agua, el crudo ni la basura entre las raíces. Que el manglar se vea verde no significa que el territorio esté sano: la brecha entre los dos cielos señala lo que falta medir.',
        ],
      },
      questions: [
        { q: '¿Qué cambió?', a: lost ? 'Hay pérdida de verdor en algunas zonas.' : 'El verdor (NDVI) se mantuvo o subió levemente.', detail: 'Ninguna zona pierde vegetación de forma significativa.' },
        { q: '¿Dónde?', a: `P1 sube más (${fmt(byId.P1.first.value, 3)} → ${fmt(byId.P1.last.value, 3)}).`, detail: `P2 se mantiene (~${fmt(byId.P2.last.value, 2)}); el ROI casi no cambia (${fmt(byId.ROI.first.value, 3)} → ${fmt(byId.ROI.last.value, 3)}).` },
        { q: '¿Cuánto?', a: `Entre ${signed(Math.min(...zones.map(z => z.trend.slope_per_year)), 4)} y ${signed(Math.max(...zones.map(z => z.trend.slope_per_year)), 4)} de NDVI por año.`, detail: 'Pendiente de Theil–Sen sobre 7 años (mayo–octubre).' },
        { q: '¿Es significativo?', a: zones.some(z => z.robust) ? 'Sí, en alguna zona.' : 'No de forma robusta.', detail: `ROI p = ${fmt(byId.ROI.trend.p, 3)}; P2 p = ${fmt(byId.P2.trend.p, 3)}; P1 p = ${fmt(byId.P1.trend.p, 3)}, pero deja de serlo si se quita un año.` },
        { q: '¿Quién ayuda a interpretarlo?', a: 'La comunidad.', detail: `Documenta ${events.length} eventos en ${Y0}–${Y1} (derrames, cianobacterias, inundación, basura) que el NDVI no mide.` },
      ],
      zones,
      events,
      climate: {
        rain, wet, dry,
        tRange: [Math.min(...t2m), Math.max(...t2m)],
        provenance: P.power,
        note: wetEvents.length
          ? `${wet.year} fue el año más lluvioso (${fmt(wet.value, 0)} mm) y coincide con «${wetEvents[0].event.toLowerCase()}» que registra la comunidad. Coincidencia, no prueba de causa.`
          : `${wet.year} fue el año más lluvioso (${fmt(wet.value, 0)} mm).`,
      },
      quality: {
        modis: quality,
        valid: qValid, total: qTotal,
        landsatCoverage: [Math.min(...cov), Math.max(...cov)],
      },
      limits: [
        'No hay datos satelitales del agua (NDWI, temperatura superficial, clorofila).',
        'P1 y P2 los eligió el equipo; el ROI es un área candidata dibujada sobre imágenes recientes.',
        `Solo ${Y1 - Y0 + 1} años: las tendencias son exploratorias.`,
        `MODIS (250 m): solo ${qValid} de ${qTotal} observaciones pasan el control de calidad.`,
        'La cronología comunitaria es un relato documental; varias cifras necesitan fuente.',
      ],
      next: [
        'Medir el agua: NDWI y temperatura superficial con Landsat; clorofila y cianobacterias con sensores de color del agua.',
        'Delimitar el manglar con la comunidad y validarlo en campo.',
        'Alargar la serie con MODIS desde 2000.',
        'Sumar registros comunitarios con consentimiento (plantilla lista).',
      ],
      provenance: P,
      source: 'static',
    };
  }

  window.KATOUWA_STATIC = {
    analysis(territoryId) {
      return territoryId === 'santa-rosa' ? analysis() : null;
    },
    territory(id) {
      const t = territories[id];
      return t ? JSON.parse(JSON.stringify(t)) : null;
    },
    reading(territoryId, targetId, { year = Y1, lat, lon } = {}) {
      if (territoryId !== 'santa-rosa') return null;
      if (targetId === 'ROI') return roiReading(year);
      if (targetId === 'WATER') return waterReading(year, lat != null ? [lat, lon] : null);
      if (D.landsat.may_oct[targetId]) return siteReading(targetId, year);
      return null;
    },
  };
})();
