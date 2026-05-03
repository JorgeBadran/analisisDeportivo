'use strict';

/**
 * Clase de error personalizada para la API.
 *
 * Extiende el Error nativo de JavaScript agregando:
 * - statusCode: código HTTP que se enviará al cliente (400, 404, 503, etc.)
 * - code: identificador de máquina del error (ej. 'GAME_NOT_FOUND') para que
 *         los consumidores de la API puedan distinguir errores programáticamente
 * - details: información adicional opcional (ej. lista de campos inválidos)
 *
 * El middleware errorHandler.js captura instancias de esta clase y las serializa
 * automáticamente al formato JSON estándar de la API.
 *
 * Uso típico en un servicio:
 *   throw ApiError.notFound(`Game ${id} not found`, 'GAME_NOT_FOUND');
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - Código HTTP de la respuesta
   * @param {string} message    - Mensaje legible por humanos
   * @param {string} [code]     - Código identificador para el cliente
   * @param {*}      [details]  - Detalles adicionales opcionales
   */
  constructor(statusCode, message, code, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details || null;
    // Captura el stack trace omitiendo el constructor para que apunte al sitio del throw
    Error.captureStackTrace(this, this.constructor);
  }

  /** HTTP 400 — parámetro inválido o faltante en la petición */
  static badRequest(message, code, details) {
    return new ApiError(400, message, code || 'BAD_REQUEST', details);
  }

  /** HTTP 404 — el recurso solicitado no existe */
  static notFound(message, code) {
    return new ApiError(404, message, code || 'NOT_FOUND');
  }

  /** HTTP 503 — el scraper falló después de todos los reintentos */
  static serviceUnavailable(message) {
    return new ApiError(503, message, 'SCRAPER_UNAVAILABLE');
  }

  /** HTTP 429 — el cliente superó el límite de peticiones por minuto */
  static tooManyRequests() {
    return new ApiError(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED');
  }
}

module.exports = ApiError;
