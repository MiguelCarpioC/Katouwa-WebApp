/**
 * Capa de datos de la Sala de Control.
 * Pide los datos al backend (NASA + comunidad). Si no hay backend configurado
 * o no responde, usa los datos de prueba y lo indica con isMock: true.
 * Contrato: docs/API.md
 */
(() => {
  const cfg = window.KATOUWA_CONFIG || {};
  const fromUrl = new URLSearchParams(location.search).get('api');
  const base = (fromUrl || cfg.apiBase || '').replace(/\/$/, '') || null;

  async function getJSON(path, params) {
    const url = new URL(base + path, location.href);
    Object.entries(params || {}).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), cfg.timeoutMs || 8000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function withFallback(remote, mock) {
    if (!base) return { data: mock(), source: 'mock' };
    try {
      const data = await remote();
      return { data: { isMock: false, ...data }, source: 'api' };
    } catch (err) {
      console.warn('[KATOUWA] Backend no disponible:', err.message);
      if (cfg.fallbackToMock === false) throw err;
      return { data: mock(), source: 'mock', error: err.message };
    }
  }

  window.KATOUWA_API = {
    baseUrl: base,

    /** Territorio: área de estudio, geometría, zonas, voces y estado de salud por zona. */
    getTerritory(id, { year } = {}) {
      return withFallback(
        () => getJSON(`/territories/${encodeURIComponent(id)}`, { year }),
        () => window.KATOUWA_MOCK.territory(id, { year })
      );
    },

    /** Lectura de una zona (y del punto exacto donde se hizo clic). */
    getZoneReading(territoryId, zoneId, { year, lat, lon } = {}) {
      return withFallback(
        () => getJSON(`/territories/${encodeURIComponent(territoryId)}/zones/${encodeURIComponent(zoneId)}/reading`, {
          year, lat: lat != null ? lat.toFixed(6) : null, lon: lon != null ? lon.toFixed(6) : null,
        }),
        () => window.KATOUWA_MOCK.reading(territoryId, zoneId, { year })
      );
    },
  };
})();
