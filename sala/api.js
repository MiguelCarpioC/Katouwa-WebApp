/**
 * Capa de datos de la Sala de Control.
 * Con backend configurado, pide los datos ahí (NASA + comunidad).
 * Sin backend, o si no responde, usa el paquete validado local (sala/static-provider.js).
 * Contrato: docs/API.md
 */
(() => {
  const cfg = window.KATOUWA_CONFIG || {};
  const fromUrl = new URLSearchParams(location.search).get('api');
  const base = (fromUrl || cfg.apiBase || '').replace(/\/$/, '') || null;
  const local = window.KATOUWA_STATIC;

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

  async function withFallback(remote, fallback) {
    if (!base) return { data: fallback(), source: 'static' };
    try {
      return { data: { source: 'api', ...(await remote()) }, source: 'api' };
    } catch (err) {
      console.warn('[KATOUWA] Backend no disponible:', err.message);
      if (cfg.fallbackToStatic === false) throw err;
      return { data: fallback(), source: 'static', error: err.message };
    }
  }

  window.KATOUWA_API = {
    baseUrl: base,

    /** Territorio: área de estudio, puntos de muestreo, ROI y voces de la comunidad. */
    getTerritory(id) {
      return withFallback(
        () => getJSON(`/territories/${encodeURIComponent(id)}`),
        () => local.territory(id)
      );
    },

    /** Lectura de un punto (P1, P2), del ROI o del agua (WATER) para un año. */
    getReading(territoryId, targetId, { year, lat, lon } = {}) {
      return withFallback(
        () => getJSON(`/territories/${encodeURIComponent(territoryId)}/targets/${encodeURIComponent(targetId)}/reading`, {
          year, lat: lat != null ? lat.toFixed(6) : null, lon: lon != null ? lon.toFixed(6) : null,
        }),
        () => local.reading(territoryId, targetId, { year, lat, lon })
      );
    },
  };
})();
