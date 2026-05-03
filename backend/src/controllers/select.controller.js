'use strict';

/**
 * Controlador para los endpoints de select lists.
 * Todos devuelven listas ligeras (id + etiqueta) optimizadas para dropdowns.
 */

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getTeamsForSelect, getPlayersForSelect, searchPlayers } = require('../services/select.service');

/**
 * GET /api/v1/select/teams
 * Lista de todos los equipos activos para un <select>.
 *
 * Query params:
 *   - conference (string): 'East' | 'West'  (opcional)
 */
const listTeamsSelect = asyncHandler(async (req, res) => {
  const conference = req.query.conference || null;

  const data = await getTeamsForSelect(conference);
  res.json({ status: 'success', meta: { count: data.length }, data });
});

/**
 * GET /api/v1/select/teams/:teamId/players
 * Roster activo de un equipo para un <select> de jugadores.
 *
 * Path params:
 *   - teamId (integer): nba_team_id del equipo (ej. 1610612747 = Lakers)
 */
const listPlayersForTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  if (!teamId || isNaN(parseInt(teamId))) {
    throw ApiError.badRequest('teamId debe ser un número entero.', 'INVALID_TEAM_ID');
  }

  const data = await getPlayersForSelect(teamId);

  if (data.length === 0) {
    throw ApiError.notFound('Equipo no encontrado o sin jugadores activos.', 'TEAM_NOT_FOUND');
  }

  res.json({ status: 'success', meta: { teamId: parseInt(teamId), count: data.length }, data });
});

/**
 * GET /api/v1/select/players/search?q=james
 * Búsqueda de jugadores por apellido para un campo de búsqueda libre.
 *
 * Query params:
 *   - q (string): término de búsqueda, mínimo 2 caracteres
 */
const searchPlayersSelect = asyncHandler(async (req, res) => {
  const q = req.query.q || '';
  if (q.trim().length < 2) {
    throw ApiError.badRequest('El parámetro "q" debe tener al menos 2 caracteres.', 'QUERY_TOO_SHORT');
  }

  const data = await searchPlayers(q);
  res.json({ status: 'success', meta: { query: q, count: data.length }, data });
});

module.exports = { listTeamsSelect, listPlayersForTeam, searchPlayersSelect };
