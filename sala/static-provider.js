/**
 * Local provider: turns the validated package (sala/data/katouwa-data.js,
 * built from data/nasa/) into the same responses the backend must return
 * (docs/API.md). When a backend is configured, this file is not used.
 */
(() => {
  const D = window.KATOUWA_DATA;
  const P = D.provenance;
  const [Y0, Y1] = D.period;

  const fmt = (v, d) => Number(v).toLocaleString('en', { minimumFractionDigits: d, maximumFractionDigits: d });
  const signed = (v, d) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v), d);

  const santaRosa = {
    id: 'santa-rosa',
    name: 'Santa Rosa de Agua',
    years: [Y0, Y1],
    aoi: [[10.687936, -71.599144], [10.716956, -71.607556], [10.724620, -71.584958], [10.691958, -71.575592]],
    sites: D.sites,
    roi: { id: 'ROI', name: 'Candidate ROI area', area_ha: D.roi.area_ha, polygon: D.roi.polygon, status: D.roi.status },
    community: {
      records: D.community,
      pendingMessage: 'Pending community authorization',
      historical: D.historical,
      chronology: D.chronology,
    },
  };

  const territories = {
    'santa-rosa': santaRosa,
    donana: { id: 'donana', name: 'Doñana', empty: true, message: 'Doñana: no data loaded yet' },
  };

  // ───────── Helpers ─────────
  const at = (series, year, key) => {
    const p = series && series.find(r => r.year === year);
    return p && p[key] != null ? p[key] : null;
  };
  const series = (rows, key) => rows.map(r => ({ year: r.year, value: r[key] }));
  const power = year => D.power.find(r => r.year === year);

  function verdict(t) {
    if (!t) return { label: 'No trend can be computed', tone: 'neutral' };
    const stable = t.leave_one_out_p.every(p => p < 0.05);
    const p = fmt(t.p, 3);
    if (t.p < 0.05 && stable) return { label: `Significant ${t.slope_per_year > 0 ? 'increase' : 'decrease'} · p = ${p}`, tone: t.slope_per_year > 0 ? 'up' : 'down' };
    if (t.p < 0.05) return { label: `Nominal ${t.slope_per_year > 0 ? 'increase' : 'decrease'} · p = ${p} · sensitive to removing one year`, tone: 'neutral' };
    return { label: `Non-significant change · p = ${p}`, tone: 'neutral' };
  }

  // Memory of the territory: community chronology events that touch that year
  function memory(year) {
    const ev = D.chronology.events.filter(e => e.from <= year && year <= e.to);
    return {
      title: `Memory of the territory · ${year}`,
      provenance: 'Community chronology',
      kind: 'events',
      events: ev.map(e => ({ period: e.period, event: e.event, impact: e.impact })),
      empty: 'No events recorded for this year',
      note: D.chronology.status,
    };
  }

  function trendRow(t, label = 'Trend (Theil–Sen)') {
    return {
      label,
      text: `${signed(t.slope_per_year, 4)} /yr`,
      note: `95% CI: ${signed(t.ci95[0], 4)} to ${signed(t.ci95[1], 4)} · p = ${fmt(t.p, 3)} · n = ${t.n}`,
    };
  }

  function climate(year) {
    const c = power(year);
    return {
      title: 'Regional context',
      provenance: P.power,
      rows: c ? [
        { label: `Mean temperature ${year}`, value: c.t2m_c, unit: '°C', decimals: 1, series: series(D.power, 't2m_c') },
        { label: `Estimated annual rainfall ${year}`, value: c.rain_mm, unit: 'mm', decimals: 0, series: series(D.power, 'rain_mm') },
      ] : [{ label: 'No data', text: '—' }],
    };
  }

  const t2mSignal = { id: 'power-t2m', label: 'Mean temperature · POWER', provenance: P.power, unit: '°C', decimals: 1, series: series(D.power, 't2m_c') };

  // ───────── Readings ─────────
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
      title: `Point ${id} · Capitán Chico`,
      subtitle: site.status,
      location: [site.lat, site.lon],
      verdict: verdict(t),
      sections: [
        {
          title: 'Landsat · May–October',
          provenance: P.landsat,
          rows: [
            { label: `NDVI ${year}`, value: at(mo, year, 'ndvi'), decimals: 3, series: series(mo, 'ndvi') },
            trendRow(t),
            { label: `Full year ${year} (sensitivity)`, value: at(fy, year, 'ndvi'), decimals: 3 },
          ],
        },
        {
          title: 'MODIS · strict quality',
          provenance: P.modis,
          rows: [
            { label: `NDVI ${year}`, value: ndviM, decimals: 3, note: nM != null ? `${nM} valid obs.` : null },
            { label: `EVI ${year}`, value: eviM, decimals: 3 },
            { label: 'Observations passing the filter', text: `${valid} of ${total}` },
          ],
        },
        climate(year),
        memory(year),
      ],
      notes: [
        'An NDVI change does not prove die-off, pollution or recovery.',
        'MODIS (250 m) can mix water, vegetation and buildings.',
      ],
      signals: [
        { id: 'landsat-mo', label: `NDVI Landsat ${id} · May–Oct`, provenance: P.landsat, decimals: 3, series: series(mo, 'ndvi') },
        { id: 'landsat-fy', label: `NDVI Landsat ${id} · full year`, provenance: P.landsat, decimals: 3, series: series(fy, 'ndvi') },
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
      title: `Candidate ROI area · ${fmt(r.area_ha, 2)} ha`,
      subtitle: r.status,
      location: null,
      verdict: verdict(t),
      evidence: {
        sentence: t.p >= 0.05 ? 'Non-significant change' : 'Statistically significant change',
        items: [
          { label: 'Period', text: `${t.first_year}–${t.last_year} · May–Oct` },
          { label: 'n', text: `${t.n} years` },
          { label: 'Slope', text: `${signed(t.slope_per_year, 4)} /yr` },
          { label: '95% CI', text: `${signed(t.ci95[0], 4)} to ${signed(t.ci95[1], 4)}` },
          { label: 'p (Kendall)', text: fmt(t.p, 3) },
          { label: `Coverage ${year}`, text: coverage != null ? `${fmt(coverage, 1)}%` : '—' },
        ],
      },
      sections: [
        {
          title: 'Landsat · May–October',
          provenance: P.landsat,
          rows: [
            { label: `Median NDVI ${year}`, value: row && row.ndvi_median, decimals: 3, series: series(r.rows, 'ndvi_median') },
            { label: `Observed area ${year}`, text: row ? `${fmt(row.observed_area_ha, 2)} of ${fmt(r.area_ha, 2)} ha` : '—' },
            { label: `Scenes ${year}`, value: row && row.scene_count, decimals: 0 },
          ],
        },
        climate(year),
        memory(year),
      ],
      notes: [
        'The package does not include the ROI polygon, so it is not drawn on the map.',
        'Its NDVI (~0.8) is not comparable with P1 or P2.',
        'A modest, non-significant increase: do not present it as recovery.',
      ],
      signals: [
        { id: 'roi-ndvi', label: 'ROI median NDVI', provenance: P.landsat, decimals: 3, series: series(r.rows, 'ndvi_median') },
        t2mSignal,
      ],
      source: 'static',
    };
  }

  function waterReading(year, latlon) {
    return {
      id: 'WATER', kind: 'water', year,
      title: 'Lake Maracaibo',
      subtitle: 'No satellite water data in this package',
      location: latlon,
      verdict: { label: 'No water data yet', tone: 'none' },
      sections: [
        {
          title: 'Next step',
          provenance: 'Landsat · pending',
          rows: [
            { label: 'NDWI', text: '—', note: 'Pending' },
            { label: 'Water surface temperature', text: '—', note: 'Pending' },
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

  // ───────── Integrated analysis: NASA + community ─────────
  function analysis() {
    const zones = [
      { id: 'ROI', label: 'Candidate ROI area', note: '~20 ha · Landsat May–Oct', series: series(D.roi.rows, 'ndvi_median'), trend: D.roi.trend },
      ...['P1', 'P2'].map(id => ({
        id, label: `Point ${id}`, note: 'Landsat May–Oct',
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
    const tx = z => `${signed(z.trend.slope_per_year, 4)}/yr (p = ${fmt(z.trend.p, 3)})`;
    const lost = zones.filter(z => z.trend.slope_per_year < 0 && z.robust).length;

    return {
      period: [Y0, Y1],
      headline: {
        title: lost ? 'Some areas show vegetation loss' : 'Vegetation looks stable; the crisis the community describes is mostly in the water and along the shore',
        text: [
          `Between ${Y0} and ${Y1}, ${lost ? 'some areas show' : 'none of the three areas shows'} a satellite-detectable vegetation loss: ROI ${tx(byId.ROI)}, P2 ${tx(byId.P2)} and P1 ${tx(byId.P1)}, the latter fragile because it depends on a single year.`,
          `Over the same years the community records ${events.length} events: ${events.map(e => e.event.charAt(0).toLowerCase() + e.event.slice(1)).slice(0, 4).join('; ')}. Almost all of them happen in the water and along the shore.`,
          'NDVI measures the greenness of the vegetation canopy: it does not see water quality, crude oil or the waste trapped among the roots. A green mangrove does not mean a healthy territory: the gap between the two skies shows what still needs to be measured.',
        ],
      },
      questions: [
        { q: 'What changed?', a: lost ? 'Greenness decreased in some areas.' : 'Greenness (NDVI) stayed stable or rose slightly.', detail: 'No area loses vegetation significantly.' },
        { q: 'Where?', a: `P1 rises the most (${fmt(byId.P1.first.value, 3)} → ${fmt(byId.P1.last.value, 3)}).`, detail: `P2 holds steady (~${fmt(byId.P2.last.value, 2)}); the ROI barely changes (${fmt(byId.ROI.first.value, 3)} → ${fmt(byId.ROI.last.value, 3)}).` },
        { q: 'How much?', a: `Between ${signed(Math.min(...zones.map(z => z.trend.slope_per_year)), 4)} and ${signed(Math.max(...zones.map(z => z.trend.slope_per_year)), 4)} NDVI per year.`, detail: 'Theil–Sen slope over 7 years (May–October).' },
        { q: 'Is it significant?', a: zones.some(z => z.robust) ? 'Yes, in at least one area.' : 'Not robustly.', detail: `ROI p = ${fmt(byId.ROI.trend.p, 3)}; P2 p = ${fmt(byId.P2.trend.p, 3)}; P1 p = ${fmt(byId.P1.trend.p, 3)}, but it is no longer significant if one year is removed.` },
        { q: 'Who helps interpret it?', a: 'The community.', detail: `It documents ${events.length} events in ${Y0}–${Y1} (oil spills, cyanobacteria, flooding, waste) that NDVI does not measure.` },
      ],
      zones,
      events,
      climate: {
        rain, wet, dry,
        tRange: [Math.min(...t2m), Math.max(...t2m)],
        provenance: P.power,
        note: wetEvents.length
          ? `${wet.year} was the wettest year (${fmt(wet.value, 0)} mm) and matches the community record “${wetEvents[0].event}”. A coincidence, not proof of cause.`
          : `${wet.year} was the wettest year (${fmt(wet.value, 0)} mm).`,
      },
      quality: {
        modis: quality,
        valid: qValid, total: qTotal,
        landsatCoverage: [Math.min(...cov), Math.max(...cov)],
      },
      limits: [
        'No satellite water data (NDWI, surface temperature, chlorophyll).',
        'P1 and P2 were chosen by the team; the ROI is a candidate area drawn on recent imagery.',
        `Only ${Y1 - Y0 + 1} years: trends are exploratory.`,
        `MODIS (250 m): only ${qValid} of ${qTotal} observations pass quality control.`,
        'The community chronology is a documentary account; several figures need sources.',
      ],
      next: [
        'Measure the water: NDWI and surface temperature with Landsat; chlorophyll and cyanobacteria with ocean-colour sensors.',
        'Map the mangrove with the community and validate it in the field.',
        'Extend the series with MODIS since 2000.',
        'Add consented community records (template ready).',
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
