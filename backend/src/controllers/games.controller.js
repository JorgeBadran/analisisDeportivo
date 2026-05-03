'use strict';

/**
 * Controlador de partidos (games).
 * Valida los parámetros de entrada, llama al servicio correspondiente
 * y serializa la respuesta JSON.
 *
 * Todos los errores de validación lanzados aquí son capturados por asyncHandler
 * y pasados al middleware errorHandler.js.
 */

const asyncHandler = require('../utils/asyncHandler');
const { getGames, getBoxscore } = require('../services/games.service');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/v1/games
 * Devuelve los partidos de una fecha con marcadores y estado.
 * Si no se pasa ?date, usa la fecha actual en UTC.
 *
 * Query params:
 *   - date   (string, YYYY-MM-DD): fecha del partido; default = hoy
 *   - status (string): filtro 'live' | 'final' | 'upcoming'
 */
const listGames = asyncHandler(async (req, res) => {
  // Usar la fecha actual si no se proporciona (formato YYYY-MM-DD)
  const date = req.query.date || new Date().toISOString().split('T')[0];
  const status = req.query.status;

  // Validar formato de fecha antes de llamar al scraper
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw ApiError.badRequest('date must be YYYY-MM-DD', 'INVALID_DATE_FORMAT');
  }

  // Validar que el valor de status es uno de los permitidos
  const validStatuses = ['live', 'final', 'upcoming'];
  if (status && !validStatuses.includes(status)) {
    throw ApiError.badRequest(`status must be one of: ${validStatuses.join(', ')}`, 'BAD_REQUEST');
  }

  const data = await getGames(date, status);

  res.json({ status: 'success', meta: { date, count: data.length }, data });
});

/**
 * GET /api/v1/games/:gameId/boxscore
 * Devuelve el boxscore completo (estadísticas por jugador) de un partido.
 *
 * Path params:
 *   - gameId (string): ID del partido de la NBA (ej. '0022401001')
 */
const getBoxscoreById = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const data = await getBoxscore(gameId);
  res.json({ status: 'success', data });
});

module.exports = { listGames, getBoxscoreById };
