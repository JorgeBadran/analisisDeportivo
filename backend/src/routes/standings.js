'use strict';

const { Router } = require('express');
const { listStandings } = require('../controllers/standings.controller');

const router = Router();

router.get('/', listStandings);

module.exports = router;
