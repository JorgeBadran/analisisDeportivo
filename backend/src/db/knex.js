'use strict';

/**
 * Singleton de Knex.
 *
 * Exporta una única instancia configurada según NODE_ENV.
 * Todos los repositorios y el scheduler importan desde aquí —
 * nunca crean su propio objeto Knex para garantizar que comparten
 * el mismo pool de conexiones.
 *
 * Uso:
 *   const db = require('../db/knex');
 *   const rows = await db('teams').where({ is_active: true });
 */

const knex = require('knex');
const knexfile = require('../../knexfile');

const env = process.env.NODE_ENV || 'development';
const config = knexfile[env];

if (!config) {
  throw new Error(`No hay configuración de Knex para el entorno: "${env}"`);
}

// Crear y exportar la instancia singleton
const db = knex(config);

module.exports = db;
