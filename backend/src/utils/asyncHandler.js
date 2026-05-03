'use strict';

/**
 * Wrapper para controladores asíncronos de Express.
 *
 * Express no captura automáticamente los errores lanzados dentro de funciones
 * async/await: si un controlador hace `throw new Error(...)`, Express no lo
 * recibe y la petición queda colgada sin respuesta.
 *
 * Este helper envuelve la función del controlador en una promesa y redirige
 * cualquier rechazo al middleware de errores de Express mediante `next(err)`.
 *
 * Uso:
 *   router.get('/ruta', asyncHandler(async (req, res) => { ... }));
 *
 * @param {Function} fn - Función de controlador async (req, res, next) => Promise
 * @returns {Function}  - Función de Express que captura errores async automáticamente
 */
const asyncHandler = (fn) => (req, res, next) => {
  // Envuelve la ejecución y pasa cualquier error a next() para que lo gestione errorHandler.js
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
