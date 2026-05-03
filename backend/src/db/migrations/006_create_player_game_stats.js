'use strict';

/**
 * Migración 006 — Tabla: player_game_stats
 *
 * Estadísticas individuales de cada jugador en cada partido.
 * Es la tabla más grande y más consultada del sistema:
 * ~25 jugadores × 2 equipos × 82 partidos × 30 equipos = ~61 500 filas/temporada.
 * Con histórico de varias temporadas puede superar el millón de filas.
 *
 * Decisiones de diseño:
 * - season_id y game_date están DESNORMALIZADOS en esta tabla.
 *   Evitan un JOIN a games() en cada consulta analítica, lo que es crucial
 *   para leaderboards, promedios acumulados y reportes por rango de fechas.
 * - did_not_play separa "no hay datos" de "el jugador no jugó ese partido".
 *   Importante para calcular promedios correctamente (excluir DNP).
 * - team_id registra el equipo del jugador ESA NOCHE — fuente de verdad
 *   para traspasos durante la temporada.
 */

exports.up = async (knex) => {
  await knex.schema.createTable('player_game_stats', (t) => {
    t.increments('id').primary();

    // Claves foráneas al partido, jugador, equipo y temporada
    t.integer('game_id').notNullable().references('id').inTable('games').onDelete('CASCADE');
    t.integer('player_id').notNullable().references('id').inTable('players');
    // Equipo del jugador en ESTE partido (puede diferir de players.current_team_id tras un traspaso)
    t.integer('team_id').notNullable().references('id').inTable('teams');
    // Desnormalizado para evitar JOIN a games en consultas de temporada completa
    t.integer('season_id').notNullable().references('id').inTable('seasons');

    // ─── Control de participación ─────────────────────────────────────────────
    // TRUE si el jugador estaba en el equipo pero no jugó (lesión, decisión técnica, etc.)
    t.boolean('did_not_play').notNullable().defaultTo(false);
    // Razón del DNP: 'INJURY', 'COACH\'S DECISION', 'REST', 'ILLNESS', etc.
    t.string('dnp_reason', 80).nullable();

    // Minutos jugados como decimal (ej. 34.55 = 34 min 33 seg)
    t.decimal('minutes_played', 6, 2).nullable();

    // Posición de inicio: 'G', 'F', 'C' — NULL si es suplente
    t.string('start_position', 5).nullable();

    // ─── Tiros de campo ──────────────────────────────────────────────────────
    t.integer('fgm').nullable();
    t.integer('fga').nullable();
    t.decimal('fg_pct', 5, 4).nullable();
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

    // ─── Contadores principales ───────────────────────────────────────────────
    t.integer('ast').nullable();
    t.integer('stl').nullable();
    t.integer('blk').nullable();
    t.integer('tov').nullable().comment('Pérdidas de balón');
    t.integer('pf').nullable().comment('Faltas personales');
    t.integer('pts').nullable().comment('Puntos anotados');
    t.integer('plus_minus').nullable();

    // ─── Estadísticas avanzadas (opcionales, calculadas o scrapeadas) ─────────
    t.decimal('true_shooting_pct', 5, 4).nullable().comment('Porcentaje de tiro verdadero TS%');
    t.decimal('usage_pct', 5, 4).nullable().comment('Porcentaje de posesiones usadas USG%');
    t.decimal('assist_pct', 5, 4).nullable().comment('Porcentaje de asistencias AST%');
    t.decimal('rebound_pct', 5, 4).nullable().comment('Porcentaje de rebotes REB%');
    // eFG% = (FGM + 0.5 × FG3M) / FGA — pondera los triples
    t.decimal('efg_pct', 5, 4).nullable().comment('Porcentaje de tiro efectivo eFG%');

    // Desnormalizado: evita JOIN a games para filtros por fecha
    t.date('game_date').notNullable();

    // Un jugador no puede tener dos filas para el mismo partido
    t.unique(['game_id', 'player_id']);

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Índices individuales sobre FKs y columnas de filtro
  await knex.schema.raw('CREATE INDEX idx_pgs_game_id    ON player_game_stats (game_id)');
  await knex.schema.raw('CREATE INDEX idx_pgs_player_id  ON player_game_stats (player_id)');
  await knex.schema.raw('CREATE INDEX idx_pgs_team_id    ON player_game_stats (team_id)');
  await knex.schema.raw('CREATE INDEX idx_pgs_season_id  ON player_game_stats (season_id)');
  await knex.schema.raw('CREATE INDEX idx_pgs_game_date  ON player_game_stats (game_date)');

  // Índices compuestos para las consultas analíticas más frecuentes
  // "Todos los partidos del jugador X en la temporada Y"
  await knex.schema.raw('CREATE INDEX idx_pgs_player_season      ON player_game_stats (player_id, season_id)');
  // "Todos los jugadores del equipo X esta temporada"
  await knex.schema.raw('CREATE INDEX idx_pgs_team_season        ON player_game_stats (team_id, season_id)');
  // "Partidos en un rango de fechas de esta temporada"
  await knex.schema.raw('CREATE INDEX idx_pgs_season_date        ON player_game_stats (season_id, game_date)');
  // "Historial de un jugador en la temporada en orden cronológico"
  await knex.schema.raw('CREATE INDEX idx_pgs_player_season_date ON player_game_stats (player_id, season_id, game_date)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('player_game_stats');
};
