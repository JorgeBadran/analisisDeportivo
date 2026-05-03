'use strict';

/**
 * Middleware global de manejo de errores.
 * Express lo reconoce como handler de error porque recibe 4 parámetros (err, req, res, next).
 * Debe registrarse DESPUÉS de todas las rutas en app.js para capturar cualquier error.
 *
 * Distingue dos tipos de error:
 * - ApiError: errores esperados y controlados (400, 404, 503...) → respuesta JSON estructurada
 * - Error genérico: fallo inesperado → log completo en servidor, respuesta 500 genérica al cliente
 *   (no se expone el stack trace al cliente por razones de seguridad)
 */

const ApiError = require('../utils/ApiError');

/**
 * @param {Error}    err  - Error capturado por Express o lanzado con next(err)
 * @param {object}   req  - Objeto de petición de Express
 * @param {object}   res  - Objeto de respuesta de Express
 * @param {Function} next - Función next (requerida por Express para identificarlo como error handler)
 */
function errorHandler(err, req, res, next) {
  // Errores controlados: devolver el código y mensaje definidos en ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
      // Incluir details solo si existen (ej. lista de campos inválidos en validación)
      ...(err.details && { details: err.details }),
    });
  }

  // Error inesperado: registrar el stack completo en el servidor para diagnóstico
  console.error(err);

  // Responder con 500 genérico sin exponer detalles internos al cliente
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}

module.exports = errorHandler;
