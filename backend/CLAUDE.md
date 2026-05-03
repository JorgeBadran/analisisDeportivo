# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install                        # Install dependencies
npm run dev                        # Development with auto-reload
npm start                          # Production
npm run migrate                    # Run DB migrations
npm run migrate:rollback           # Rollback last migration
npm run migrate:make <name>        # Create new migration
npm run scrape:now                 # Trigger full manual scrape
npm run seed:season                # Initialize 2024-25 season in DB
```

First-time setup: `npm install && cp .env.example .env && npm run dev`

## Architecture

NBA statistics REST API that scrapes `stats.nba.com` via Puppeteer, stores data in SQLite via Knex, and serves it through Express with in-memory caching.

**Request flow:**
```
Router → Controller (validation) → Service (cache check)
  → [cache hit] → response
  → [cache miss] → Scraper → Transform → Repository (SQLite) → Cache → response
```

**Key layers:**
- `src/scrapers/nba/` — Puppeteer-based scrapers; `src/scrapers/espn/` is fallback for live scores
- `src/services/` — Business logic, owns cache read/write
- `src/db/repositories/` — Data access (BaseRepository + specializations)
- `src/utils/transform/` — Normalizes raw NBA/ESPN data into API response format
- `src/scheduler/DailyScrapeJob.js` — Orchestrates full daily scrape (runs at 6:00 AM UTC via node-cron)

**Puppeteer singleton** (`src/scrapers/browser.js`): one Chrome process shared across all scrapers; auto-reconnects on crash, shuts down gracefully on SIGTERM/SIGINT.

**Caching** (`src/config/cache.js`): node-cache with per-resource TTLs (live scores 30s, final scores 1h, boxscores 6h, schedule 24h, standings/player logs 5min).

## Database

SQLite in development (`data/nba.db`), PostgreSQL in production. Knex config in `knexfile.js`; migrations in `src/db/migrations/`.

Connection pool is min=1, max=1 for SQLite (single writer). `useNullAsDefault` is required for SQLite compatibility.

Key tables: `games`, `game_team_stats`, `player_game_stats`, `player_season_averages` (daily snapshots), `standings_snapshots`, `scrape_logs`, `scrape_errors`.

## Configuration

All runtime config loaded from `.env` via `src/config/index.js`. Key variables:
- `DB_CLIENT` / `DB_PATH` / `DATABASE_URL` — database
- `PUPPETEER_HEADLESS`, `PUPPETEER_LAUNCH_TIMEOUT`, `PUPPETEER_PAGE_TIMEOUT`
- `REQUEST_DELAY_MIN` / `REQUEST_DELAY_MAX` — anti-bot random delays (50–300ms)
- `CACHE_TTL_*` — per-resource cache TTLs
- `SCRAPE_ENABLED` / `SCRAPE_CRON` — scheduler
- `NBA_SEASON` / `NBA_SEASON_TYPE`

## Anti-Bot

NBA Stats requires specific headers (`x-nba-stats-origin`, `x-nba-stats-token`) and a realistic Chrome user-agent. These are configured in `src/config/puppeteer.js` and `src/scrapers/nba/client.js`. Random delays between requests are enforced in scrapers.

## API

Base: `GET /api/v1` (discovery). Endpoints: `/games`, `/games/:gameId/boxscore`, `/schedule`, `/players/:playerId/stats`, `/players/:playerId/averages`, `/teams`, `/teams/:teamId`, `/standings`, `/scrape/logs`, `POST /scrape/run`.

Rate limiting: 100 req/min per IP (configurable via `RATE_LIMIT_*` env vars).
