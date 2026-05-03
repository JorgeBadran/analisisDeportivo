'use strict';

const { get, set, TTL } = require('../config/cache');
const { fetchAllTeams, fetchTeamDetail } = require('../espn/teams');
const ApiError = require('../utils/ApiError');

function transformTeamsList(raw) {
  const teams = raw?.sports?.[0]?.leagues?.[0]?.teams || [];
  return teams.map(({ team: t }) => {
    const record = t.record?.items?.[0];
    const wins   = record?.stats?.find((s) => s.name === 'wins')?.value ?? 0;
    const losses = record?.stats?.find((s) => s.name === 'losses')?.value ?? 0;
    const gp = wins + losses;
    return {
      teamId: t.id,
      name: t.displayName,
      abbreviation: t.abbreviation,
      location: t.location,
      nickname: t.name,
      color: t.color,
      gamesPlayed: gp,
      wins,
      losses,
      winPct: gp > 0 ? wins / gp : 0,
    };
  });
}

function transformRoster(teamDetail) {
  const athletes = teamDetail?.team?.athletes || [];
  return athletes.map((a) => ({
    personId: a.id,
    name: a.displayName,
    position: a.position?.abbreviation || '',
    jerseyNumber: a.jersey || '',
    height: a.displayHeight || '',
    weight: a.displayWeight || '',
    age: a.age || null,
  }));
}

async function getTeams(season, seasonType, conference, division) {
  const key = `teams:espn`;
  let teams = get(key);

  if (!teams) {
    const raw = await fetchAllTeams();
    teams = transformTeamsList(raw);
    set(key, teams, TTL.team);
  }

  return teams;
}

async function getTeamById(teamId, season, seasonType) {
  const key = `team:${teamId}`;
  let result = get(key);
  if (result) return result;

  const raw = await fetchTeamDetail(teamId);
  const t = raw?.team;
  if (!t) throw ApiError.notFound(`Equipo ${teamId} no encontrado`, 'TEAM_NOT_FOUND');

  const record = t.record?.items?.[0];
  const wins   = record?.stats?.find((s) => s.name === 'wins')?.value ?? 0;
  const losses = record?.stats?.find((s) => s.name === 'losses')?.value ?? 0;
  const gp = wins + losses;

  result = {
    teamId: t.id,
    name: t.displayName,
    abbreviation: t.abbreviation,
    location: t.location,
    nickname: t.name,
    color: t.color,
    gamesPlayed: gp,
    wins,
    losses,
    winPct: gp > 0 ? wins / gp : 0,
    roster: transformRoster(raw),
  };

  set(key, result, TTL.team);
  return result;
}

module.exports = { getTeams, getTeamById };
