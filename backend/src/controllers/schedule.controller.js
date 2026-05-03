'use strict';

/**
 * Controlador del calendario de la temporada.
 * Obtiene el calendario completo del servicio (ya filtrado si se pasan parámetros)
 * y aplica paginación antes de enviar la respuesta.
 */

const asyncHandler = require('../utils/asyncHandler');
const { getSchedule } = require('../services/schedule.service');
const { parsePagination, buildMeta, paginate } = require('../utils/pagination');
const config = require('../config');

/**
 * GET /api/v1/schedule
 * Devuelve el calendario de la temporada con filtros opcionales y paginación.
 *
 * Query params:
 *   - season   (string):     temporada, ej. '2024-25'; default = config.nba.season
 *   - teamId   (integer):    filtrar por equipo; default = todos
 *   - from     (YYYY-MM-DD): inicio del rango de fechas
 *   - to       (YYYY-MM-DD): fin del rango de fechas
 *   - page     (integer):    número de página; default = 1
 *   - limit    (integer):    resultados por página; default = 20, max = 82
 */
const listSchedule = asyncHandler(async (req, res) => {
  const season = req.query.season || config.nba.season;
  const teamId = req.query.teamId || null;
  const from = req.query.from || null;
  const to = req.query.to || null;

  // Extraer y validar parámetros de paginación del query string
  const { page, limit, offset } = parsePagination(req.query);

  // El servicio devuelve el array completo (ya filtrado pero sin paginar)
  const games = await getSchedule(season, teamId, from, to);

  // Aplicar paginación en memoria
  const paged = paginate(games, offset, limit);
  const meta = buildMeta(page, limit, games.length);

  res.json({ status: 'success', meta, data: paged });
});

module.exports = { listSchedule };
