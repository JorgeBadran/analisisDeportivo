'use strict';

const { Router } = require('express');
const { listSchedule } = require('../controllers/schedule.controller');

const router = Router();

router.get('/', listSchedule);

module.exports = router;
