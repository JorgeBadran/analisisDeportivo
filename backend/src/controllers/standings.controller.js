'use strict';

/**
 * Controlador de la clasificación (standings).
 * Delega al servicio la obtención y proyección de los datos,
 * y agrega metadatos de contexto (temporada, fecha de consulta, agrupamiento).
 */

const asyncHandler = require('../utils/asyncHandler');
const { getStandings } = require('../services/standings.service');
const config = require('../config');

/**
 * GET /api/v1/standings
 * Devuelve la clasificación actual de la NBA.
 *
 * Query params:
 *   - season     (string): temporada; default = config.nba.season
 *   - seasonType (string): 'Regular Season' | 'Playoffs'
 *   - group      (string): 'conference' (defecto) | 'league'
 *   - conference (string): 'East' | 'West' — filtra una sola conferencia
 */
const listStandings = asyncHandler(async (req, res) => {
  const season = req.query.season || config.nba.season;
  const seasonType = req.query.seasonType || config.nba.seasonType;
  const group = req.query.group || 'conference'; // Vista por defecto: este vs. oeste
  const conference = req.query.conference || null;

  const data = await getStandings(season, seasonType, group, conference);

  res.json({
    status: 'success',
    meta: {
      season,
      asOf: new Date().toISOString().split('T')[0], // Fecha de la consulta (no de los datos)
      group,
    },
    data,
  });
});

module.exports = { listStandings };
