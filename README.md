# Katouwa-WebApp

KATOUWA · Custodios del Manglar — monitoreo biocultural de los manglares de Santa Rosa de Agua (Lago de Maracaibo), con el pueblo Añú.

- `index.html` — página de inicio (agua → superficie → luna) y página de equipo.
- `sala.html` — Sala de Control Biocultural (mapa, tarjeta de zona y Pulso del territorio).
- `sala/` — código de la sala. `sala/config.js` conecta el backend; `sala/mock-data.js` son los datos de prueba.
- `docs/API.md` — contrato de datos que debe cumplir el backend (NASA + comunidad).

Para verla en local:

```bash
python3 -m http.server 8000
```

y abrir http://localhost:8000
