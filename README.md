# 🏀 Análisis Deportivo NBA

Aplicación web full-stack para visualizar estadísticas de la NBA en tiempo real, utilizando la API pública de ESPN.

---

## ✨ Características

- **Partidos del día** — resultados en vivo, finales y próximos partidos con boxscore completo
- **Calendario** — programación de partidos por rango de fechas
- **Clasificación** — tabla de posiciones por conferencia (Este / Oeste) con Win%, racha y récord local/visitante
- **Cuadro de eliminatorias** — bracket de Playoffs interactivo con proyección automática de series futuras
- **Equipos** — detalle de cada equipo (roster, estadísticas) en modal
- **Jugadores** — historial partido a partido con gráfico de evolución y promedios de temporada

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, React Router, Recharts, Vite |
| Backend | Node.js, Express |
| Datos | ESPN Public API (sin API key) |
| Caché | node-cache (TTLs por recurso) |
| Tests | Jest (backend) · Vitest + axios-mock-adapter (frontend) |

---

## 📁 Estructura del proyecto

```
analisis-deportivo/
├── backend/          # API REST (Express)
│   ├── src/
│   │   ├── espn/         # Clientes ESPN (site, web, v2)
│   │   ├── services/     # Lógica de negocio + caché
│   │   ├── controllers/  # Validación y respuesta HTTP
│   │   ├── routes/       # Definición de endpoints
│   │   └── utils/        # ApiError, asyncHandler, paginación
│   └── package.json
└── frontend/         # SPA React
    ├── src/
    │   ├── pages/        # Dashboard, Games, Players, Teams, Standings, Schedule
    │   ├── components/   # PlayoffBracket, Spinner
    │   ├── api/          # Funciones de llamada a la API
    │   └── hooks/        # useFetch
    └── package.json
```

---

## 🚀 Instalación y uso

### Requisitos
- Node.js 18+

### Backend

```bash
cd backend
npm install
cp .env.example .env   # edita el puerto si es necesario
npm run dev            # inicia en http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # inicia en http://localhost:5173
```

---

## 🔌 Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/games` | Partidos (por fecha y estado) |
| GET | `/api/v1/games/:id/boxscore` | Boxscore de un partido |
| GET | `/api/v1/schedule` | Calendario de partidos |
| GET | `/api/v1/standings` | Clasificación por conferencia |
| GET | `/api/v1/playoffs/bracket` | Cuadro de eliminatorias |
| GET | `/api/v1/teams` | Lista de equipos |
| GET | `/api/v1/teams/:id` | Detalle de equipo |
| GET | `/api/v1/players/:id/stats` | Historial de partidos |
| GET | `/api/v1/players/:id/averages` | Promedios de temporada |
| GET | `/api/v1/select/teams` | Equipos para selector |
| GET | `/api/v1/select/teams/:id/players` | Plantel de un equipo |

---

## 📸 Vistas

- **Dashboard** — resumen del día con partidos destacados
- **Partidos** — lista filtrable por fecha con acceso al boxscore
- **Clasificación** — tabla y bracket de playoffs con proyección de series futuras
- **Equipos** — directorio con modal de detalle
- **Jugadores** — selector equipo → jugador → estadísticas + gráfico

---

## 📄 Licencia

MIT
