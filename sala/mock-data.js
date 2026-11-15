/**
 * DATOS DE PRUEBA.
 * Tienen la misma forma que debe devolver el backend (ver docs/API.md),
 * para que cambiar a datos reales sea solo configurar sala/config.js.
 * Todas las coordenadas son [lat, lon] (WGS84).
 */
(() => {
  const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;

  // ───────── Santa Rosa de Agua ─────────
  // Línea de costa estilizada (norte → sur). No es una costa medida: es de prueba.
  const SHORE = [
    [10.760, -71.6035], [10.740, -71.6000], [10.730, -71.5975], [10.722, -71.5960],
    [10.716, -71.5985], [10.710, -71.5945], [10.704, -71.5960], [10.698, -71.5925],
    [10.692, -71.5935], [10.686, -71.5905], [10.660, -71.5880],
  ];

  function shoreLon(lat) {
    for (let i = 0; i < SHORE.length - 1; i++) {
      const [a, la] = SHORE[i], [b, lb] = SHORE[i + 1];
      if (lat <= a && lat >= b) return la + (lb - la) * ((a - lat) / (a - b));
    }
    return SHORE[lat > SHORE[0][0] ? 0 : SHORE.length - 1][1];
  }

  function shoreSegment(latFrom, latTo, offset = 0) {
    const pts = [];
    const step = 0.0008 * Math.sign(latTo - latFrom);
    for (let lat = latFrom; step < 0 ? lat > latTo : lat < latTo; lat += step) {
      pts.push([round(lat, 5), round(shoreLon(lat) + offset, 5)]);
    }
    pts.push([latTo, round(shoreLon(latTo) + offset, 5)]);
    return pts;
  }

  // Franja de manglar a lo largo de la costa
  function fringe(latMax, latMin, width) {
    return [...shoreSegment(latMax, latMin, 0.0005), ...shoreSegment(latMin, latMax, -width)];
  }

  // Lago entre dos latitudes (se recorta al área de estudio al dibujar)
  function lakeBand(latMax, latMin) {
    return [...shoreSegment(latMax, latMin), [latMin, -71.565], [latMax, -71.565]];
  }

  const santaRosa = {
    id: 'santa-rosa',
    name: 'Santa Rosa de Agua',
    labels: { vegetation: 'manglar', water: 'lago' },
    aoi: [
      [10.687936, -71.599144],
      [10.716956, -71.607556],
      [10.724620, -71.584958],
      [10.691958, -71.575592],
    ],
    scene: {
      water: [[...SHORE, [10.660, -71.48], [10.760, -71.48]]],
      vegetation: [fringe(10.758, 10.662, 0.0022)],
    },
    zones: [
      { id: 'A-01', kind: 'water', name: 'Lago de Maracaibo · Zona A-01', polygon: lakeBand(10.735, 10.7045) },
      { id: 'A-03', kind: 'water', name: 'Lago de Maracaibo · Zona A-03', polygon: lakeBand(10.7045, 10.680) },
      { id: 'M-03', kind: 'vegetation', name: 'Manglar rojo · Zona M-03', polygon: fringe(10.7215, 10.7108, 0.0030) },
      { id: 'M-07', kind: 'vegetation', name: 'Manglar rojo · Zona M-07', polygon: fringe(10.7100, 10.6995, 0.0034) },
      { id: 'M-11', kind: 'vegetation', name: 'Manglar negro · Zona M-11', polygon: fringe(10.6985, 10.6890, 0.0030) },
    ],
    voices: [
      { id: 'V-1', lat: 10.7072, lon: -71.5905, label: 'Voz comunitaria · palafitos (prueba)' },
      { id: 'V-2', lat: 10.7160, lon: -71.5940, label: 'Voz comunitaria · orilla norte (prueba)' },
      { id: 'V-3', lat: 10.6950, lon: -71.5880, label: 'Voz comunitaria · caño sur (prueba)' },
    ],
  };

  // ───────── Doñana (marcador de posición) ─────────
  const donana = {
    id: 'donana',
    name: 'Doñana',
    labels: { vegetation: 'marisma', water: 'lucio' },
    aoi: [
      [36.950, -6.470],
      [36.992, -6.458],
      [36.984, -6.392],
      [36.943, -6.404],
    ],
    scene: {
      water: [[[36.979, -6.446], [36.983, -6.421], [36.971, -6.404], [36.957, -6.417], [36.960, -6.441]]],
      vegetation: [[[37.000, -6.480], [37.000, -6.445], [36.975, -6.452], [36.950, -6.470], [36.935, -6.480]]],
    },
    zones: [
      { id: 'L-01', kind: 'water', name: 'Lucio · Zona L-01', polygon: [[36.979, -6.446], [36.983, -6.421], [36.971, -6.404], [36.957, -6.417], [36.960, -6.441]] },
      { id: 'V-02', kind: 'vegetation', name: 'Marisma · Zona V-02', polygon: [[36.986, -6.462], [36.988, -6.449], [36.973, -6.450], [36.958, -6.455], [36.954, -6.465]] },
      { id: 'V-05', kind: 'vegetation', name: 'Marisma · Zona V-05', polygon: [[36.958, -6.411], [36.967, -6.399], [36.953, -6.398], [36.948, -6.407]] },
    ],
    voices: [
      { id: 'V-1', lat: 36.968, lon: -6.452, label: 'Voz comunitaria (prueba)' },
    ],
  };

  // ───────── Lecturas por zona ─────────
  // Valores de 2026 = los del diseño. Otros años se derivan para que el control de año tenga efecto.
  const BASE = {
    'santa-rosa/M-07': { score: 82, drift: -0.6, primary: { label: 'Temperatura del dosel', value: 29.4, unit: '°C', decimals: 1, drift: 0.06 }, index: { label: 'NDVI', value: 0.61, decimals: 2, drift: -0.004 }, regional: 'land' },
    'santa-rosa/M-03': { score: 74, drift: 0.4, primary: { label: 'Temperatura del dosel', value: 29.9, unit: '°C', decimals: 1, drift: 0.05 }, index: { label: 'NDVI', value: 0.55, decimals: 2, drift: -0.006 }, regional: 'land' },
    'santa-rosa/M-11': { score: 33, drift: 2.4, primary: { label: 'Temperatura del dosel', value: 31.8, unit: '°C', decimals: 1, drift: 0.09 }, index: { label: 'NDVI', value: 0.34, decimals: 2, drift: -0.018 }, regional: 'land' },
    'santa-rosa/A-03': { score: 41, drift: 1.6, primary: { label: 'Temperatura superficial del agua', value: 31.2, unit: '°C', decimals: 1, drift: 0.07 }, index: { label: 'NDWI', value: 0.38, decimals: 2, drift: -0.01 }, regional: 'water' },
    'santa-rosa/A-01': { score: 58, drift: 1.0, primary: { label: 'Temperatura superficial del agua', value: 30.6, unit: '°C', decimals: 1, drift: 0.06 }, index: { label: 'NDWI', value: 0.44, decimals: 2, drift: -0.007 }, regional: 'water' },
    'donana/L-01': { score: 47, drift: 1.8, primary: { label: 'Temperatura superficial del agua', value: 24.1, unit: '°C', decimals: 1, drift: 0.08 }, index: { label: 'NDWI', value: 0.29, decimals: 2, drift: -0.012 }, regional: 'water' },
    'donana/V-02': { score: 71, drift: 0.8, primary: { label: 'Temperatura de la vegetación', value: 26.3, unit: '°C', decimals: 1, drift: 0.05 }, index: { label: 'NDVI', value: 0.52, decimals: 2, drift: -0.006 }, regional: 'land' },
    'donana/V-05': { score: 36, drift: 2.2, primary: { label: 'Temperatura de la vegetación', value: 28.0, unit: '°C', decimals: 1, drift: 0.07 }, index: { label: 'NDVI', value: 0.31, decimals: 2, drift: -0.015 }, regional: 'land' },
  };

  const REGIONAL = {
    land:  [{ label: 'Humedad', value: 78, unit: '%' }, { label: 'Viento', value: 14, unit: 'km/h' }, { label: 'Lluvia', value: 2, unit: 'mm' }],
    water: [{ label: 'Viento', value: 14, unit: 'km/h' }, { label: 'Lluvia', value: 2, unit: 'mm' }],
  };

  function statusFor(score) {
    return score >= 70 ? 'saludable' : score >= 40 ? 'atencion' : 'critico';
  }

  function reading(territoryId, zoneId, { year = 2026 } = {}) {
    const t = TERRITORIES[territoryId];
    const zone = t && t.zones.find(z => z.id === zoneId);
    const b = BASE[`${territoryId}/${zoneId}`];
    if (!zone || !b) return null;

    const dy = 2026 - year;
    const score = Math.max(0, Math.min(100, Math.round(b.score + b.drift * dy)));
    const series = [];
    for (let y = 2013; y <= year; y++) {
      const d = 2026 - y;
      const wobble = Math.sin(y * 1.7 + zoneId.length) * 0.015;
      series.push({ year: y, value: round(b.index.value - b.index.drift * d + wobble * (d ? 1 : 0), 3) });
    }

    return {
      territoryId,
      zoneId,
      kind: zone.kind,
      title: zone.name,
      year,
      health: { score, status: statusFor(score) },
      metrics: [
        { key: 'primary', label: b.primary.label, value: round(b.primary.value - b.primary.drift * dy, 1), unit: b.primary.unit, decimals: b.primary.decimals },
        { key: 'index', label: b.index.label, value: series[series.length - 1].value, decimals: b.index.decimals, series },
      ],
      regional: { radiusKm: 50, values: REGIONAL[b.regional] },
      isMock: true,
    };
  }

  // Estado de salud de todas las zonas (para pintar el mapa)
  function zoneStatus(territoryId, year) {
    const t = TERRITORIES[territoryId];
    const out = {};
    t.zones.forEach(z => {
      const r = reading(territoryId, z.id, { year });
      if (r) out[z.id] = r.health;
    });
    return out;
  }

  const TERRITORIES = { 'santa-rosa': santaRosa, donana };

  window.KATOUWA_MOCK = {
    territory(id, { year = 2026 } = {}) {
      const t = TERRITORIES[id];
      if (!t) return null;
      return { ...t, year, zoneStatus: zoneStatus(id, year), isMock: true };
    },
    reading,
  };
})();
