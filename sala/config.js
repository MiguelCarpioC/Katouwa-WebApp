/**
 * Configuración de la Sala de Control.
 *
 * apiBase: URL del backend que entrega los datos de NASA y de la comunidad.
 *          Déjalo en null para usar el paquete validado local (data/nasa → sala/data/katouwa-data.js).
 *          El contrato de la API está en docs/API.md.
 *
 * También se puede pasar por URL:  sala.html?api=https://mi-backend.org/api
 */
window.KATOUWA_CONFIG = {
  apiBase: null,
  timeoutMs: 8000,
  // Si el backend no responde, usar el paquete local en vez de mostrar un error.
  fallbackToStatic: true,

  // Imagen satelital de fondo (teselas XYZ en Web Mercator).
  imagery: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagen satelital: Esri, Maxar, Earthstar Geographics y la comunidad de usuarios GIS',
    maxZoom: 18,
  },
};
