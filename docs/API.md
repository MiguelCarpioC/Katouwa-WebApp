# API de la Sala de Control Biocultural

La web no calcula nada: **pide los datos al backend** (procesamiento de NASA + registros de la comunidad).
Mientras no haya backend, usa `sala/mock-data.js`, que tiene exactamente la misma forma.

## Conectar el backend

En `sala/config.js`:

```js
window.KATOUWA_CONFIG = { apiBase: 'https://tu-backend.org/api', timeoutMs: 8000, fallbackToMock: true };
```

O, para probar sin tocar código: `sala.html?api=https://tu-backend.org/api`

El backend debe permitir CORS para el dominio de la web. Si no responde y `fallbackToMock` es `true`,
la sala usa datos de prueba y lo indica ("Fuente: datos de prueba" y la etiqueta *Datos de prueba* en la tarjeta).

Todas las coordenadas son `[lat, lon]` en WGS84.

---

## `GET /territories/{territoryId}?year=2026`

`territoryId`: `santa-rosa` | `donana`

```json
{
  "id": "santa-rosa",
  "name": "Santa Rosa de Agua",
  "year": 2026,
  "labels": { "vegetation": "manglar", "water": "lago" },
  "aoi": [[10.687936, -71.599144], [10.716956, -71.607556], [10.724620, -71.584958], [10.691958, -71.575592]],
  "scene": {
    "water":      [[[lat, lon], ...]],
    "vegetation": [[[lat, lon], ...]]
  },
  "zones": [
    { "id": "M-07", "kind": "vegetation", "name": "Manglar rojo · Zona M-07", "polygon": [[lat, lon], ...] },
    { "id": "A-03", "kind": "water",      "name": "Lago de Maracaibo · Zona A-03", "polygon": [[lat, lon], ...] }
  ],
  "zoneStatus": {
    "M-07": { "score": 82, "status": "saludable" },
    "A-03": { "score": 41, "status": "atencion" }
  },
  "voices": [
    { "id": "V-1", "lat": 10.7072, "lon": -71.5905, "label": "Voz comunitaria · palafitos" }
  ]
}
```

- `aoi`: el área de estudio (4 vértices, en orden). Todo lo de fuera se oscurece.
- `scene`: entorno de fondo (agua y vegetación), solo decorativo.
- `zones`: zonas clicables. Se recortan al `aoi` al dibujarse.
- `zoneStatus.status`: `saludable` (≥ 70) · `atencion` (40–69) · `critico` (< 40). Las críticas se pintan en coral.
- `voices`: registros de la comunidad (se muestran como marcadores de onda).

## `GET /territories/{territoryId}/zones/{zoneId}/reading?year=2026&lat=10.705&lon=-71.596`

`lat`/`lon` son el punto exacto donde la persona hizo clic, por si el backend quiere afinar la lectura.

```json
{
  "zoneId": "M-07",
  "kind": "vegetation",
  "title": "Manglar rojo · Zona M-07",
  "year": 2026,
  "health": { "score": 82, "status": "saludable" },
  "metrics": [
    { "key": "canopy_temp", "label": "Temperatura del dosel", "value": 29.4, "unit": "°C", "decimals": 1 },
    { "key": "ndvi", "label": "NDVI", "value": 0.61, "decimals": 2,
      "series": [{ "year": 2013, "value": 0.66 }, { "year": 2026, "value": 0.61 }] }
  ],
  "regional": {
    "radiusKm": 50,
    "values": [
      { "label": "Humedad", "value": 78, "unit": "%" },
      { "label": "Viento",  "value": 14, "unit": "km/h" },
      { "label": "Lluvia",  "value": 2,  "unit": "mm" }
    ]
  },
  "isMock": false
}
```

- `metrics`: se muestran en orden. Si una métrica trae `series`, se dibuja su minigráfico.
- `health` controla la tarjeta, el color y el sonido: **más distorsión = menos salud**.
  Las zonas `saludable` suenan como una onda limpia; las demás se distorsionan y ofrecen el patrón Chladni.
- `isMock: true` muestra la etiqueta *Datos de prueba*.
