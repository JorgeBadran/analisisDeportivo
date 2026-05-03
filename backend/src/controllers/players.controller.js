'use strict';

/**
 * Controlador de estadísticas de jugadores.
 * Gestiona dos endpoints: historial de partidos (paginado) y promedios de temporada.
 */

const asyncHandler = require('../utils/asyncHandler');
const { getPlayerStats, getPlayerAverages } = require('../services/players.service');
const { parsePagination, buildMeta, paginate } = require('../utils/pagination');
const config = require('../config');

/**
 * GET /api/v1/players/:playerId/stats
 * Devuelve el historial partido a partido de un jugador, paginado.
 * Los partidos se ordenan de más reciente a más antiguo (como los devuelve la NBA).
 *
 * Path params:
 *   - playerId (integer): ID del jugador (ej. 2544 = LeBron James)
 *
 * Query params:
 *   - season     (string):  temporada; default = config.nba.season
 *   - seasonType (string):  'Regular Season' | 'Playoffs'
 *   - page, limit (integer): paginación
 */
const listPlayerStats = asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  const season = req.query.season || config.nba.season;
  const seasonType = req.query.seasonType || config.nba.seasonType;
  const { page, limit, offset } = parsePagination(req.query);

  // El servicio devuelve todos los partidos; paginamos aquí en el controlador
  const games = await getPlayerStats(playerId, season, seasonType);
  const paged = paginate(games, offset, limit);

  // Enriquecer el meta con información del jugador para que el cliente no tenga que inferirla
  const meta = { playerId: parseInt(playerId), season, ...buildMeta(page, limit, games.length) };

  res.json({ status: 'success', meta, data: paged });
});

/**
 * GET /api/v1/players/:playerId/averages
 * Devuelve los promedios estadísticos de un jugador en la temporada solicitada.
 * No requiere paginación porque es un único objeto resumen.
 *
 * Path params:
 *   - playerId (integer): ID del jugador
 *
 * Query params:
 *   - season     (string): temporada; default = config.nba.season
 *   - seasonType (string): tipo de temporada
 */
const getAverages = asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  const season = req.query.season || config.nba.season;
  const seasonType = req.query.seasonType || config.nba.seasonType;

  const data = await getPlayerAverages(playerId, season, seasonType);
  res.json({ status: 'success', data });
});

module.exports = { listPlayerStats, getAverages };
