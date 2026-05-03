'use strict';

const { get, set, TTL } = require('../config/cache');
const { fetchSchedule } = require('../espn/schedule');

function transformScheduleEvents(raw) {
  return (raw?.events || []).map((e) => {
    const comp = e.competitions?.[0] || {};
    const home = comp.competitors?.find((c) => c.homeAway === 'home');
    const away = comp.competitors?.find((c) => c.homeAway === 'away');
    const broadcasts = comp.broadcasts?.flatMap((b) => b.names || []) || [];
    return {
      gameId: e.id,
      date: e.date?.split('T')[0] || null,
      time: e.date || null,
      homeTeam: {
        teamId: home?.team?.id,
        abbreviation: home?.team?.abbreviation,
        name: home?.team?.displayName,
      },
      awayTeam: {
        teamId: away?.team?.id,
        abbreviation: away?.team?.abbreviation,
        name: away?.team?.displayName,
      },
      venue: comp.venue?.fullName || null,
      broadcasters: broadcasts,
      status: e.status?.type?.shortDetail || '',
    };
  });
}

async function getSchedule(season, teamId, from, to) {
  const fromDate = from || '2024-10-22';
  const toDate   = to   || new Date().toISOString().split('T')[0];

  const key = `schedule:${fromDate}:${toDate}`;
  let games = get(key);

  if (!games) {
    const raw = await fetchSchedule(fromDate, toDate);
    games = transformScheduleEvents(raw);
    set(key, games, TTL.schedule);
  }

  if (teamId) {
    games = games.filter((g) => g.homeTeam.teamId == teamId || g.awayTeam.teamId == teamId);
  }

  return games;
}

module.exports = { getSchedule };
