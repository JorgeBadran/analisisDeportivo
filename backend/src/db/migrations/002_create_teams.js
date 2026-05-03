'use strict';

/**
 * Migración 002 — Tabla: teams
 *
 * Los 30 equipos de la NBA. Tabla casi estática (cambia solo cuando
 * hay expansiones, contracciones o reubicaciones de franquicia).
 *
 * nba_team_id es la clave foránea lógica que usa la API de la NBA.
 * Usamos un id autoincremental como PK interna para que los FK
 * de otras tablas sean enteros compactos en lugar de IDs de 10 dígitos.
 */

exports.up = async (knex) => {
  await knex.schema.createTable('teams', (t) => {
    t.increments('id').primary();

    // ID numérico interno de la NBA (ej. 1610612747 para los Lakers)
    // Se mantiene como UNIQUE para el upsert por nba_team_id
    t.integer('nba_team_id').notNullable().unique();

    // Siglas del equipo (ej. 'LAL'). UNIQUE porque se usan en la URL
    t.string('abbreviation', 5).notNullable().unique();

    t.string('full_name', 60).notNullable();    // 'Los Angeles Lakers'
    t.string('city', 40).notNullable();          // 'Los Angeles'
    t.string('nickname', 40).notNullable();      // 'Lakers'

    // 'East' | 'West'
    t.string('conference', 10).notNullable();

    // 'Atlantic' | 'Central' | 'Southeast' | 'Northwest' | 'Pacific' | 'Southwest'
    t.string('division', 20).notNullable();

    // FALSE para franquicias históricas o futuras expansiones no activas
    t.boolean('is_active').notNullable().defaultTo(true);

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Índices para búsquedas frecuentes
  await knex.schema.raw('CREATE INDEX idx_teams_nba_team_id ON teams (nba_team_id)');
  await knex.schema.raw('CREATE INDEX idx_teams_conference  ON teams (conference)');
  await knex.schema.raw('CREATE INDEX idx_teams_division    ON teams (division)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('teams');
};
