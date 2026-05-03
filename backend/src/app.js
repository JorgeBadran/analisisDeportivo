'use strict';

/**
 * Fábrica de la aplicación Express.
 * Configura y registra todos los middlewares y rutas en el orden correcto.
 * No inicia el servidor (eso lo hace server.js) para facilitar las pruebas.
 *
 * Orden del pipeline de middlewares (importante — Express los procesa en orden):
 * 1. helmet()        → cabeceras de seguridad HTTP
 * 2. cors()          → permitir peticiones cross-origin
 * 3. express.json()  → parsear body JSON
 * 4. requestLogger   → log de cada petición entrante
 * 5. rateLimiter     → limitar peticiones por IP
 * 6. apiRouter       → rutas de la API (games, schedule, players, teams, standings)
 * 7. notFound        → capturar rutas inexistentes → 404
 * 8. errorHandler    → capturar cualquier error lanzado en los pasos anteriores → JSON
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const { swaggerOptions } = require('./config/swagger');
const requestLogger = require('./middleware/requestLogger');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const apiRouter = require('./routes/index');

const app = express();

// Swagger UI — sin helmet para esta ruta (CSP bloquearía los assets de la UI)
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'NBA Statistics API — Docs',
  swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Seguridad: añade cabeceras HTTP de protección (X-Frame-Options, CSP, etc.)
app.use(helmet());

// CORS: permite peticiones desde cualquier origen (ajustar en producción si es necesario)
app.use(cors());

// Parsear cuerpos JSON en las peticiones entrantes
app.use(express.json());

// Log de peticiones HTTP (formato 'dev' en desarrollo, 'combined' en producción)
app.use(requestLogger);

// Limitar peticiones por IP para proteger el scraper de abuso
app.use(rateLimiter);

// Montar todas las rutas de la API bajo el prefijo configurado (ej. /api/v1)
app.use(config.apiPrefix, apiRouter);

// Middleware 404: captura cualquier ruta que no coincidió con las anteriores
app.use(notFound);

// Middleware de errores: debe ser el ÚLTIMO porque necesita capturar errores de todo lo anterior
app.use(errorHandler);

module.exports = app;
