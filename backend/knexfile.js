'use strict';

/**
 * Configuración de Knex para migraciones y conexión a la base de datos.
 *
 * Soporta dos motores:
 * - SQLite (better-sqlite3): desarrollo local, zero config, fichero ./data/nba.db
 * - PostgreSQL (pg): producción, configurar DATABASE_URL en .env
 *
 * Para cambiar de motor: modificar DB_CLIENT en .env
 *   DB_CLIENT=better-sqlite3  → SQLite
 *   DB_CLIENT=pg              → PostgreSQL
 */

require('dotenv').config();

const path = require('path');

// Configuración compartida para todos los entornos
const shared = {
  migrations: {
    directory: path.join(__dirname, 'src', 'db', 'migrations'),
    // Prefijo numérico en el nombre de archivo asegura orden de ejecución
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, 'src', 'db', 'seeds'),
  },
};

module.exports = {
  // ─── Desarrollo: SQLite ─────────────────────────────────────────────────────
  development: {
    client: process.env.DB_CLIENT || 'better-sqlite3',
    connection: {
      filename: path.resolve(process.env.DB_PATH || './data/nba.db'),
    },
    // SQLite no soporta valores DEFAULT en inserciones; knex inserta NULL en su lugar
    useNullAsDefault: true,
    // Pool mínimo/máximo de conexiones (SQLite solo admite 1 escritor simultáneo)
    pool: { min: 1, max: 1 },
    ...shared,
  },

  // ─── Test: SQLite en memoria (sin fichero) ───────────────────────────────────
  test: {
    client: 'better-sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
    pool: { min: 1, max: 1 },
    ...shared,
  },

  // ─── Producción: PostgreSQL ──────────────────────────────────────────────────
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    // SSL obligatorio en la mayoría de servicios cloud (Heroku, Render, Railway)
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    pool: {
      min: 2,
      max: 10,
      // Tiempo máximo de espera para obtener una conexión del pool (ms)
      acquireTimeoutMillis: 30000,
    },
    ...shared,
  },
};
