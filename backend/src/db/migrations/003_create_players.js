'use strict';

/**
 * Migración 003 — Tabla: players
 *
 * Registro de jugadores NBA activos e históricos.
 *
 * current_team_id refleja el equipo al momento del último scraping.
 * La pertenencia histórica a un equipo queda registrada partido a partido
 * en player_game_stats.team_id, que es la fuente de verdad para traspasos.
 *
 * is_active = FALSE no elimina el jugador; lo filtra de las consultas
 * habituales pero mantiene el historial de sus estadísticas intacto.
 */

exports.up = async (knex) => {
  await knex.schema.createTable('players', (t) => {
    t.increments('id').primary();

    // ID numérico de la NBA (ej. 2544 para LeBron James)
    t.integer('nba_player_id').notNullable().unique();

    t.string('first_name', 60).notNullable();
    t.string('last_name', 60).notNullable();

    // Dorsal actual (NULL si el jugador está sin contrato o retirado)
    t.string('jersey_number', 5).nullable();

    // Posición: 'G', 'F', 'C', 'G-F', 'F-C', etc.
    t.string('position', 10).nullable();

    // Equipo actual; NULL si está libre o retirado
    t.integer('current_team_id')
      .nullable()
      .references('id')
      .inTable('teams')
      .onDelete('SET NULL');

    t.boolean('is_active').notNullable().defaultTo(true);

    // Datos biográficos opcionales (enriquecen futuros reportes)
    t.date('birthdate').nullable();
    t.string('country', 60).nullable();
    t.integer('height_cm').nullable();
    t.decimal('weight_kg', 5, 2).nullable();
    t.integer('draft_year').nullable();
    t.integer('draft_round').nullable();
    t.integer('draft_pick').nullable();
    t.integer('years_pro').nullable();

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_players_nba_player_id  ON players (nba_player_id)');
  await knex.schema.raw('CREATE INDEX idx_players_current_team   ON players (current_team_id)');
  await knex.schema.raw('CREATE INDEX idx_players_is_active      ON players (is_active)');
  // Búsqueda por apellido para autocompletado de la UI
  await knex.schema.raw('CREATE INDEX idx_players_last_name      ON players (last_name)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('players');
};
