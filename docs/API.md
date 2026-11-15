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
  "sites": [
    { "id": "P1", "name": "Mangrove Point 1 · Capitán Chico", "lat": 10.705247, "lon": -71.587554,
      "status": "Punto elegido por el equipo, no verificado en campo" }
  ],
  "roi": { "id": "ROI", "name": "Zona candidata ROI", "area_ha": 20.05, "polygon": null,
           "status": "Área candidata de vegetación, no manglar verificado" },
  "community": {
    "records": [],
    "pendingMessage": "Pendiente de autorización de la comunidad",
    "historical": [{ "period": "2006–2007", "event": "...", "finding": "...", "source_label": "...", "verification_status": "..." }],
    "chronology": {
      "title": "Cronología de problemáticas e impactos ambientales en Santa Rosa de Agua (1904–2026)",
      "source": "Documento aportado por la comunidad / equipo KATOUWA",
      "status": "Relato documental: fuentes por verificar, no es una medición satelital",
      "events": [{ "period": "2023 (Jun – Ago)", "from": 2023, "to": 2023, "event": "...", "indicators": "...", "impact": "..." }]
    }
  }
}
```

- `aoi`: área de estudio. Todo lo de fuera se oscurece.
- El fondo del mapa es imagen satelital en teselas (configurable en `sala/config.js` → `imagery`); el backend no la envía.
- `roi.polygon`: `null` mientras no se exporte la geometría del ROI. Cuando llegue (`[[lat, lon], ...]`), se podrá dibujar.
- `community.chronology`: memoria del territorio (fuente: `data/comunidad/cronologia_santa_rosa_de_agua_1904_2026.csv`). Se muestra en el panel de voces y los eventos de cada año aparecen en la tarjeta.
- `community.records`: **solo** registros con consentimiento (columnas de `data/nasa/community_records_TEMPLATE.csv`). Si está vacío se muestra `pendingMessage`.
- Un territorio sin datos responde `{ "id": "donana", "name": "Doñana", "empty": true, "message": "..." }`.

## `GET /territories/{territoryId}/targets/{targetId}/reading?year=2025&lat=…&lon=…`

`targetId`: un punto (`P1`, `P2`, …), `ROI` o `WATER` (Lago de Maracaibo).

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
- Una sección puede ser de eventos: `{ "kind": "events", "title": "Memoria del territorio · 2023", "provenance": "Cronología comunitaria", "events": [{ "period", "event", "impact" }], "empty": "...", "note": "..." }`.
- `rows`: con `value` (+ `unit`, `decimals`) o con `text` ya formateado. `value: null` se muestra como "sin dato". Si trae `series`, se dibuja un minigráfico.
- `signals`: series que el Pulso del territorio puede sonificar. Regla: valor → normalizado entre 0 y 1 → 220–660 Hz. Un `value: null` es un año sin dato (silencio).

## `GET /territories/{territoryId}/analysis`

Vista «Análisis integrado» de la Sala: une los resultados de NASA con la memoria de la comunidad.
Sin backend, la calcula `sala/static-provider.js` a partir del paquete validado.

```json
{
  "period": [2019, 2025],
  "headline": { "title": "...", "text": ["...", "..."] },
  "questions": [{ "q": "¿Qué cambió?", "a": "...", "detail": "..." }],
  "zones": [{ "id": "ROI", "label": "Zona candidata ROI", "series": [{ "year": 2019, "value": 0.830 }],
              "trend": { "n": 7, "slope_per_year": 0.00484, "ci95": [-0.00107, 0.01191], "p": 0.069, "leave_one_out_p": [] },
              "first": { "year": 2019, "value": 0.830 }, "last": { "year": 2025, "value": 0.854 }, "verdict": "...", "robust": false }],
  "events": [{ "from": 2023, "to": 2023, "period": "2023 (Jun – Ago)", "event": "...", "impact": "..." }],
  "climate": { "rain": [{ "year": 2019, "value": 637.4 }], "wet": { "year": 2022, "value": 1140.4 }, "tRange": [28.46, 30.22], "provenance": "...", "note": "..." },
  "quality": { "modis": [{ "id": "P1", "valid": 73, "total": 161, "rows": [{ "year": 2019, "valid": 9, "total": 23 }] }], "valid": 78, "total": 322, "landsatCoverage": [98.5, 99.2] },
  "limits": ["..."],
  "next": ["..."],
  "provenance": { "landsat": "...", "modis": "...", "power": "..." }
}
```

`zones` usa como máximo 3 series (paleta categórica validada para el fondo oscuro, en orden fijo).

## Qué no afirmar (lo aplica la interfaz)

- El ROI es un área candidata, no un manglar verificado; su NDVI (~0,8) no se compara con P1/P2.
- Un cambio de NDVI no prueba mortandad, contaminación ni recuperación.
- POWER es una malla regional (MERRA-2); la lluvia anual es una estimación.
- Con 7 años, las tendencias son exploratorias.
