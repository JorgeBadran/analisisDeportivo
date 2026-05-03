'use strict';

const { Router } = require('express');
const { getBracket } = require('../controllers/playoffs.controller');

const router = Router();
router.get('/bracket', getBracket);

module.exports = router;
