'use strict';

const { fetchEspn } = require('./client');

async function fetchPlayoffGames() {
  const year = new Date().getFullYear();
  const from = `${year}0401`;
  const to   = `${year}0731`;
  return fetchEspn('/scoreboard', { seasontype: 3, limit: 300, dates: `${from}-${to}` });
}

module.exports = { fetchPlayoffGames };
