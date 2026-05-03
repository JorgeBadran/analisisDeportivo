'use strict';

const { Router } = require('express');
const { listGames, getBoxscoreById } = require('../controllers/games.controller');

const router = Router();

router.get('/', listGames);
router.get('/:gameId/boxscore', getBoxscoreById);

module.exports = router;
