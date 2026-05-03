'use strict';

const { get, set, TTL } = require('../config/cache');
const { fetchStandings } = require('../espn/standings');

function getStat(stats, name) {
  return stats?.find((s) => s.name === name);
}

function transformConference(conf) {
  return (conf?.standings?.entries || []).map((entry, idx) => ({
    rank: idx + 1,
    teamId: entry.team?.id,
    name: entry.team?.displayName,
    abbreviation: entry.team?.abbreviation,
    conference: conf.abbreviation === 'east' ? 'East' : 'West',
    wins: getStat(entry.stats, 'wins')?.value ?? 0,
    losses: getStat(entry.stats, 'losses')?.value ?? 0,
    winPct: getStat(entry.stats, 'winPercent')?.value ?? 0,
    gamesBehind: getStat(entry.stats, 'gamesBehind')?.displayValue || '--',
    homeRecord: getStat(entry.stats, 'home')?.displayValue || '--',
    awayRecord: getStat(entry.stats, 'road')?.displayValue || '--',
    lastTen: getStat(entry.stats, 'last10')?.displayValue || '--',
    streak: getStat(entry.stats, 'streak')?.displayValue || '--',
    clinched: getStat(entry.stats, 'clincher')?.displayValue || null,
  }));
}

async function getStandings(season, seasonType, group, conference) {
  const espnSeasonType = seasonType === 'Playoffs' ? 3 : 2;
  const key = `standings:espn:${espnSeasonType}`;
  let data = get(key);

  if (!data) {
    const raw = await fetchStandings(espnSeasonType);
    const children = raw?.children || [];
    const eastConf = children.find((c) => c.abbreviation?.toLowerCase() === 'east');
    const westConf = children.find((c) => c.abbreviation?.toLowerCase() === 'west');
    data = {
      east: transformConference(eastConf),
      west: transformConference(westConf),
    };
    set(key, data, TTL.standings);
  }

  if (group === 'league') {
    const all = [...data.east, ...data.west].sort((a, b) => b.winPct - a.winPct);
    return { league: all };
  }

  if (conference) {
    const k = conference.toLowerCase();
    return { [k]: data[k] || [] };
  }

  return data;
}

module.exports = { getStandings };
