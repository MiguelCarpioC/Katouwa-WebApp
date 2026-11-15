# Katouwa-WebApp

KATOUWA · Custodios del Manglar — monitoreo biocultural de los manglares de Santa Rosa de Agua (Lago de Maracaibo), con el pueblo Añú.

- `index.html` — página de inicio (agua → superficie → luna) y página de equipo.
- `sala.html` — Sala de Control Biocultural (mapa, tarjeta de zona y Pulso del territorio).
- `sala/` — código de la sala. `sala/config.js` conecta el backend; sin backend usa `sala/data/katouwa-data.js`.
- `data/nasa/` — datos reales del paquete KATOUWA_2026_ROI_VALIDATED (Landsat, MODIS, NASA POWER, 2019–2025).
- `data/comunidad/` — cronología de problemáticas de Santa Rosa de Agua (1904–2026) aportada por la comunidad.
- `tools/build_sala_data.py` — regenera `sala/data/katouwa-data.js` desde `data/nasa/` y `data/comunidad/` (tendencias Theil–Sen y Kendall).
- `docs/API.md` — contrato de datos que debe cumplir el backend (NASA + comunidad).

Para verla en local:

```bash
python3 -m http.server 8000
```

y abrir http://localhost:8000
