'use strict';

const { fetchEspn } = require('./client');

async function fetchAllTeams() {
  return fetchEspn('/teams', { limit: 32 });
}

async function fetchTeamDetail(espnTeamId) {
  return fetchEspn(`/teams/${espnTeamId}`, { enable: 'roster,stats,record' });
}

async function fetchTeamRoster(espnTeamId) {
  return fetchEspn(`/teams/${espnTeamId}/roster`);
}

module.exports = { fetchAllTeams, fetchTeamDetail, fetchTeamRoster };
