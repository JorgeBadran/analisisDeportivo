'use strict';

const { get, set, TTL } = require('../config/cache');
const { fetchPlayerGameLog, fetchPlayerProfile } = require('../espn/players');
const ApiError = require('../utils/ApiError');

function transformGameLog(raw) {
  const categories = raw?.categories || [];
  // ESPN returns events as an object keyed by event ID, not an array
  const eventsMap = raw?.events || {};
  const events = Array.isArray(eventsMap) ? eventsMap : Object.values(eventsMap);
  if (!events.length) return [];

  // ESPN game log: each event has stats per category
  return events.map((ev) => {
    const stats = {};
    (ev.categories || []).forEach((cat) => {
      const catDef = categories.find((c) => c.name === cat.name);
      (catDef?.names || []).forEach((name, i) => {
        stats[name] = cat.totals?.[i] ?? null;
      });
    });

    const comp = ev.event?.competitions?.[0];
    const opponent = comp?.competitors?.find((c) => c.homeAway !== ev.homeAway)?.team?.abbreviation || '';
    const homeAway = ev.homeAway === 'home' ? 'home' : 'away';

    return {
      gameId: ev.event?.id,
      date: ev.event?.date?.split('T')[0] || null,
      opponent,
      homeAway,
      result: ev.result || '',
      minutes:   stats.minutes   || '0',
      points:    parseFloat(stats.points)    || 0,
      rebounds:  parseFloat(stats.rebounds)  || 0,
      assists:   parseFloat(stats.assists)   || 0,
      steals:    parseFloat(stats.steals)    || 0,
      blocks:    parseFloat(stats.blocks)    || 0,
      turnovers: parseFloat(stats.turnovers) || 0,
      fgm: parseFloat(stats.fieldGoalsMade)     || 0,
      fga: parseFloat(stats.fieldGoalsAttempted) || 0,
      fgPct: parseFloat(stats.fieldGoalPct)  || 0,
      tpm: parseFloat(stats.threePointFieldGoalsMade)     || 0,
      tpa: parseFloat(stats.threePointFieldGoalsAttempted) || 0,
      tpPct: parseFloat(stats.threePointFieldGoalPct) || 0,
      ftm: parseFloat(stats.freeThrowsMade)     || 0,
      fta: parseFloat(stats.freeThrowsAttempted) || 0,
      ftPct: parseFloat(stats.freeThrowPct)  || 0,
      plusMinus: parseFloat(stats.plusMinus) || 0,
    };
  });
}

function transformAverages(raw) {
  const athlete = raw?.athlete;
  if (!athlete) return null;

  // ESPN athlete profile has season stats in statistics array
  const seasonStats = raw?.statistics?.[0];
  if (!seasonStats) return null;

  const statNames = seasonStats.names || [];
  const values    = seasonStats.values || [];
  const s = Object.fromEntries(statNames.map((n, i) => [n, values[i]]));

  return {
    playerId: athlete.id,
    name: athlete.displayName,
    teamAbbreviation: athlete.team?.abbreviation || '',
    gamesPlayed:      s.gamesPlayed       ?? 0,
    minutesPerGame:   s.avgMinutes        ?? 0,
    pointsPerGame:    s.avgPoints         ?? 0,
    reboundsPerGame:  s.avgRebounds       ?? 0,
    assistsPerGame:   s.avgAssists        ?? 0,
    stealsPerGame:    s.avgSteals         ?? 0,
    blocksPerGame:    s.avgBlocks         ?? 0,
    turnoversPerGame: s.avgTurnovers      ?? 0,
    fgPct:  s.fieldGoalPct               ?? 0,
    tpPct:  s.threePointFieldGoalPct     ?? 0,
    ftPct:  s.freeThrowPct               ?? 0,
  };
}

async function getPlayerStats(playerId, season, seasonType) {
  const key = `player:log:${playerId}`;
  const cached = get(key);
  if (cached) return cached;

  const raw = await fetchPlayerGameLog(playerId);
  const data = transformGameLog(raw);

  if (!data.length) throw ApiError.notFound(`Sin partidos para el jugador ${playerId}`, 'PLAYER_NOT_FOUND');

  set(key, data, TTL.playerLog);
  return data;
}

async function getPlayerAverages(playerId, season, seasonType) {
  const key = `player:avg:${playerId}`;
  const cached = get(key);
  if (cached) return cached;

  const raw = await fetchPlayerProfile(playerId);
  const data = transformAverages(raw);

  if (!data) throw ApiError.notFound(`Jugador ${playerId} no encontrado`, 'PLAYER_NOT_FOUND');

  set(key, data, TTL.playerAvg);
  return data;
}

module.exports = { getPlayerStats, getPlayerAverages };
