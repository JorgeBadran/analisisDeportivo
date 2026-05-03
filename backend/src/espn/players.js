'use strict';

const { fetchEspn } = require('./client');

async function fetchPlayerGameLog(playerId) {
  return fetchEspn(`/athletes/${playerId}/gamelog`, {}, 'web');
}

async function fetchPlayerProfile(playerId) {
  return fetchEspn(`/athletes/${playerId}`, {}, 'site');
}

module.exports = { fetchPlayerGameLog, fetchPlayerProfile };
