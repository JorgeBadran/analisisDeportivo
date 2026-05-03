'use strict';

/**
 * Migración 008 — Tabla: team_season_stats
 *
 * Snapshot diario de las estadísticas de temporada de cada equipo.
 * Tabla APPEND-ONLY: misma filosofía que player_season_averages.
 *
 * Permite analizar la evolución de un equipo a lo largo de la temporada:
 * "¿Cuándo empezó Boston a superar el 50% de victorias?"
 * "¿Cómo cambió el rating ofensivo de los Warriors tras un traspaso?"
 */

exports.up = async (knex) => {
  await knex.schema.createTable('team_season_stats', (t) => {
    t.increments('id').primary();

    t.integer('team_id').notNullable().references('id').inTable('teams');
    t.integer('season_id').notNullable().references('id').inTable('seasons');
    t.date('snapshot_date').notNullable();

    // ─── Registro de victorias y derrotas ─────────────────────────────────────
    t.integer('games_played').nullable();
    t.integer('wins').nullable();
    t.integer('losses').nullable();
    t.decimal('win_pct', 5, 4).nullable();

    // ─── Promedios por partido ────────────────────────────────────────────────
    t.decimal('pts_per_game', 5, 2).nullable().comment('Puntos anotados por partido');
    t.decimal('opp_pts_per_game', 5, 2).nullable().comment('Puntos encajados por partido');
    t.decimal('reb_per_game', 5, 2).nullable();
    t.decimal('ast_per_game', 5, 2).nullable();
    t.decimal('stl_per_game', 5, 2).nullable();
    t.decimal('blk_per_game', 5, 2).nullable();
    t.decimal('tov_per_game', 5, 2).nullable();

    // ─── Porcentajes de tiro ─────────────────────────────────────────────────
    t.decimal('fgm_per_game', 5, 2).nullable();
    t.decimal('fga_per_game', 5, 2).nullable();
    t.decimal('fg_pct', 5, 4).nullable();
    t.decimal('fg3m_per_game', 5, 2).nullable();
    t.decimal('fg3a_per_game', 5, 2).nullable();
    t.decimal('fg3_pct', 5, 4).nullable();
    t.decimal('ftm_per_game', 5, 2).nullable();
    t.decimal('fta_per_game', 5, 2).nullable();
    t.decimal('ft_pct', 5, 4).nullable();

    // ─── Estadísticas avanzadas de equipo ─────────────────────────────────────
    // Ritmo de posesiones por 48 minutos
    t.decimal('pace', 6, 2).nullable().comment('Posesiones por 48 min (ritmo de juego)');
    // Rating ofensivo/defensivo: puntos por 100 posesiones
    t.decimal('off_rating', 6, 2).nullable().comment('Puntos anotados por 100 posesiones');
    t.decimal('def_rating', 6, 2).nullable().comment('Puntos encajados por 100 posesiones');
    // Net Rating = OffRtg - DefRtg (medida general de calidad del equipo)
    t.decimal('net_rating', 6, 2).nullable().comment('Diferencia OffRtg - DefRtg');

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    t.unique(['team_id', 'season_id', 'snapshot_date']);
  });

  await knex.schema.raw('CREATE INDEX idx_tss_team_id          ON team_season_stats (team_id)');
  await knex.schema.raw('CREATE INDEX idx_tss_season_id        ON team_season_stats (season_id)');
  await knex.schema.raw('CREATE INDEX idx_tss_snapshot_date    ON team_season_stats (snapshot_date)');
  await knex.schema.raw('CREATE INDEX idx_tss_team_season_date ON team_season_stats (team_id, season_id, snapshot_date)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('team_season_stats');
};
