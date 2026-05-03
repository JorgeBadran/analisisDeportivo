'use strict';

/**
 * Migración 005 — Tabla: game_team_stats
 *
 * Estadísticas totales del equipo por partido (boxscore a nivel de equipo).
 * Siempre hay exactamente 2 filas por partido (local y visitante).
 *
 * Se completa con datos de boxscoretraditionalv3 después de que el partido finaliza.
 * El campo is_home permite distinguir local/visitante sin hacer JOIN a games.
 */

exports.up = async (knex) => {
  await knex.schema.createTable('game_team_stats', (t) => {
    t.increments('id').primary();

    // FK al partido
    t.integer('game_id').notNullable().references('id').inTable('games').onDelete('CASCADE');
    // FK al equipo
    t.integer('team_id').notNullable().references('id').inTable('teams');

    // true = equipo local; false = visitante
    t.boolean('is_home').notNullable();

    // ─── Puntuación por cuarto ───────────────────────────────────────────────
    t.integer('points').nullable();
    t.integer('points_q1').nullable();
    t.integer('points_q2').nullable();
    t.integer('points_q3').nullable();
    t.integer('points_q4').nullable();
    t.integer('points_ot1').nullable();
    t.integer('points_ot2').nullable();

    // ─── Tiros de campo ──────────────────────────────────────────────────────
    t.integer('fgm').nullable().comment('Tiros de campo anotados');
    t.integer('fga').nullable().comment('Tiros de campo intentados');
    t.decimal('fg_pct', 5, 4).nullable().comment('Porcentaje de tiros de campo');
    t.integer('fg3m').nullable().comment('Triples anotados');
    t.integer('fg3a').nullable().comment('Triples intentados');
    t.decimal('fg3_pct', 5, 4).nullable();
    t.integer('ftm').nullable().comment('Tiros libres anotados');
    t.integer('fta').nullable().comment('Tiros libres intentados');
    t.decimal('ft_pct', 5, 4).nullable();

    // ─── Rebotes ─────────────────────────────────────────────────────────────
    t.integer('oreb').nullable().comment('Rebotes ofensivos');
    t.integer('dreb').nullable().comment('Rebotes defensivos');
    t.integer('reb').nullable().comment('Rebotes totales');

    // ─── Otros contadores ────────────────────────────────────────────────────
    t.integer('ast').nullable().comment('Asistencias');
    t.integer('stl').nullable().comment('Robos');
    t.integer('blk').nullable().comment('Tapones');
    t.integer('tov').nullable().comment('Pérdidas de balón');
    t.integer('pf').nullable().comment('Faltas personales');
    t.integer('plus_minus').nullable().comment('Diferencial de puntuación');

    // Restricción de unicidad: una sola fila por equipo por partido
    t.unique(['game_id', 'team_id']);

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_gts_game_id   ON game_team_stats (game_id)');
  await knex.schema.raw('CREATE INDEX idx_gts_team_id   ON game_team_stats (team_id)');
  // Consulta: "todos los boxscores del equipo X"
  await knex.schema.raw('CREATE INDEX idx_gts_team_game ON game_team_stats (team_id, game_id)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('game_team_stats');
};
