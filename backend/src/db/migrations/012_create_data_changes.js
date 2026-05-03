'use strict';

/**
 * Migración 012 — Tabla: data_changes
 *
 * Auditoría de cambios campo a campo detectados durante el scraping.
 * Solo se escribe cuando el valor de un campo IMPORTANTE cambia entre
 * dos ejecuciones consecutivas del scraper.
 *
 * Campos que se auditan:
 * - games: status, home_score, away_score (correcciones de resultados)
 * - players: current_team_id (traspasos), jersey_number, is_active (retiros)
 * - teams: conference, division (reubicaciones extremadamente raras)
 *
 * NO se auditan campos triviales como updated_at para evitar ruido.
 *
 * Uso típico: detectar cuándo se hizo efectivo un traspaso o cuándo
 * se corrigió un resultado oficial de un partido.
 */

exports.up = async (knex) => {
  await knex.schema.createTable('data_changes', (t) => {
    t.increments('id').primary();

    // FK al job de scraping que detectó el cambio
    t.integer('scrape_log_id')
      .notNullable()
      .references('id')
      .inTable('scrape_logs');

    // Tabla donde ocurrió el cambio (ej. 'games', 'players', 'teams')
    t.string('table_name', 60).notNullable();

    // PK de la fila que cambió
    t.integer('record_id').notNullable();

    // Campo específico que cambió (ej. 'status', 'home_score', 'current_team_id')
    t.string('field_name', 60).notNullable();

    // Valores almacenados como TEXT para compatibilidad universal entre tipos
    t.text('old_value').nullable().comment('Valor anterior (NULL si era nuevo)');
    t.text('new_value').nullable().comment('Valor nuevo (NULL si fue eliminado)');

    // Quién hizo el cambio: 'scraper' | 'manual'
    t.string('changed_by', 20).notNullable().defaultTo('scraper');

    t.timestamp('changed_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  // "¿Qué cambios hubo en la fila X de la tabla Y?" (auditoría de un registro)
  await knex.schema.raw('CREATE INDEX idx_dc_table_record   ON data_changes (table_name, record_id)');
  // "¿Qué cambió durante el job Z?"
  await knex.schema.raw('CREATE INDEX idx_dc_scrape_log_id  ON data_changes (scrape_log_id)');
  // "¿Qué cambió ayer?" (reporte cronológico)
  await knex.schema.raw('CREATE INDEX idx_dc_changed_at     ON data_changes (changed_at)');
  // "¿Cuándo cambiaron el team_id de los jugadores?" (auditoría de traspasos)
  await knex.schema.raw('CREATE INDEX idx_dc_field_name     ON data_changes (table_name, field_name)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('data_changes');
};
