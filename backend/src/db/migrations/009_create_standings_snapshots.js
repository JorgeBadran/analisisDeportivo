'use strict';

/**
 * Migración 009 — Tabla: standings_snapshots
 *
 * Snapshot diario de la clasificación de cada equipo.
 * Tabla APPEND-ONLY: una fila por equipo por día de scraping.
 *
 * Permite responder preguntas como:
 * "¿Cuál era la clasificación del Este el 1 de febrero?"
 * "¿Cuándo perdió Milwaukee el liderato de la conferencia?"
 * "Muéstrame cómo escaló OKC en la clasificación durante toda la temporada"
 *
 * streak se guarda como INTEGER con signo:
 *   +3 = racha de 3 victorias (streak_type='W')
 *   -2 = racha de 2 derrotas  (streak_type='L')
 */

exports.up = async (knex) => {
  await knex.schema.createTable('standings_snapshots', (t) => {
    t.increments('id').primary();

    t.integer('team_id').notNullable().references('id').inTable('teams');
    t.integer('season_id').notNullable().references('id').inTable('seasons');
    t.date('snapshot_date').notNullable();

    // ─── Posición en la clasificación ─────────────────────────────────────────
    t.string('conference', 10).notNullable().comment('East | West');
    t.integer('conference_rank').notNullable().comment('Posición en la conferencia (1-15)');
    t.string('division', 20).notNullable();
    t.integer('division_rank').notNullable().comment('Posición en la división (1-5)');

    // ─── Récord ───────────────────────────────────────────────────────────────
    t.integer('wins').notNullable();
    t.integer('losses').notNullable();
    t.decimal('win_pct', 5, 4).notNullable();

    // Juegos de diferencia respecto al líder (NULL si es el primero)
    t.decimal('games_behind', 4, 1).nullable();

    // Récord local y de visitante
    t.integer('home_wins').nullable();
    t.integer('home_losses').nullable();
    t.integer('away_wins').nullable();
    t.integer('away_losses').nullable();

    // Últimos 10 partidos
    t.integer('last_10_wins').nullable();
    t.integer('last_10_losses').nullable();

    // Racha actual (número de partidos, positivo = victorias)
    t.integer('streak').nullable();
    // 'W' = racha de victorias, 'L' = racha de derrotas
    t.string('streak_type', 1).nullable();

    // Indicador de clasificación:
    // 'x' = clasificado a playoffs, 'y' = ganó división, 'z' = mejor récord conferencia
    t.string('clinch_indicator', 10).nullable();

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Idempotencia: un snapshot por equipo por día
    t.unique(['team_id', 'season_id', 'snapshot_date']);
  });

  await knex.schema.raw('CREATE INDEX idx_ss_team_id           ON standings_snapshots (team_id)');
  await knex.schema.raw('CREATE INDEX idx_ss_season_id         ON standings_snapshots (season_id)');
  await knex.schema.raw('CREATE INDEX idx_ss_snapshot_date     ON standings_snapshots (snapshot_date)');
  // Consulta: "clasificación completa de la conferencia X en la fecha Y"
  await knex.schema.raw('CREATE INDEX idx_ss_season_date_conf  ON standings_snapshots (season_id, snapshot_date, conference)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('standings_snapshots');
};
