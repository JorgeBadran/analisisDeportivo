'use strict';

const { Router } = require('express');
const { listTeamsSelect, listPlayersForTeam, searchPlayersSelect } = require('../controllers/select.controller');

const router = Router();

// GET /api/v1/select/teams                        → lista de equipos para select
// GET /api/v1/select/teams/:teamId/players        → roster de un equipo para select
// GET /api/v1/select/players/search?q=james       → búsqueda de jugadores por apellido

router.get('/teams',                    listTeamsSelect);
router.get('/teams/:teamId/players',    listPlayersForTeam);
router.get('/players/search',           searchPlayersSelect);

module.exports = router;
