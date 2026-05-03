'use strict';

/**
 * Módulo de caché en memoria.
 * Utiliza node-cache para almacenar temporalmente las respuestas del scraper
 * y evitar peticiones repetidas a stats.nba.com en un corto período de tiempo.
 *
 * Formato de claves recomendado: '<recurso>:<parámetros>'
 * Ejemplos: 'games:2025-05-01', 'boxscore:0022401001', 'standings:2024-25:Regular Season'
 */

const NodeCache = require('node-cache');
const config = require('./index');

// useClones: false → los objetos se almacenan por referencia (más rápido, menos memoria).
// Solo es seguro porque nunca mutamos los objetos después de guardarlos en caché.
const cache = new NodeCache({ useClones: false });

// Exportamos los TTLs centralizados para que los servicios los usen directamente
const TTL = config.cache;

/**
 * Obtiene un valor del caché.
 * @param {string} key - Clave del caché
 * @returns {*} El valor almacenado, o undefined si expiró o no existe
 */
function get(key) {
  return cache.get(key);
}

/**
 * Almacena un valor en el caché con un tiempo de vida determinado.
 * @param {string} key   - Clave del caché
 * @param {*}      value - Valor a almacenar
 * @param {number} ttl   - Segundos hasta que expira
 */
function set(key, value, ttl) {
  cache.set(key, value, ttl);
}

/**
 * Elimina una entrada del caché manualmente (por ejemplo, al detectar datos obsoletos).
 * @param {string} key - Clave a eliminar
 */
function del(key) {
  cache.del(key);
}

module.exports = { get, set, del, TTL };
