#!/usr/bin/env python3
"""
Genera sala/data/katouwa-data.js a partir de los CSV reales en data/nasa/
(paquete KATOUWA_2026_ROI_VALIDATED, 2019–2025).

Calcula, sin dependencias externas:
  - pendiente de Theil–Sen con su intervalo del 95 % (mismo método que scipy.stats.theilslopes)
  - prueba de tendencia de Kendall con p exacto (n pequeño, sin empates)

Uso:  python3 tools/build_sala_data.py
"""
import csv
import itertools
import json
import math
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "nasa"
OUT = ROOT / "sala" / "data" / "katouwa-data.js"


def read(name):
    with open(SRC / name, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def num(v, nd=None):
    x = float(v)
    return round(x, nd) if nd is not None else x


# ───────── Estadística ─────────
def kendall_S(y):
    n = len(y)
    return sum((y[j] > y[i]) - (y[j] < y[i]) for i in range(n) for j in range(i + 1, n))


def kendall_exact_p(y):
    """p bilateral exacto por enumeración de permutaciones (válido para n ≤ 9 sin empates)."""
    n = len(y)
    s_obs = abs(kendall_S(y))
    if n > 9 or len(set(y)) < n:
        # aproximación normal (no se usa con los datos actuales)
        var = n * (n - 1) * (2 * n + 5) / 18
        z = (s_obs - 1) / math.sqrt(var) if s_obs > 0 else 0
        return math.erfc(z / math.sqrt(2))
    count = total = 0
    for perm in itertools.permutations(range(n)):
        total += 1
        if abs(kendall_S(perm)) >= s_obs:
            count += 1
    return count / total


def theil_sen(x, y, conf=0.95):
    slopes = sorted((y[j] - y[i]) / (x[j] - x[i]) for i in range(len(x)) for j in range(i + 1, len(x)) if x[j] != x[i])
    nt = len(slopes)
    med = slopes[nt // 2] if nt % 2 else (slopes[nt // 2 - 1] + slopes[nt // 2]) / 2
    n = len(y)
    z = -1.959963984540054  # norm.ppf(0.025)
    sigma = math.sqrt(n * (n - 1) * (2 * n + 5) / 18)
    ru = min(int(round((nt - z * sigma) / 2.0)), nt - 1)
    rl = max(int(round((nt + z * sigma) / 2.0)) - 1, 0)
    return med, slopes[rl], slopes[ru]


def trend(series):
    years = [p["year"] for p in series]
    vals = [p["value"] for p in series]
    slope, lo, hi = theil_sen(years, vals)
    n = len(vals)
    s = kendall_S(vals)
    return {
        "n": n,
        "first_year": years[0],
        "last_year": years[-1],
        "slope_per_year": round(slope, 5),
        "ci95": [round(lo, 5), round(hi, 5)],
        "tau": round(s / (n * (n - 1) / 2), 4),
        "p": round(kendall_exact_p(vals), 4),
        "delta": round(vals[-1] - vals[0], 4),
        # ¿sigue siendo p < 0,05 si se quita cualquier año?
        "leave_one_out_p": [round(kendall_exact_p(vals[:i] + vals[i + 1:]), 4) for i in range(n)],
    }


# ───────── Datos ─────────
sites_cfg = json.loads((SRC / "sites.json").read_text(encoding="utf-8"))
site_ids = {"MANGROVE_POINT_1": "P1", "MANGROVE_POINT_2": "P2"}
sites = [
    {
        "id": site_ids[s["id"]],
        "name": s["name"],
        "lat": s["latitude"],
        "lon": s["longitude"],
        "status": "Point chosen by the team, not field-verified",
    }
    for s in sites_cfg["sites"]
]

# ROI candidato (Landsat 30 m, mayo–octubre)
roi_rows = [
    {
        "year": int(float(r["year"])),
        "ndvi_median": num(r["ndvi_median"], 6),
        "ndvi_mean": num(r["ndvi_mean"], 4),
        "valid_pixel_count": int(r["valid_pixel_count"]),
        "observed_area_ha": num(r["observed_area_ha"], 2),
        "scene_count": int(r["scene_count"]),
    }
    for r in read("KATOUWA_ROI_MAY_OCT_2019_2025.csv")
]
roi_area = num(read("KATOUWA_ROI_MAY_OCT_2019_2025.csv")[0]["roi_area_ha"], 2)
roi = {
    "area_ha": roi_area,
    "polygon": None,  # el paquete no incluye los vértices del ROI
    "status": "Candidate vegetation area, not verified mangrove",
    "rows": roi_rows,
    "trend": trend([{"year": r["year"], "value": r["ndvi_median"]} for r in roi_rows]),
}


def landsat(name, water_col):
    out = defaultdict(list)
    for r in read(name):
        out[r["site"]].append({
            "year": int(float(r["year"])),
            "ndvi": num(r["NDVI"], 6),
            "valid_obs": int(r["valid_obs"]),
            "water_fraction": num(r[water_col], 3),
            "scene_count": int(r["scene_count"]),
        })
    for s in out:
        out[s].sort(key=lambda p: p["year"])
    return dict(out)


landsat_mo = landsat("KATOUWA_LANDSAT_MAY_OCT_2019_2025.csv", "water_fraction")
landsat_fy = landsat("KATOUWA_LANDSAT_2019_2025.csv", "qa_water_fraction")

# MODIS: medianas anuales con calidad estricta
modis = defaultdict(lambda: defaultdict(list))
for r in read("GEE_MOD13Q1_annual_medians.csv"):
    if r["filter"] != "QA0_strict":
        continue
    modis[r["site"]][r["index"]].append({"year": int(r["year"]), "median": num(r["median"], 4) if r["median"] else None, "count": int(r["count"])})

# MODIS: calidad (observaciones totales frente a válidas por año y punto)
quality = defaultdict(lambda: defaultdict(lambda: {"total": 0, "valid": 0}))
for r in read("GEE_MOD13Q1_P1_P2_RAW_2019_2025.csv"):
    quality[r["site"]][int(r["date"][:4])]["total"] += 1
for r in read("GEE_MOD13Q1_QA0_OBSERVATIONS.csv"):
    quality[r["site"]][int(r["date"][:4])]["valid"] += 1

def modis_trend(v):
    pts = [{"year": p["year"], "value": p["median"]} for p in sorted(v, key=lambda p: p["year"]) if p["median"] is not None]
    return trend(pts) if len(pts) >= 5 else None


power = [
    {
        "year": int(r["year"]),
        "t2m_c": num(r["T2M_annual_mean_C"], 2),
        "rain_mm": num(r["precipitation_annual_total_mm_estimate"], 1),
    }
    for r in read("NASA_POWER_REAL_2019_2025_annual.csv")
]

historical = [
    {k: r[k] for k in ("period", "event", "finding", "source_label", "verification_status")}
    for r in read("historical_claims.csv")
]
community = [r for r in read("community_records_TEMPLATE.csv") if r.get("consent_status", "").strip().lower() in ("granted", "otorgado", "yes", "si", "sí")]

# Memoria del territorio: cronología de problemáticas aportada por la comunidad (1904–2026)
# English translation of the original Spanish document (cronologia_santa_rosa_de_agua_1904_2026.csv)
with open(ROOT / "data" / "comunidad" / "chronology_santa_rosa_de_agua_1904_2026_en.csv", newline="", encoding="utf-8") as f:
    chronology = [
        {
            "period": r["period"],
            "from": int(r["year_from"]),
            "to": int(r["year_to"]),
            "event": r["event"],
            "indicators": r["indicators"],
            "impact": r["impact_on_santa_rosa"],
        }
        for r in csv.DictReader(f)
    ]

bundle = {
    "package": "KATOUWA_2026_ROI_VALIDATED",
    "period": [2019, 2025],
    "provenance": {
        "landsat": "Landsat 8-9 C2 L2 · 30 m",
        "modis": "MODIS MOD13Q1 v061 · 250 m",
        "power": "NASA POWER / MERRA-2 · regional",
    },
    "sites": sites,
    "roi": roi,
    "landsat": {
        "may_oct": landsat_mo,
        "full_year": landsat_fy,
        "trends": {s: trend([{"year": p["year"], "value": p["ndvi"]} for p in v]) for s, v in landsat_mo.items()},
        "trends_full_year": {s: trend([{"year": p["year"], "value": p["ndvi"]} for p in v]) for s, v in landsat_fy.items()},
    },
    "modis": {
        s: {
            "series": {idx: sorted(v, key=lambda p: p["year"]) for idx, v in idx_map.items()},
            # tendencia solo si hay al menos 5 años con dato
            "trends": {idx: modis_trend(v) for idx, v in idx_map.items()},
            "quality": [{"year": y, **q} for y, q in sorted(quality[s].items())],
        }
        for s, idx_map in modis.items()
    },
    "power": power,
    "historical": historical,
    "community": community,
    "chronology": {
        "title": "Chronology of environmental problems and impacts in Santa Rosa de Agua (1904–2026)",
        "source": "Document contributed by the community / KATOUWA team",
        "status": "Documentary account: sources to be verified, not a satellite measurement",
        "events": chronology,
    },
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(
    "/* Generated by tools/build_sala_data.py from data/nasa/ and data/comunidad/. Do not edit by hand. */\n"
    "window.KATOUWA_DATA = " + json.dumps(bundle, ensure_ascii=False, indent=1) + ";\n",
    encoding="utf-8",
)
print("ROI:", roi["trend"])
print("P1:", bundle["landsat"]["trends"]["P1"])
print("P2:", bundle["landsat"]["trends"]["P2"])
print("Año completo:", bundle["landsat"]["trends_full_year"])
print("MODIS QA:", {s: (sum(q["valid"] for q in v["quality"]), sum(q["total"] for q in v["quality"])) for s, v in bundle["modis"].items()})
print("->", OUT.relative_to(ROOT))
