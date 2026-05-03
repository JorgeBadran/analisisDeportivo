'use strict';

/**
 * Controlador de equipos NBA.
 * Expone dos vistas: lista de todos los equipos y detalle de uno con su roster.
 */

const asyncHandler = require('../utils/asyncHandler');
const { getTeams, getTeamById } = require('../services/teams.service');
const config = require('../config');

/**
 * GET /api/v1/teams
 * Devuelve estadísticas de todos los equipos de la NBA.
 * Se puede filtrar por conferencia o división.
 *
 * Query params:
 *   - season     (string): temporada; default = config.nba.season
 *   - seasonType (string): tipo de temporada
 *   - conference (string): 'East' | 'West'
 *   - division   (string): nombre de la división, ej. 'Pacific'
 */
const listTeams = asyncHandler(async (req, res) => {
  const season = req.query.season || config.nba.season;
  const seasonType = req.query.seasonType || config.nba.seasonType;
  const conference = req.query.conference || null;
  const division = req.query.division || null;

  const data = await getTeams(season, seasonType, conference, division);
  res.json({ status: 'success', meta: { count: data.length }, data });
});

/**
 * GET /api/v1/teams/:teamId
 * Devuelve el detalle de un equipo: estadísticas de temporada + roster completo.
 *
 * Path params:
 *   - teamId (integer): ID numérico del equipo (ej. 1610612747 = Lakers)
 *
 * Query params:
 *   - season     (string): temporada
 *   - seasonType (string): tipo de temporada
 */
const getTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const season = req.query.season || config.nba.season;
  const seasonType = req.query.seasonType || config.nba.seasonType;

  const data = await getTeamById(teamId, season, seasonType);
  res.json({ status: 'success', data });
});

module.exports = { listTeams, getTeam };
