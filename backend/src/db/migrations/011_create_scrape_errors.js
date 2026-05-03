'use strict';

/**
 * Migración 011 — Tabla: scrape_errors
 *
 * Registro detallado de errores individuales durante un scraping.
 * Un job puede producir muchos errores independientes (uno por partido,
 * jugador o endpoint que falla), por eso están en tabla separada.
 *
 * Con ON DELETE CASCADE: al borrar un scrape_log (raro, solo en limpieza),
 * sus errores asociados se eliminan automáticamente.
 *
 * context es un JSON que guarda el contexto del fallo:
 * { gameId: '0022401234', playerId: 2544, attempt: 3 }
 */

exports.up = async (knex) => {
  await knex.schema.createTable('scrape_errors', (t) => {
    t.increments('id').primary();

    // FK al job que generó este error
    t.integer('scrape_log_id')
      .notNullable()
      .references('id')
      .inTable('scrape_logs')
      .onDelete('CASCADE');

    // Tipo de scraping donde ocurrió el error (redundante con scrape_logs para queries directas)
    t.string('scrape_type', 40).notNullable();

    // Código de error clasificado: 'HTTP_404', 'HTTP_429', 'TIMEOUT', 'PARSE_ERROR', etc.
    t.string('error_code', 40).nullable();

    // Mensaje legible del error
    t.text('error_message').notNullable();

    // Stack trace completo (solo en desarrollo/debug; puede ser NULL en producción)
    t.text('stack_trace').nullable();

    // JSON con contexto específico del error: {gameId, playerId, url, attempt}
    t.text('context').nullable();

    // TRUE si el error es transitorio y puede volver a intentarse
    t.boolean('is_retryable').notNullable().defaultTo(false);
    t.integer('retry_count').notNullable().defaultTo(0);

    t.timestamp('occurred_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_se_scrape_log_id ON scrape_errors (scrape_log_id)');
  await knex.schema.raw('CREATE INDEX idx_se_error_code    ON scrape_errors (error_code)');
  await knex.schema.raw('CREATE INDEX idx_se_occurred_at   ON scrape_errors (occurred_at)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('scrape_errors');
};
