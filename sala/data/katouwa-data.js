/* Generado por tools/build_sala_data.py a partir de data/nasa/. No editar a mano. */
window.KATOUWA_DATA = {
 "package": "KATOUWA_2026_ROI_VALIDATED",
 "period": [
  2019,
  2025
 ],
 "provenance": {
  "landsat": "Landsat 8-9 C2 L2 · 30 m",
  "modis": "MODIS MOD13Q1 v061 · 250 m",
  "power": "NASA POWER / MERRA-2 · regional"
 },
 "sites": [
  {
   "id": "P1",
   "name": "Mangrove Point 1 · Capitán Chico",
   "lat": 10.705247,
   "lon": -71.587554,
   "status": "Punto elegido por el equipo, no verificado en campo"
  },
  {
   "id": "P2",
   "name": "Mangrove Point 2 · Capitán Chico",
   "lat": 10.700986,
   "lon": -71.58191,
   "status": "Punto elegido por el equipo, no verificado en campo"
  }
 ],
 "roi": {
  "area_ha": 20.05,
  "polygon": null,
  "status": "Área candidata de vegetación, no manglar verificado",
  "rows": [
   {
    "year": 2019,
    "ndvi_median": 0.830112,
    "ndvi_mean": 0.802,
    "valid_pixel_count": 251,
    "observed_area_ha": 19.75,
    "scene_count": 21
   },
   {
    "year": 2020,
    "ndvi_median": 0.806152,
    "ndvi_mean": 0.7785,
    "valid_pixel_count": 251,
    "observed_area_ha": 19.8,
    "scene_count": 24
   },
   {
    "year": 2021,
    "ndvi_median": 0.834301,
    "ndvi_mean": 0.8073,
    "valid_pixel_count": 253,
    "observed_area_ha": 19.84,
    "scene_count": 23
   },
   {
    "year": 2022,
    "ndvi_median": 0.856865,
    "ndvi_mean": 0.8276,
    "valid_pixel_count": 256,
    "observed_area_ha": 19.88,
    "scene_count": 46
   },
   {
    "year": 2023,
    "ndvi_median": 0.841889,
    "ndvi_mean": 0.8129,
    "valid_pixel_count": 255,
    "observed_area_ha": 19.87,
    "scene_count": 46
   },
   {
    "year": 2024,
    "ndvi_median": 0.849617,
    "ndvi_mean": 0.8203,
    "valid_pixel_count": 257,
    "observed_area_ha": 19.88,
    "scene_count": 44
   },
   {
    "year": 2025,
    "ndvi_median": 0.853657,
    "ndvi_mean": 0.8217,
    "valid_pixel_count": 256,
    "observed_area_ha": 19.88,
    "scene_count": 45
   }
  ],
  "trend": {
   "n": 7,
   "first_year": 2019,
   "last_year": 2025,
   "slope_per_year": 0.00484,
   "ci95": [
    -0.00107,
    0.01191
   ],
   "tau": 0.619,
   "p": 0.069,
   "delta": 0.0235,
   "leave_one_out_p": [
    0.1361,
    0.1361,
    0.2722,
    0.0167,
    0.1361,
    0.1361,
    0.1361
   ]
  }
 },
 "landsat": {
  "may_oct": {
   "P1": [
    {
     "year": 2019,
     "ndvi": 0.352663,
     "valid_obs": 10,
     "water_fraction": 0.0,
     "scene_count": 21
    },
    {
     "year": 2020,
     "ndvi": 0.417498,
     "valid_obs": 12,
     "water_fraction": 0.0,
     "scene_count": 24
    },
    {
     "year": 2021,
     "ndvi": 0.432555,
     "valid_obs": 12,
     "water_fraction": 0.0,
     "scene_count": 23
    },
    {
     "year": 2022,
     "ndvi": 0.444028,
     "valid_obs": 23,
     "water_fraction": 0.0,
     "scene_count": 46
    },
    {
     "year": 2023,
     "ndvi": 0.405684,
     "valid_obs": 15,
     "water_fraction": 0.0,
     "scene_count": 46
    },
    {
     "year": 2024,
     "ndvi": 0.497274,
     "valid_obs": 15,
     "water_fraction": 0.0,
     "scene_count": 44
    },
    {
     "year": 2025,
     "ndvi": 0.510189,
     "valid_obs": 22,
     "water_fraction": 0.0,
     "scene_count": 45
    }
   ],
   "P2": [
    {
     "year": 2019,
     "ndvi": 0.603693,
     "valid_obs": 8,
     "water_fraction": 0.0,
     "scene_count": 21
    },
    {
     "year": 2020,
     "ndvi": 0.659478,
     "valid_obs": 5,
     "water_fraction": 0.0,
     "scene_count": 24
    },
    {
     "year": 2021,
     "ndvi": 0.614817,
     "valid_obs": 8,
     "water_fraction": 0.0,
     "scene_count": 23
    },
    {
     "year": 2022,
     "ndvi": 0.59364,
     "valid_obs": 22,
     "water_fraction": 0.0,
     "scene_count": 46
    },
    {
     "year": 2023,
     "ndvi": 0.533625,
     "valid_obs": 16,
     "water_fraction": 0.0,
     "scene_count": 46
    },
    {
     "year": 2024,
     "ndvi": 0.649842,
     "valid_obs": 15,
     "water_fraction": 0.0,
     "scene_count": 44
    },
    {
     "year": 2025,
     "ndvi": 0.608711,
     "valid_obs": 18,
     "water_fraction": 0.0,
     "scene_count": 45
    }
   ]
  },
  "full_year": {
   "P1": [
    {
     "year": 2019,
     "ndvi": 0.358373,
     "valid_obs": 22,
     "water_fraction": 0.0,
     "scene_count": 43
    },
    {
     "year": 2020,
     "ndvi": 0.430118,
     "valid_obs": 26,
     "water_fraction": 0.0,
     "scene_count": 44
    },
    {
     "year": 2021,
     "ndvi": 0.459304,
     "valid_obs": 27,
     "water_fraction": 0.0,
     "scene_count": 52
    },
    {
     "year": 2022,
     "ndvi": 0.456621,
     "valid_obs": 39,
     "water_fraction": 0.0,
     "scene_count": 88
    },
    {
     "year": 2023,
     "ndvi": 0.453935,
     "valid_obs": 48,
     "water_fraction": 0.0,
     "scene_count": 90
    },
    {
     "year": 2024,
     "ndvi": 0.481334,
     "valid_obs": 46,
     "water_fraction": 0.0,
     "scene_count": 87
    },
    {
     "year": 2025,
     "ndvi": 0.504454,
     "valid_obs": 55,
     "water_fraction": 0.0,
     "scene_count": 88
    }
   ],
   "P2": [
    {
     "year": 2019,
     "ndvi": 0.546175,
     "valid_obs": 18,
     "water_fraction": 0.0,
     "scene_count": 43
    },
    {
     "year": 2020,
     "ndvi": 0.638333,
     "valid_obs": 15,
     "water_fraction": 0.0,
     "scene_count": 44
    },
    {
     "year": 2021,
     "ndvi": 0.619447,
     "valid_obs": 21,
     "water_fraction": 0.0,
     "scene_count": 52
    },
    {
     "year": 2022,
     "ndvi": 0.594789,
     "valid_obs": 31,
     "water_fraction": 0.0,
     "scene_count": 88
    },
    {
     "year": 2023,
     "ndvi": 0.573353,
     "valid_obs": 43,
     "water_fraction": 0.0,
     "scene_count": 90
    },
    {
     "year": 2024,
     "ndvi": 0.579031,
     "valid_obs": 35,
     "water_fraction": 0.0,
     "scene_count": 87
    },
    {
     "year": 2025,
     "ndvi": 0.598677,
     "valid_obs": 42,
     "water_fraction": 0.0,
     "scene_count": 88
    }
   ]
  },
  "trends": {
   "P1": {
    "n": 7,
    "first_year": 2019,
    "last_year": 2025,
    "slope_per_year": 0.01994,
    "ci95": [
     0.01147,
     0.03995
    ],
    "tau": 0.7143,
    "p": 0.0302,
    "delta": 0.1575,
    "leave_one_out_p": [
     0.1361,
     0.0556,
     0.0556,
     0.0556,
     0.0028,
     0.1361,
     0.1361
    ]
   },
   "P2": {
    "n": 7,
    "first_year": 2019,
    "last_year": 2025,
    "slope_per_year": -0.00241,
    "ci95": [
     -0.04113,
     0.0281
    ],
    "tau": -0.1429,
    "p": 0.7726,
    "delta": 0.005,
    "leave_one_out_p": [
     0.4694,
     1.0,
     1.0,
     1.0,
     1.0,
     0.4694,
     0.7194
    ]
   }
  },
  "trends_full_year": {
   "P1": {
    "n": 7,
    "first_year": 2019,
    "last_year": 2025,
    "slope_per_year": 0.01594,
    "ci95": [
     0.00734,
     0.02919
    ],
    "tau": 0.7143,
    "p": 0.0302,
    "delta": 0.1461,
    "leave_one_out_p": [
     0.1361,
     0.1361,
     0.0167,
     0.0167,
     0.0167,
     0.1361,
     0.1361
    ]
   },
   "P2": {
    "n": 7,
    "first_year": 2019,
    "last_year": 2025,
    "slope_per_year": -0.00519,
    "ci95": [
     -0.02166,
     0.0162
    ],
    "tau": -0.0476,
    "p": 1.0,
    "delta": 0.0525,
    "leave_one_out_p": [
     0.2722,
     0.7194,
     0.7194,
     1.0,
     1.0,
     1.0,
     0.7194
    ]
   }
  }
 },
 "modis": {
  "P1": {
   "series": {
    "NDVI": [
     {
      "year": 2019,
      "median": 0.747,
      "count": 9
     },
     {
      "year": 2020,
      "median": 0.619,
      "count": 8
     },
     {
      "year": 2021,
      "median": 0.6711,
      "count": 11
     },
     {
      "year": 2022,
      "median": 0.5251,
      "count": 9
     },
     {
      "year": 2023,
      "median": 0.5682,
      "count": 11
     },
     {
      "year": 2024,
      "median": 0.7154,
      "count": 12
     },
     {
      "year": 2025,
      "median": 0.6909,
      "count": 13
     }
    ],
    "EVI": [
     {
      "year": 2019,
      "median": 0.4605,
      "count": 9
     },
     {
      "year": 2020,
      "median": 0.3326,
      "count": 8
     },
     {
      "year": 2021,
      "median": 0.3577,
      "count": 11
     },
     {
      "year": 2022,
      "median": 0.2696,
      "count": 9
     },
     {
      "year": 2023,
      "median": 0.2497,
      "count": 11
     },
     {
      "year": 2024,
      "median": 0.3994,
      "count": 12
     },
     {
      "year": 2025,
      "median": 0.4629,
      "count": 13
     }
    ]
   },
   "trends": {
    "NDVI": {
     "n": 7,
     "first_year": 2019,
     "last_year": 2025,
     "slope_per_year": -0.00632,
     "ci95": [
      -0.05145,
      0.05527
     ],
     "tau": -0.0476,
     "p": 1.0,
     "delta": -0.0561,
     "leave_one_out_p": [
      0.4694,
      1.0,
      1.0,
      1.0,
      1.0,
      0.7194,
      0.7194
     ]
    },
    "EVI": {
     "n": 7,
     "first_year": 2019,
     "last_year": 2025,
     "slope_per_year": 0.0004,
     "ci95": [
      -0.054,
      0.06443
     ],
     "tau": 0.0476,
     "p": 1.0,
     "delta": 0.0024,
     "leave_one_out_p": [
      0.4694,
      1.0,
      1.0,
      0.7194,
      0.7194,
      0.7194,
      0.4694
     ]
    }
   },
   "quality": [
    {
     "year": 2019,
     "total": 23,
     "valid": 9
    },
    {
     "year": 2020,
     "total": 23,
     "valid": 8
    },
    {
     "year": 2021,
     "total": 23,
     "valid": 11
    },
    {
     "year": 2022,
     "total": 23,
     "valid": 9
    },
    {
     "year": 2023,
     "total": 23,
     "valid": 11
    },
    {
     "year": 2024,
     "total": 23,
     "valid": 12
    },
    {
     "year": 2025,
     "total": 23,
     "valid": 13
    }
   ]
  },
  "P2": {
   "series": {
    "NDVI": [
     {
      "year": 2019,
      "median": 0.6683,
      "count": 1
     },
     {
      "year": 2020,
      "median": null,
      "count": 0
     },
     {
      "year": 2021,
      "median": 0.7619,
      "count": 1
     },
     {
      "year": 2022,
      "median": null,
      "count": 0
     },
     {
      "year": 2023,
      "median": null,
      "count": 0
     },
     {
      "year": 2024,
      "median": 0.8004,
      "count": 2
     },
     {
      "year": 2025,
      "median": 0.7277,
      "count": 1
     }
    ],
    "EVI": [
     {
      "year": 2019,
      "median": 0.207,
      "count": 1
     },
     {
      "year": 2020,
      "median": null,
      "count": 0
     },
     {
      "year": 2021,
      "median": 0.4544,
      "count": 1
     },
     {
      "year": 2022,
      "median": null,
      "count": 0
     },
     {
      "year": 2023,
      "median": null,
      "count": 0
     },
     {
      "year": 2024,
      "median": 0.3327,
      "count": 2
     },
     {
      "year": 2025,
      "median": 0.3608,
      "count": 1
     }
    ]
   },
   "trends": {
    "NDVI": null,
    "EVI": null
   },
   "quality": [
    {
     "year": 2019,
     "total": 23,
     "valid": 1
    },
    {
     "year": 2020,
     "total": 23,
     "valid": 0
    },
    {
     "year": 2021,
     "total": 23,
     "valid": 1
    },
    {
     "year": 2022,
     "total": 23,
     "valid": 0
    },
    {
     "year": 2023,
     "total": 23,
     "valid": 0
    },
    {
     "year": 2024,
     "total": 23,
     "valid": 2
    },
    {
     "year": 2025,
     "total": 23,
     "valid": 1
    }
   ]
  }
 },
 "power": [
  {
   "year": 2019,
   "t2m_c": 29.6,
   "rain_mm": 637.4
  },
  {
   "year": 2020,
   "t2m_c": 30.19,
   "rain_mm": 236.4
  },
  {
   "year": 2021,
   "t2m_c": 29.97,
   "rain_mm": 190.1
  },
  {
   "year": 2022,
   "t2m_c": 28.46,
   "rain_mm": 1140.4
  },
  {
   "year": 2023,
   "t2m_c": 30.22,
   "rain_mm": 491.4
  },
  {
   "year": 2024,
   "t2m_c": 30.05,
   "rain_mm": 735.4
  },
  {
   "year": 2025,
   "t2m_c": 29.74,
   "rain_mm": 572.8
  }
 ],
 "historical": [
  {
   "period": "2006–2007",
   "event": "Community perception study",
   "finding": "Survey of 50 people / households in Capitán Chico, focused on perceived quality-of-life effects of mangrove destruction.",
   "source_label": "Lissett Spelorzi, Universidad Rafael Urdaneta, 2007, thesis abstract",
   "verification_status": "Documented historical field survey; not a present-day measurement"
  },
  {
   "period": "2007",
   "event": "Mangrove conservation perceptions",
   "finding": "Study reports respondents recognized the ecosystem’s importance and expressed a need for institutional support.",
   "source_label": "Lissett Spelorzi (2007), thesis abstract",
   "verification_status": "Historical interpretation reported by thesis author"
  }
 ],
 "community": [],
 "chronology": {
  "title": "Cronología de problemáticas e impactos ambientales en Santa Rosa de Agua (1904–2026)",
  "source": "Documento aportado por la comunidad / equipo KATOUWA",
  "status": "Relato documental: fuentes por verificar, no es una medición satelital",
  "events": [
   {
    "period": "1904",
    "from": 1904,
    "to": 1904,
    "event": "Primeros reportes de microalgas",
    "indicators": "Registros de la empresa Chevron documentan la presencia de manchas de algas verdes cerca de sus primeros taladros de perforación.",
    "impact": "Antecedente biológico temprano de las cianobacterias que, un siglo después, colapsarían las costas de Santa Rosa."
   },
   {
    "period": "1922 – 1940",
    "from": 1922,
    "to": 1940,
    "event": "Inicio de la explotación petrolera masiva",
    "indicators": "Tras el reventón del pozo Barroso II (1922), comienza la instalación intensiva de pozos y oleoductos sublacustres en la cuenca.",
    "impact": "Primeras trazas de hidrocarburos arrastradas por las corrientes hacia el norte del lago y las riberas palafíticas."
   },
   {
    "period": "1953 – 1956",
    "from": 1953,
    "to": 1956,
    "event": "Dragado del Canal de Navegación",
    "indicators": "Apertura y profundización del canal de navegación del Lago de Maracaibo para permitir el paso de buques tanqueros de gran calado.",
    "impact": "Entrada masiva de agua salada del Golfo de Venezuela que alteró el equilibrio estuarino, desplazando especies de agua dulce tradicionales de la pesca local."
   },
   {
    "period": "1950 – 1979",
    "from": 1950,
    "to": 1979,
    "event": "Expansión urbana sin saneamiento y derrames",
    "indicators": "Se registran promedios históricos de 15 derrames mensuales en el lago, mientras Maracaibo crece sin plantas de tratamiento de aguas servidas.",
    "impact": "Las más de 100 cañadas de la ciudad comienzan a descargar aguas negras y basura directamente hacia la costa norte y el manglar de Capitán Chico."
   },
   {
    "period": "1981",
    "from": 1981,
    "to": 1981,
    "event": "Creación del ICLAM y alertas sanitarias",
    "indicators": "Se funda el Instituto para el Control y la Conservación de la Cuenca del Lago de Maracaibo (ICLAM) para monitorear la crisis ecológica.",
    "impact": "Los primeros muestreos bacteriológicos detectan niveles críticos de coliformes fecales, restringiendo el uso recreativo de las playas del norte de Maracaibo."
   },
   {
    "period": "1990 – 1999",
    "from": 1990,
    "to": 1999,
    "event": "Aceleración de la eutrofización y tala de mangle",
    "indicators": "Acumulación sostenida de nitrógeno y fósforo en el agua; expansión de rellenos urbanos sobre los humedales costeros.",
    "impact": "Reducción de la franja protectora de mangle rojo (Rhizophora mangle), aumentando la vulnerabilidad de los palafitos ante el oleaje."
   },
   {
    "period": "2004 (Mayo – Ago)",
    "from": 2004,
    "to": 2004,
    "event": "Primera crisis masiva de la lenteja de agua (Lemna sp.)",
    "indicators": "Brote explosivo de Lemna aequinoctialis y Lemna obscura que cubrió entre el 14% y 15% del lago (1.870 km² y 93 millones de m³).",
    "impact": "Paralización total de la pesca artesanal, bloqueo de lanchas, mortandad de peces por anoxia y protestas vecinales por olores fétidos."
   },
   {
    "period": "2005 – 2011",
    "from": 2005,
    "to": 2011,
    "event": "Ciclos recurrentes de Lemna y metales pesados",
    "indicators": "Cada año entre mayo y septiembre reaparecen mantos de lenteja de agua; estudios detectan plomo, níquel, cromo y arsénico en la biomasa vegetal.",
    "impact": "Cierre temporal de restaurantes del bulevar turístico durante los picos de descomposición y pérdida de ingresos familiares."
   },
   {
    "period": "2007",
    "from": 2007,
    "to": 2007,
    "event": "Diagnóstico de pérdida de calidad de vida",
    "indicators": "Investigaciones de postgrado de la Universidad Rafael Urdaneta (URU) documentan la destrucción acelerada del mangle en Santa Rosa.",
    "impact": "Se confirma la relación directa entre la degradación del humedal, el aumento de vectores de enfermedades y el deterioro socioeconómico de los pobladores."
   },
   {
    "period": "2012 (13 de feb)",
    "from": 2012,
    "to": 2012,
    "event": "Creación del Parque Comunal Tierra de Sueños",
    "indicators": "Se delimitan 130 hectáreas de manglar en el sector Punta Capitán Chico para intentar frenar la deforestación y el relleno ilegal.",
    "impact": "A pesar de la figura de protección, el ecosistema sigue recibiendo descargas cloacales sin depurar desde las viviendas adyacentes."
   },
   {
    "period": "2016 – 2021",
    "from": 2016,
    "to": 2021,
    "event": "Colapso de infraestructura petrolera y basura crónica",
    "indicators": "Más de 10.000 instalaciones petroleras abandonadas o sin mantenimiento filtran crudo de forma continua; falla el aseo urbano en Maracaibo.",
    "impact": "El plástico y el petróleo cubren hasta el 90% de las orillas. Jornadas de limpieza extraen 600 kg de basura en apenas 3 horas sin frenar el flujo."
   },
   {
    "period": "2022 (28 de oct)",
    "from": 2022,
    "to": 2022,
    "event": "Inundación severa y deposición de desechos",
    "indicators": "Lluvias torrenciales y crecida del nivel del lago inundan más de 200 viviendas palafíticas y costeras en Santa Rosa de Agua.",
    "impact": "Al bajar el nivel del agua, quedaron expuestas toneladas de plásticos, vidrios, metales y crudo atrapados entre los pilotes y raíces."
   },
   {
    "period": "2022 (Balance anual)",
    "from": 2022,
    "to": 2022,
    "event": "Repunte de derrames petroleros",
    "indicators": "Organizaciones ambientales documentan entre 22 y 32 grandes derrames en el Lago de Maracaibo durante todo el año.",
    "impact": "Pescadores reportan redes inutilizadas por el alquitrán y peces impregnados de hidrocarburos imposibles de vender o consumir."
   },
   {
    "period": "2023 (Jun – Ago)",
    "from": 2023,
    "to": 2023,
    "event": "Explosión de cianobacterias (verdín) y caída comercial",
    "indicators": "Floración masiva de la microalga tóxica Microcystis en toda la costa norte; se activa el Plan Maestro de Rescate del Lago.",
    "impact": "El comercio turístico y gastronómico de Santa Rosa cae un 25%. Se reportan brotes de asma, alergias y erupciones cutáneas en niños y pescadores."
   },
   {
    "period": "2024",
    "from": 2024,
    "to": 2024,
    "event": "Persistencia del verdín y crisis turística",
    "indicators": "El Ministerio de Ecosocialismo reporta miles de jornadas de saneamiento, pero persisten manchas de crudo y cianobacterias en épocas de calor.",
    "impact": "Reportajes de medios como Crónica Uno documentan el abandono progresivo de locales del parador turístico por la pestilencia y el aspecto del agua."
   },
   {
    "period": "2025",
    "from": 2025,
    "to": 2025,
    "event": "Emergencia ambiental en manglares y baja productividad",
    "indicators": "Continúa el arrastre de desechos sólidos por las cañadas durante las lluvias y se reportan incidentes de extravío en zonas densas del manglar Capitán Chico.",
    "impact": "Los cerca de 1.200 pescadores de la comunidad deben navegar cada vez más lejos del estuario para hallar zonas libres de crudo y verdín."
   },
   {
    "period": "2026 (Feb – Oct)",
    "from": 2026,
    "to": 2026,
    "event": "Evaluaciones de balnearios y nuevos derrames",
    "indicators": "En febrero, el ICLAM evalúa el balneario Santa Rosa de Agua bajo el Decreto 883. En agosto, septiembre y octubre se denuncian nuevos derrames de crudo en costas de Maracaibo y 6 municipios del Zulia.",
    "impact": "Persiste la inoperatividad de las plantas de tratamiento anunciadas en 2023, manteniendo el agua contaminada por mezcla de petróleo, verdín y aguas servidas."
   }
  ]
 }
};
