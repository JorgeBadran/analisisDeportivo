'use strict';

require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  cache: {
    liveScores:   parseInt(process.env.CACHE_TTL_LIVE_SCORES)   || 30,
    finalScores:  parseInt(process.env.CACHE_TTL_FINAL_SCORES)  || 3600,
    boxscoreFinal: parseInt(process.env.CACHE_TTL_BOXSCORE_FINAL) || 21600,
    schedule:     parseInt(process.env.CACHE_TTL_SCHEDULE)      || 86400,
    playerLog:    parseInt(process.env.CACHE_TTL_PLAYER_LOG)    || 300,
    playerAvg:    parseInt(process.env.CACHE_TTL_PLAYER_AVG)    || 900,
    team:         parseInt(process.env.CACHE_TTL_TEAM)          || 3600,
    standings:    parseInt(process.env.CACHE_TTL_STANDINGS)     || 300,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS)     || 60000,
    max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)  || 100,
  },

  nba: {
    season:     process.env.NBA_SEASON      || '2024-25',
    seasonType: process.env.NBA_SEASON_TYPE || 'Regular Season',
  },
};

module.exports = config;
