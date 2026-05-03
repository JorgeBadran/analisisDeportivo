# NBA Statistics API

API REST para consultar estadísticas de la NBA en tiempo real. Extrae datos directamente de `stats.nba.com` usando Puppeteer (navegador headless Chrome) para evadir las protecciones anti-bot, los almacena en una base de datos SQLite local y los sirve con caché en memoria para respuestas rápidas.

---

## Para qué sirve

Este proyecto permite consultar, desde cualquier cliente HTTP, datos oficiales de la NBA sin depender de una API de pago:

- Marcadores y resultados del día
- Boxscores completos (estadísticas por jugador en un partido)
- Calendario de la temporada
- Estadísticas individuales de jugadores (partido a partido y promedios)
- Estadísticas de equipos
- Clasificación de conferencias y divisiones

Los datos se guardan en SQLite para poder consultarlos offline y se actualizan automáticamente cada día a las 6:00 AM mediante un scheduler interno.

---

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Google Chrome instalado (Puppeteer lo detecta automáticamente)

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de variables de entorno
cp .env.example .env

# 3. Arrancar en modo desarrollo
npm run dev
```

El servidor queda disponible en `http://localhost:3000/api/v1`.

---

## Scripts disponibles

| Script | Comando | Descripción |
|---|---|---|
| Producción | `npm start` | Arranca el servidor |
| Desarrollo | `npm run dev` | Arranca con auto-reload (nodemon) |
| Migraciones | `npm run migrate` | Aplica migraciones pendientes |
| Rollback | `npm run migrate:rollback` | Revierte la última migración |
| Scrape manual | `npm run scrape:now` | Ejecuta el job de scraping inmediatamente |
| Seed temporada | `npm run seed:season` | Inserta la temporada 2024-25 en la BD |

---

## Variables de entorno (.env)

```env
# Servidor
PORT=3000
NODE_ENV=development
API_PREFIX=/api/v1

# Puppeteer (navegador headless)
PUPPETEER_HEADLESS=true
PUPPETEER_LAUNCH_TIMEOUT=30000
PUPPETEER_PAGE_TIMEOUT=15000

# Retardo entre peticiones al scraper (ms) para evitar bloqueos
REQUEST_DELAY_MIN=50
REQUEST_DELAY_MAX=300

# TTL del caché en segundos
CACHE_TTL_LIVE_SCORES=30
CACHE_TTL_FINAL_SCORES=3600
CACHE_TTL_SCHEDULE=86400
CACHE_TTL_PLAYER_LOG=300
CACHE_TTL_PLAYER_AVG=900
CACHE_TTL_TEAM=3600
CACHE_TTL_STANDINGS=300

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# NBA
NBA_SEASON=2024-25
NBA_SEASON_TYPE=Regular Season

# Scheduler diario
SCRAPE_ENABLED=true
SCRAPE_CRON=0 6 * * *
```

---

## Endpoints de la API

La URL base de todos los endpoints es `/api/v1`.

### Descubrimiento

#### `GET /api/v1/`
Devuelve un índice con todos los endpoints disponibles. Útil como health-check.

```json
{
  "status": "success",
  "message": "NBA Statistics API",
  "version": "1.0.0",
  "endpoints": {
    "games": "/api/v1/games",
    "schedule": "/api/v1/schedule",
    "players": "/api/v1/players/:playerId/stats",
    "teams": "/api/v1/teams",
    "standings": "/api/v1/standings",
    "scrape": "/api/v1/scrape"
  }
}
```

---

### Partidos

#### `GET /api/v1/games`
Devuelve el marcador de todos los partidos de una fecha. Si no se indica fecha, usa el día actual.

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `date` | string | No | Fecha en formato `YYYY-MM-DD`. Por defecto: hoy |
| `status` | string | No | Filtro: `live`, `final`, `upcoming` |

```bash
# Partidos de hoy
GET /api/v1/games

# Partidos de una fecha específica
GET /api/v1/games?date=2025-03-15

# Solo partidos finalizados
GET /api/v1/games?date=2025-03-15&status=final
```

**Respuesta:**
```json
{
  "status": "success",
  "data": [
    {
      "gameId": "0022401001",
      "status": "final",
      "homeTeam": { "teamId": 1610612747, "abbreviation": "LAL", "score": 112 },
      "awayTeam": { "teamId": 1610612738, "abbreviation": "BOS", "score": 108 },
      "period": 4,
      "gameClock": "Final",
      "gameDate": "2025-03-15"
    }
  ]
}
```

---

#### `GET /api/v1/games/:gameId/boxscore`
Devuelve las estadísticas completas de cada jugador en un partido concreto: puntos, rebotes, asistencias, minutos jugados, porcentajes de tiro, etc.

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `gameId` | string (URL) | Sí | ID del partido NBA (ej. `0022401001`) |

