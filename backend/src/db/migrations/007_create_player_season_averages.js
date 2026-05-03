'use strict';

/**
 * Migración 007 — Tabla: player_season_averages
 *
 * Snapshot diario de los promedios de un jugador en la temporada.
 * Es una tabla APPEND-ONLY: nunca se actualiza una fila existente.
 * Cada día de scraping agrega una nueva fila por jugador activo.
 *
 * Esto permite responder preguntas como:
 * "¿Cuántos puntos promediaba LeBron el 15 de enero de 2025?"
 * "¿Cómo evolucionó el promedio de asistencias de Jokic a lo largo de la temporada?"
 *
 * La restricción UNIQUE(player_id, season_id, snapshot_date) garantiza
 * idempotencia: si el scraper corre dos veces el mismo día, la segunda
 * inserción no genera duplicados (INSERT OR IGNORE).
 */

exports.up = async (knex) => {
  await knex.schema.createTable('player_season_averages', (t) => {
    t.increments('id').primary();

    t.integer('player_id').notNullable().references('id').inTable('players');
    t.integer('season_id').notNullable().references('id').inTable('seasons');
    // Equipo del jugador al momento del snapshot
    t.integer('team_id').nullable().references('id').inTable('teams');

    // Fecha del snapshot — identifica cuándo se tomó esta "foto" de los promedios
    t.date('snapshot_date').notNullable();

    // ─── Promedios por partido ────────────────────────────────────────────────
    // Se guardan como DECIMAL(5,2) para representar ej. 23.70 puntos por partido
    t.integer('games_played').nullable();
    t.integer('games_started').nullable();
    t.decimal('min', 5, 2).nullable().comment('Minutos por partido');
    t.decimal('pts', 5, 2).nullable().comment('Puntos por partido');
    t.decimal('reb', 5, 2).nullable().comment('Rebotes por partido');
    t.decimal('ast', 5, 2).nullable().comment('Asistencias por partido');
    t.decimal('stl', 5, 2).nullable().comment('Robos por partido');
    t.decimal('blk', 5, 2).nullable().comment('Tapones por partido');
    t.decimal('tov', 5, 2).nullable().comment('Pérdidas por partido');
    t.decimal('pf', 5, 2).nullable().comment('Faltas por partido');
    t.decimal('fgm', 5, 2).nullable();
    t.decimal('fga', 5, 2).nullable();
    t.decimal('fg_pct', 5, 4).nullable();
    t.decimal('fg3m', 5, 2).nullable();
    t.decimal('fg3a', 5, 2).nullable();
    t.decimal('fg3_pct', 5, 4).nullable();
    t.decimal('ftm', 5, 2).nullable();
    t.decimal('fta', 5, 2).nullable();
    t.decimal('ft_pct', 5, 4).nullable();
    t.decimal('oreb', 5, 2).nullable();
    t.decimal('dreb', 5, 2).nullable();
    t.decimal('plus_minus', 6, 2).nullable();

    // ─── Estadísticas avanzadas ───────────────────────────────────────────────
    t.decimal('efg_pct', 5, 4).nullable();
    t.decimal('ts_pct', 5, 4).nullable().comment('True Shooting %');
    t.decimal('usage_pct', 5, 4).nullable().comment('Usage Rate %');

    // Sin updated_at — los snapshots son inmutables
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Idempotencia: un snapshot por jugador por día
    t.unique(['player_id', 'season_id', 'snapshot_date']);
  });

  await knex.schema.raw('CREATE INDEX idx_psa_player_id     ON player_season_averages (player_id)');
  await knex.schema.raw('CREATE INDEX idx_psa_season_id     ON player_season_averages (season_id)');
  await knex.schema.raw('CREATE INDEX idx_psa_snapshot_date ON player_season_averages (snapshot_date)');
  // "El último snapshot de un jugador en una temporada" — consulta muy frecuente
  await knex.schema.raw('CREATE INDEX idx_psa_player_season ON player_season_averages (player_id, season_id, snapshot_date)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('player_season_averages');
};
