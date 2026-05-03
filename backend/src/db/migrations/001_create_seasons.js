'use strict';

/**
 * Migración 001 — Tabla: seasons
 *
 * Registro de temporadas NBA. Es la tabla raíz del modelo:
 * casi todas las demás tablas tienen un FK a seasons(id).
 *
 * Una temporada puede tener múltiples registros si se diferencian por
 * season_type (Regular Season vs Playoffs). Lo más habitual es tener
 * un registro por año natural con is_current marcando la activa.
 */

exports.up = async (knex) => {
  await knex.schema.createTable('seasons', (t) => {
    t.increments('id').primary();

    // Identificador legible usado en las URLs de la NBA API, ej. '2024-25'
    t.string('season_id', 10).notNullable().unique();

    t.integer('year_start').notNullable().comment('Año de inicio, ej. 2024');
    t.integer('year_end').notNullable().comment('Año de fin, ej. 2025');

    // Tipo de temporada: 'Regular Season' | 'Playoffs' | 'Preseason'
    t.string('season_type', 20).notNullable().defaultTo('Regular Season');

    t.date('start_date').notNullable();
    t.date('end_date').notNullable();

    // Bandera de temporada activa (solo un registro con TRUE a la vez)
    t.boolean('is_current').notNullable().defaultTo(false);

    // Campos de auditoría
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Índice para encontrar la temporada actual rápidamente
  await knex.schema.raw(
    'CREATE INDEX idx_seasons_is_current ON seasons (is_current)'
  );
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('seasons');
};
