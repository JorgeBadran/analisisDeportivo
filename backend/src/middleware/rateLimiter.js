'use strict';

/**
 * Middleware de limitación de tasa (rate limiting).
 * Protege la API contra abuso y sobrecarga del scraper.
 *
 * Por defecto: máximo 100 peticiones por minuto por IP.
 * Los límites configurables vía .env: RATE_LIMIT_MAX_REQUESTS y RATE_LIMIT_WINDOW_MS.
 *
 * Al superar el límite, responde con HTTP 429 en el mismo formato JSON de la API
 * en lugar del texto plano por defecto de express-rate-limit.
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');
const ApiError = require('../utils/ApiError');

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // Ventana de tiempo (por defecto 60 000 ms = 1 min)
  max: config.rateLimit.max,           // Máximo de peticiones permitidas en esa ventana

  // Incluir cabeceras estándar RateLimit-* en la respuesta (RFC 6585)
  standardHeaders: true,
  // Deshabilitar cabeceras legacy X-RateLimit-* (deprecadas)
  legacyHeaders: false,

  // Personalizar la respuesta de error para que siga el formato { status, code, message }
  handler: (req, res) => {
    const err = ApiError.tooManyRequests();
    res.status(err.statusCode).json({
      status: 'error',
      code: err.code,
      message: err.message,
    });
  },
});

module.exports = limiter;
