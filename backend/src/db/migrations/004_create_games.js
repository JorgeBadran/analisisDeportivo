'use strict';

/**
 * Migración 004 — Tabla: games
 *
 * Registro de todos los partidos NBA: calendario + resultados.
 * Una misma fila sirve tanto de entrada del calendario (status='Scheduled')
 * como de resultado final (status='Final', con scores rellenos).
 *
 * nba_game_id usa el formato de la NBA: '0022401234'
 * - Dígito 1: '0' (siempre)
 * - Dígitos 2-3: temporada abreviada ('02' = 2002, '24' = 2024)
 * - Dígito 4: tipo ('2' = Regular Season, '4' = Playoffs)
 * - Dígitos 5-10: número secuencial del partido
 */

exports.up = async (knex) => {
  await knex.schema.createTable('games', (t) => {
    t.increments('id').primary();

    // Clave única de la NBA; VARCHAR para preservar los ceros a la izquierda
    t.string('nba_game_id', 20).notNullable().unique();

    // FK a la temporada a la que pertenece el partido
    t.integer('season_id').notNullable().references('id').inTable('seasons');

    t.date('game_date').notNullable();

    // FKs a los equipos local y visitante
    t.integer('home_team_id').notNullable().references('id').inTable('teams');
    t.integer('away_team_id').notNullable().references('id').inTable('teams');

    // Marcadores (NULL mientras el partido no ha terminado)
    t.integer('home_score').nullable();
    t.integer('away_score').nullable();

    // Estado del partido: 'Scheduled' | 'Live' | 'Final'
    t.string('status', 20).notNullable().defaultTo('Scheduled');

    // Texto descriptivo del estado, ej. "Q3 4:22" o "Final/OT"
    t.string('status_text', 60).nullable();

    // Período actual (0 = no empezado, 4 = 4to cuarto, 5+ = prórroga)
    t.integer('period').nullable();

    // Reloj del partido en vivo, ej. "4:22"
    t.string('game_clock', 10).nullable();

    // Datos del recinto
    t.string('arena_name', 80).nullable();
    t.string('arena_city', 60).nullable();
    t.integer('attendance').nullable();

    // Contexto de playoff (NULL para temporada regular)
    t.integer('series_game_number').nullable().comment('Número de partido en la serie de playoffs');

    // Récord de la serie al momento del partido
    t.integer('home_series_wins').nullable();
    t.integer('home_series_losses').nullable();
    t.integer('away_series_wins').nullable();
    t.integer('away_series_losses').nullable();

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Índices para los patrones de consulta más frecuentes
  await knex.schema.raw('CREATE INDEX idx_games_game_date     ON games (game_date)');
  await knex.schema.raw('CREATE INDEX idx_games_season_id     ON games (season_id)');
  await knex.schema.raw('CREATE INDEX idx_games_home_team_id  ON games (home_team_id)');
  await knex.schema.raw('CREATE INDEX idx_games_away_team_id  ON games (away_team_id)');
  await knex.schema.raw('CREATE INDEX idx_games_status        ON games (status)');
  // Consulta compuesta: "todos los partidos del día X en la temporada Y"
  await knex.schema.raw('CREATE INDEX idx_games_season_date   ON games (season_id, game_date)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('games');
};
