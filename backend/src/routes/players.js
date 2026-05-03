'use strict';

const { Router } = require('express');
const { listPlayerStats, getAverages } = require('../controllers/players.controller');

const router = Router();

router.get('/:playerId/stats', listPlayerStats);
router.get('/:playerId/averages', getAverages);

module.exports = router;
