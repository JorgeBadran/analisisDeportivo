'use strict';

const { fetchEspn } = require('./client');

// date: 'YYYY-MM-DD' o null para el día actual
async function fetchGames(date) {
  const params = date ? { dates: date.replace(/-/g, '') } : {};
  return fetchEspn('/scoreboard', params);
}

async function fetchBoxscore(gameId) {
  return fetchEspn('/summary', { event: gameId });
}

module.exports = { fetchGames, fetchBoxscore };
