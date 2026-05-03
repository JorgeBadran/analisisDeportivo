'use strict';

const { Router } = require('express');
const config = require('../config');

const gamesRouter    = require('./games');
const scheduleRouter = require('./schedule');
const playersRouter  = require('./players');
const teamsRouter    = require('./teams');
const standingsRouter = require('./standings');
const selectRouter   = require('./select');
const playoffsRouter = require('./playoffs');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'NBA Statistics API — powered by ESPN',
    version: '2.0.0',
    endpoints: {
      games:          `${config.apiPrefix}/games`,
      schedule:       `${config.apiPrefix}/schedule`,
      players:        `${config.apiPrefix}/players/:playerId/stats`,
      teams:          `${config.apiPrefix}/teams`,
      standings:      `${config.apiPrefix}/standings`,
      selectTeams:    `${config.apiPrefix}/select/teams`,
      selectPlayers:  `${config.apiPrefix}/select/teams/:teamId/players`,
      searchPlayers:  `${config.apiPrefix}/select/players/search?q=`,
    },
  });
});

router.use('/games',     gamesRouter);
router.use('/schedule',  scheduleRouter);
router.use('/players',   playersRouter);
router.use('/teams',     teamsRouter);
router.use('/standings', standingsRouter);
router.use('/select',    selectRouter);
router.use('/playoffs',  playoffsRouter);

module.exports = router;
