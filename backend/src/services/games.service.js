'use strict';

const { get, set, TTL } = require('../config/cache');
const { fetchGames, fetchBoxscore } = require('../espn/games');
const ApiError = require('../utils/ApiError');

function mapStatus(espnEvent) {
  const type = espnEvent.status?.type;
  if (type?.completed) return 'final';
  if (type?.state === 'in') return 'live';
  return 'upcoming';
}

function transformEvents(raw) {
  return (raw?.events || []).map((e) => {
    const comp = e.competitions?.[0] || {};
    const home = comp.competitors?.find((c) => c.homeAway === 'home');
    const away = comp.competitors?.find((c) => c.homeAway === 'away');
    return {
      gameId: e.id,
      status: mapStatus(e),
      statusText: e.status?.type?.shortDetail || '',
      period: e.status?.period || 0,
      clock: e.status?.displayClock || null,
      homeTeam: {
        teamId: home?.team?.id,
        abbreviation: home?.team?.abbreviation,
        name: home?.team?.displayName,
        score: parseInt(home?.score) || 0,
      },
      awayTeam: {
        teamId: away?.team?.id,
        abbreviation: away?.team?.abbreviation,
        name: away?.team?.displayName,
        score: parseInt(away?.score) || 0,
      },
      date: e.date?.split('T')[0] || null,
      venue: comp.venue?.fullName || null,
    };
  });
}

function transformBoxscoreData(raw) {
  const header = raw?.header?.competitions?.[0];
  if (!header) return null;

  const gameId = raw?.header?.id;
  const statusText = header.status?.type?.shortDetail || '';

  const teams = (raw?.boxscore?.teams || []).map((t) => {
    const statNames = t.statistics?.[0]?.keys || [];
    const totalsRow = t.statistics?.[0]?.athletes?.[0]?.stats || [];

    const players = (t.players?.[0]?.statistics?.[0]?.athletes || []).map((a) => {
      const stats = a.stats || [];
      const keys = t.players?.[0]?.statistics?.[0]?.keys || [];
      const s = Object.fromEntries(keys.map((k, i) => [k, stats[i]]));
      return {
        personId: a.athlete?.id,
        name: a.athlete?.displayName,
        position: a.athlete?.position?.abbreviation || '',
        starter: a.starter ?? false,
        minutes: s.minutes || '0',
        points: parseInt(s.points) || 0,
        rebounds: parseInt(s.rebounds) || 0,
        assists: parseInt(s.assists) || 0,
        steals: parseInt(s.steals) || 0,
        blocks: parseInt(s.blocks) || 0,
        turnovers: parseInt(s.turnovers) || 0,
        fgm: parseInt(s.fieldGoalsMade) || 0,
        fga: parseInt(s.fieldGoalsAttempted) || 0,
        tpm: parseInt(s.threePointFieldGoalsMade) || 0,
        tpa: parseInt(s.threePointFieldGoalsAttempted) || 0,
        ftm: parseInt(s.freeThrowsMade) || 0,
        fta: parseInt(s.freeThrowsAttempted) || 0,
        plusMinus: parseInt(s.plusMinus) || 0,
      };
    });

    const teamStats = t.statistics?.[0] || {};
    const totals = Object.fromEntries(
      (teamStats.keys || []).map((k, i) => [k, teamStats.totals?.[i]])
    );

    return {
      teamId: t.team?.id,
      abbreviation: t.team?.abbreviation,
      homeAway: t.homeAway,
      players,
      totals: {
        points: parseInt(totals.points) || 0,
        rebounds: parseInt(totals.rebounds) || 0,
        assists: parseInt(totals.assists) || 0,
        steals: parseInt(totals.steals) || 0,
        blocks: parseInt(totals.blocks) || 0,
        turnovers: parseInt(totals.turnovers) || 0,
      },
    };
  });

  const home = teams.find((t) => t.homeAway === 'home') || teams[0] || null;
  const away = teams.find((t) => t.homeAway === 'away') || teams[1] || null;

  return { gameId, status: statusText, homeTeam: home, awayTeam: away };
}

async function getGames(date, statusFilter) {
  const key = `games:${date || 'today'}`;
  const cached = get(key);
  if (cached) {
    return statusFilter ? cached.filter((g) => g.status === statusFilter) : cached;
  }

  const raw = await fetchGames(date);
  const games = transformEvents(raw);

  const hasLive = games.some((g) => g.status === 'live');
  set(key, games, hasLive ? TTL.liveScores : TTL.finalScores);

  return statusFilter ? games.filter((g) => g.status === statusFilter) : games;
}

async function getBoxscore(gameId) {
  const key = `boxscore:${gameId}`;
  const cached = get(key);
  if (cached) return cached;

  const raw = await fetchBoxscore(gameId);
  const data = transformBoxscoreData(raw);
  if (!data) throw ApiError.notFound(`Boxscore no encontrado para el partido ${gameId}`, 'GAME_NOT_FOUND');

  const isLive = raw?.header?.competitions?.[0]?.status?.type?.state === 'in';
  set(key, data, isLive ? TTL.liveScores : TTL.boxscoreFinal);

  return data;
}

module.exports = { getGames, getBoxscore };
