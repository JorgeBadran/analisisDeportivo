'use strict';

require('dotenv').config();
const app    = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`NBA API (ESPN) running on http://localhost:${config.port}${config.apiPrefix}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
