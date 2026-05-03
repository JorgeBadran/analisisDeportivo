'use strict';

/**
 * Utilidades de paginación reutilizables en todos los controladores.
 * La paginación se realiza en memoria sobre arrays ya transformados,
 * lo que es adecuado dado que los datos ya están cacheados.
 */

/**
 * Extrae y valida los parámetros de paginación del query string.
 * Aplica límites mínimos y máximos para evitar valores absurdos.
 *
 * @param {object} query        - req.query de Express
 * @param {number} defaultLimit - Elementos por página por defecto (20)
 * @param {number} maxLimit     - Máximo permitido de elementos por página (82 = temporada NBA)
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query, defaultLimit = 20, maxLimit = 82) {
  // page nunca puede ser menor que 1
  const page = Math.max(1, parseInt(query.page) || 1);
  // limit se clampea entre 1 y maxLimit para evitar peticiones abusivas
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  // offset es el índice de inicio en el array (0-based)
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Construye el objeto meta de paginación que se incluye en cada respuesta.
 *
 * @param {number} page  - Página actual
 * @param {number} limit - Elementos por página
 * @param {number} total - Total de elementos sin paginar
 * @returns {{ page, limit, total, totalPages }}
 */
function buildMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Aplica paginación a un array de resultados ya filtrados.
 *
 * @param {Array}  items  - Array completo de elementos
 * @param {number} offset - Índice de inicio
 * @param {number} limit  - Número de elementos a devolver
 * @returns {Array} Subarray correspondiente a la página solicitada
 */
function paginate(items, offset, limit) {
  return items.slice(offset, offset + limit);
}

module.exports = { parsePagination, buildMeta, paginate };
