# API de la Sala de Control Biocultural

La web no calcula nada: **pide los datos al backend** (procesamiento de NASA + registros de la comunidad).
Mientras no haya backend, usa el paquete validado local:

```
data/nasa/*.csv  ──tools/build_sala_data.py──▶  sala/data/katouwa-data.js  ──sala/static-provider.js──▶  mismas respuestas que la API
```

Para regenerarlo cuando cambien los CSV:

```bash
python3 tools/build_sala_data.py
```

## Conectar el backend

En `sala/config.js`:

```js
window.KATOUWA_CONFIG = { apiBase: 'https://tu-backend.org/api', timeoutMs: 8000, fallbackToStatic: true };
```

O, para probar sin tocar código: `sala.html?api=https://tu-backend.org/api`

El backend debe permitir CORS para el dominio de la web. Si no responde y `fallbackToStatic` es `true`,
la sala usa el paquete local y lo indica en el riel ("Fuente: paquete validado 2019–2025").

Todas las coordenadas son `[lat, lon]` o `lat`/`lon` en WGS84, con seis decimales.

---

## `GET /territories/{territoryId}`

`territoryId`: `santa-rosa` | `donana`

```json
{
  "id": "santa-rosa",
  "name": "Santa Rosa de Agua",
  "years": [2019, 2025],
  "aoi": [[10.687936, -71.599144], [10.716956, -71.607556], [10.724620, -71.584958], [10.691958, -71.575592]],
  "scene": { "illustrative": true, "water": [[[lat, lon], ...]], "vegetation": [[[lat, lon], ...]] },
  "sites": [
    { "id": "P1", "name": "Mangrove Point 1 · Capitán Chico", "lat": 10.705247, "lon": -71.587554,
      "status": "Punto elegido por el equipo, no verificado en campo" }
  ],
  "roi": { "id": "ROI", "name": "Zona candidata ROI", "area_ha": 20.05, "polygon": null,
           "status": "Área candidata de vegetación, no manglar verificado" },
  "community": {
    "records": [],
    "pendingMessage": "Pendiente de autorización de la comunidad",
    "historical": [{ "period": "2006–2007", "event": "...", "finding": "...", "source_label": "...", "verification_status": "..." }]
  }
}
```

- `aoi`: área de estudio. Todo lo de fuera se oscurece.
- `scene`: fondo **ilustrativo** (agua y vegetación). Si el backend envía una clasificación real de cobertura, poner `illustrative: false`.
- `roi.polygon`: `null` mientras no se exporte la geometría del ROI. Cuando llegue (`[[lat, lon], ...]`), se podrá dibujar.
- `community.records`: **solo** registros con consentimiento (columnas de `data/nasa/community_records_TEMPLATE.csv`). Si está vacío se muestra `pendingMessage`.
- Un territorio sin datos responde `{ "id": "donana", "name": "Doñana", "empty": true, "message": "..." }`.

## `GET /territories/{territoryId}/targets/{targetId}/reading?year=2025&lat=…&lon=…`

`targetId`: un punto (`P1`, `P2`, …), `ROI` o `WATER` (clic en el agua; `lat`/`lon` dicen dónde).

```json
{
  "id": "P1",
  "kind": "site",
  "year": 2025,
  "title": "Punto P1 · Capitán Chico",
  "subtitle": "Punto elegido por el equipo, no verificado en campo",
  "location": [10.705247, -71.587554],
  "verdict": { "label": "Aumento nominal · p = 0,030 · sensible a quitar un año", "tone": "neutral" },
  "evidence": null,
  "sections": [
    {
      "title": "Landsat · mayo–octubre",
      "provenance": "Landsat 8-9 C2 L2 · 30 m",
      "rows": [
        { "label": "NDVI 2025", "value": 0.510, "decimals": 3, "series": [{ "year": 2019, "value": 0.353 }, { "year": 2025, "value": 0.510 }] },
        { "label": "Tendencia (Theil–Sen)", "text": "+0,0199 /año", "note": "IC 95 %: +0,0115 a +0,0400 · p = 0,030 · n = 7" }
      ]
    }
  ],
  "notes": ["Un cambio de NDVI no prueba mortandad, contaminación ni recuperación."],
  "signals": [
    { "id": "landsat-mo", "label": "NDVI Landsat P1 · may–oct", "provenance": "Landsat 8-9 C2 L2 · 30 m", "decimals": 3,
      "series": [{ "year": 2019, "value": 0.353 }, { "year": 2025, "value": 0.510 }] }
  ]
}
```

- `verdict.tone`: `up` / `down` (solo si p < 0,05 y sigue así al quitar cualquier año), `neutral` o `none` (sin datos).
- `evidence` (opcional, se usa en el ROI): `{ "sentence": "Cambio no significativo", "items": [{ "label": "Pendiente", "text": "+0,0048 /año" }, ...] }`.
- `rows`: con `value` (+ `unit`, `decimals`) o con `text` ya formateado. `value: null` se muestra como "sin dato". Si trae `series`, se dibuja un minigráfico.
- `signals`: series que el Pulso del territorio puede sonificar. Regla: valor → normalizado entre 0 y 1 → 220–660 Hz. Un `value: null` es un año sin dato (silencio).

## Qué no afirmar (lo aplica la interfaz)

- El ROI es un área candidata, no un manglar verificado; su NDVI (~0,8) no se compara con P1/P2.
- Un cambio de NDVI no prueba mortandad, contaminación ni recuperación.
- POWER es una malla regional (MERRA-2); la lluvia anual es una estimación.
- Con 7 años, las tendencias son exploratorias.
