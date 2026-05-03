'use strict';

const { fetchEspn } = require('./client');

// seasontype: 2 = Regular Season, 3 = Playoffs
async function fetchStandings(seasontype = 2) {
  return fetchEspn('/standings', { seasontype }, 'v2');
}

module.exports = { fetchStandings };