```bash
GET /api/v1/games/0022401001/boxscore
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "gameId": "0022401001",
    "homeTeam": {
      "teamId": 1610612747,
      "players": [
        {
          "playerId": 2544,
          "name": "LeBron James",
          "minutes": "38:22",
          "points": 28,
          "rebounds": 8,
          "assists": 10,
          "steals": 2,
          "blocks": 1,
          "fieldGoalsMade": 11,
          "fieldGoalsAttempted": 20,
          "threesMade": 2,
          "threesAttempted": 5,
          "freeThrowsMade": 4,
          "freeThrowsAttempted": 4,
          "plusMinus": 12
        }
      ]
    },
    "awayTeam": {}
  }
}
```

---

### Calendario

#### `GET /api/v1/schedule`
Devuelve el calendario completo de la temporada con opción de filtrar por equipo y rango de fechas. Soporta paginación.

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `season` | string | No | Temporada (ej. `2024-25`). Por defecto: temporada actual |
| `teamId` | number | No | ID del equipo NBA para filtrar sus partidos |
| `from` | string | No | Fecha de inicio (`YYYY-MM-DD`) |
| `to` | string | No | Fecha de fin (`YYYY-MM-DD`) |
| `page` | number | No | Número de página (default: `1`) |
| `limit` | number | No | Resultados por página (default: `20`, máx: `100`) |

```bash
# Primeros 10 partidos de la temporada
GET /api/v1/schedule?season=2024-25&limit=10

# Partidos de los Lakers en marzo
GET /api/v1/schedule?teamId=1610612747&from=2025-03-01&to=2025-03-31
```

---

### Jugadores

#### `GET /api/v1/players/:playerId/stats`
Devuelve el historial de partidos del jugador en la temporada indicada con sus estadísticas partido a partido. Soporta paginación.

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `playerId` | number (URL) | Sí | ID del jugador NBA (ej. `2544` = LeBron James) |
| `season` | string | No | Temporada (ej. `2024-25`) |
| `seasonType` | string | No | `Regular Season` o `Playoffs` |
| `page` | number | No | Número de página |
| `limit` | number | No | Resultados por página |

```bash
# Estadísticas de LeBron James en la temporada actual
GET /api/v1/players/2544/stats

# Estadísticas de playoffs, página 2
GET /api/v1/players/2544/stats?seasonType=Playoffs&page=2&limit=10
```

---

#### `GET /api/v1/players/:playerId/averages`
Devuelve los promedios de la temporada del jugador: puntos por partido, rebotes, asistencias, porcentajes, etc.

```bash
GET /api/v1/players/2544/averages
GET /api/v1/players/2544/averages?season=2023-24
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "playerId": 2544,
    "name": "LeBron James",
    "season": "2024-25",
    "gamesPlayed": 65,
    "pointsPerGame": 24.1,
    "reboundsPerGame": 8.3,
    "assistsPerGame": 9.8,
    "fieldGoalPercentage": 0.521,
    "threePointPercentage": 0.411,
    "freeThrowPercentage": 0.748
  }
}
```

---

### Equipos

#### `GET /api/v1/teams`
Devuelve todos los equipos de la NBA con sus estadísticas de la temporada: puntos por partido, ritmo de juego, eficiencia ofensiva/defensiva, etc.

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `conference` | string | No | `East` o `West` |
| `division` | string | No | Nombre de la división (ej. `Pacific`) |
| `season` | string | No | Temporada (ej. `2024-25`) |

```bash
# Todos los equipos
GET /api/v1/teams

# Solo equipos del Oeste
GET /api/v1/teams?conference=West
```

---

#### `GET /api/v1/teams/:teamId`
Devuelve el detalle de un equipo junto con su roster (lista de jugadores) actualizado.

```bash
# Detalle de los Los Angeles Lakers
GET /api/v1/teams/1610612747
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "teamId": 1610612747,
    "name": "Los Angeles Lakers",
    "abbreviation": "LAL",
    "conference": "West",
    "division": "Pacific",
    "stats": {
      "wins": 45,
      "losses": 30,
      "pointsPerGame": 115.4
    },
    "roster": [
      { "playerId": 2544, "name": "LeBron James", "position": "SF", "jersey": "23" }
    ]
  }
}
```

---

### Clasificación

#### `GET /api/v1/standings`
Devuelve la clasificación actual de la NBA ordenada por conferencia o división.

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `season` | string | No | Temporada (ej. `2024-25`) |
| `group` | string | No | `conference` (default) o `division` |
| `conference` | string | No | Filtra por `East` o `West` |

```bash
# Clasificación por conferencias
GET /api/v1/standings

# Solo conferencia Este
GET /api/v1/standings?conference=East

# Agrupada por divisiones
GET /api/v1/standings?group=division
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "East": [
      {
        "rank": 1,
        "teamId": 1610612738,
        "name": "Boston Celtics",
        "wins": 61,
        "losses": 14,
        "winPercentage": 0.813,
        "gamesBehind": 0,
        "homeRecord": "33-5",
        "awayRecord": "28-9",
        "lastTen": "8-2",
        "streak": "W3"
      }
    ],
    "West": []
  }
}
```

---

### Scraping

