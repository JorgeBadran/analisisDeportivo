'use strict';

const { get, set } = require('../config/cache');
const { fetchAllTeams, fetchTeamDetail, fetchTeamRoster } = require('../espn/teams');

async function getTeamsForSelect(conference = null) {
  const key = `select:teams:${conference || 'all'}`;
  const cached = get(key);
  if (cached) return cached;

  const raw = await fetchAllTeams();
  let teams = (raw?.sports?.[0]?.leagues?.[0]?.teams || []).map(({ team: t }) => ({
    teamId:       t.id,
    name:         t.displayName,
    abbreviation: t.abbreviation,
    location:     t.location,
    nickname:     t.name,
  }));

  set(key, teams, 86400);
  return teams;
}

async function getPlayersForSelect(teamId) {
  const key = `select:players:${teamId}`;
  const cached = get(key);
  if (cached) return cached;

  // Try dedicated roster endpoint first; fall back to team detail athletes array
  let athletes = [];
  try {
    const rosterRaw = await fetchTeamRoster(teamId);
    // ESPN roster endpoint: { athletes: [{ items: [{...}] }] } grouped by position
    const groups = rosterRaw?.athletes || [];
    athletes = groups.flatMap(g => g.items || []);
  } catch (_) {
    const detailRaw = await fetchTeamDetail(teamId);
    athletes = detailRaw?.team?.athletes || [];
  }

  const data = athletes.map((a) => ({
    playerId:     a.id,
    name:         a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim(),
    firstName:    a.firstName || '',
    lastName:     a.lastName  || '',
    position:     a.position?.abbreviation || '',
    jerseyNumber: a.jersey || '',
  }));

  set(key, data, 3600);
  return data;
}

async function searchPlayers(q) {
  if (!q || q.trim().length < 2) return [];
  const term = q.trim().toLowerCase();

  const key = `select:teams:all`;
  let teams = get(key);
  if (!teams) {
    const raw = await fetchAllTeams();
    teams = (raw?.sports?.[0]?.leagues?.[0]?.teams || []).map(({ team: t }) => ({
      teamId: t.id, name: t.displayName, abbreviation: t.abbreviation,
    }));
    set(key, teams, 86400);
  }

  // Buscar en los rosters de todos los equipos (desde caché si ya fueron cargados)
  const results = [];
  for (const team of teams) {
    const rosterKey = `select:players:${team.teamId}`;
    const roster = get(rosterKey);
    if (roster) {
      results.push(...roster.filter((p) => p.name.toLowerCase().includes(term)));
    }
  }

  return results.slice(0, 20);
}

module.exports = { getTeamsForSelect, getPlayersForSelect, searchPlayers };
