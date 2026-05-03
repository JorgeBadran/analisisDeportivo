'use strict';

const morgan = require('morgan');
const config = require('../config');

const format = config.nodeEnv === 'production' ? 'combined' : 'dev';

module.exports = morgan(format);