#### `GET /api/v1/scrape/logs`
Devuelve el historial de ejecuciones del scraper para monitorear el estado de los jobs.

| Parámetro | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `type` | string | No | Tipo de scrape: `full_daily`, `scoreboard`, `team_stats`, etc. |
| `limit` | number | No | Número de registros a devolver (default: `20`) |

```bash
GET /api/v1/scrape/logs
GET /api/v1/scrape/logs?type=full_daily&limit=5
```

**Respuesta:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 42,
      "scrapeType": "full_daily",
      "status": "success",
      "triggeredBy": "scheduler",
      "startedAt": "2025-04-30T06:00:01.000Z",
      "finishedAt": "2025-04-30T06:04:33.000Z",
      "durationMs": 272000,
      "recordsFetched": 1240,
      "recordsInserted": 85,
      "recordsUpdated": 320
    }
  ]
}
```

---

#### `POST /api/v1/scrape/run`
Dispara manualmente el job completo de scraping sin esperar a la ejecución automática. Responde de inmediato y el job corre en segundo plano.

```bash
curl -X POST http://localhost:3000/api/v1/scrape/run
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Scrape job started."
}
```

> El progreso se puede seguir consultando `GET /api/v1/scrape/logs`.

---

## Formato de respuesta

Todos los endpoints siguen la misma estructura:

**Éxito:**
```json
{
  "status": "success",
  "meta": { "page": 1, "limit": 20, "total": 150 },
  "data": []
}
```

**Error:**
```json
{
  "status": "error",
  "code": "GAME_NOT_FOUND",
  "message": "No game found with id 0022401999"
}
```

### Códigos de error

| Código | HTTP | Descripción |
|---|---|---|
| `GAME_NOT_FOUND` | 404 | El partido solicitado no existe |
| `PLAYER_NOT_FOUND` | 404 | El jugador solicitado no existe |
| `TEAM_NOT_FOUND` | 404 | El equipo solicitado no existe |
| `INVALID_DATE_FORMAT` | 400 | La fecha no tiene formato `YYYY-MM-DD` |
| `SCRAPER_UNAVAILABLE` | 503 | El scraper falló después de 3 intentos |
| `RATE_LIMIT_EXCEEDED` | 429 | Se superó el límite de peticiones por minuto |

---

## Arquitectura

```
Cliente HTTP
     ↓
src/server.js          Arranca Chrome + scheduler + Express
src/app.js             Middlewares globales (CORS, Helmet, Morgan)
src/routes/            Define URLs y delega a controladores
src/controllers/       Valida parámetros, llama al servicio
src/services/          Lógica de negocio + caché en memoria
src/scrapers/          Puppeteer → stats.nba.com / ESPN
src/db/repositories/   Lectura y escritura en SQLite
     ↓
   SQLite (nba_stats.db)
```

### Base de datos (12 tablas)

| Tabla | Descripción |
|---|---|
| `seasons` | Temporadas NBA registradas |
| `teams` | Los 30 equipos de la NBA |
| `players` | Jugadores activos e históricos |
| `games` | Partidos con marcador y estado |
| `game_team_stats` | Estadísticas del equipo en cada partido |
| `player_game_stats` | Estadísticas del jugador en cada partido |
| `player_season_averages` | Snapshot diario de promedios de temporada |
| `team_season_stats` | Snapshot diario de estadísticas de equipo |
| `standings_snapshots` | Snapshot diario de la clasificación |
| `scrape_logs` | Historial de ejecuciones del scraper |
| `scrape_errors` | Errores detallados por job |
| `data_changes` | Auditoría de cambios detectados en los datos |

### Caché en memoria

| Datos | TTL |
|---|---|
| Marcadores en vivo | 30 segundos |
| Resultados finales | 1 hora |
| Boxscores finales | 6 horas |
| Calendario | 24 horas |
| Log de partidos (jugador) | 5 minutos |
| Promedios de jugador | 15 minutos |
| Estadísticas de equipo | 1 hora |
| Clasificación | 5 minutos |

---

## Primeros pasos recomendados

```bash
# 1. Instalar y arrancar
npm install
cp .env.example .env
npm run dev

# 2. Insertar la temporada actual en la base de datos
npm run seed:season

# 3. Ejecutar el primer scrape completo (tarda ~3-5 minutos)
npm run scrape:now

# 4. Consultar la clasificación
curl http://localhost:3000/api/v1/standings

# 5. Ver el log del scrape
curl http://localhost:3000/api/v1/scrape/logs
```

---

## Tecnologías utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4.x | Framework HTTP |
| Puppeteer | 22.x | Scraping con Chrome headless |
| Knex.js | 3.x | Query builder y migraciones |
| better-sqlite3 | 9.x | Base de datos SQLite |
| node-cache | 5.x | Caché en memoria |
| node-cron | 3.x | Scheduler de jobs diarios |
| Helmet | 7.x | Seguridad HTTP headers |
| express-rate-limit | 7.x | Rate limiting |
| Morgan | 1.x | Logs de peticiones HTTP |
