'use strict';

const { Router } = require('express');
const { listTeams, getTeam } = require('../controllers/teams.controller');

const router = Router();

router.get('/', listTeams);
router.get('/:teamId', getTeam);

module.exports = router;
