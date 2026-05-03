'use strict';

const { fetchEspn } = require('./client');

// from/to: 'YYYY-MM-DD'
async function fetchSchedule(from, to) {
  const dateRange = `${from.replace(/-/g, '')}-${to.replace(/-/g, '')}`;
  return fetchEspn('/scoreboard', { dates: dateRange, limit: 1000 });
}

module.exports = { fetchSchedule };
