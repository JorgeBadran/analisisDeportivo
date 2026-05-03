'use strict';

const { transformStandings } = require('../utils/transform/standings.transform');

const HEADERS = [
  'PlayoffRank', 'TeamID', 'TeamCity', 'TeamName', 'TeamSlug', 'Conference',
  'Division', 'WINS', 'LOSSES', 'WinPCT', 'ConferenceGamesBack', 'HOME',
  'ROAD', 'L10', 'CurrentStreak', 'clinchIndicator', 'ConferenceRecord',
];

function makeRow(conf, wins, losses, overrides = {}) {
  const row = [
    overrides.rank ?? wins,
    overrides.teamId ?? 1,
    overrides.city ?? 'Boston',
    overrides.name ?? 'Celtics',
    overrides.slug ?? 'celtics',
    conf,
    'Atlantic',
    wins,
    losses,
    wins / (wins + losses),
    '--',
    '34-7',
    '30-11',
    '7-3',
    'W3',
    overrides.clinched ?? null,
    null,
  ];
  return row;
}

function makeRaw(rows) {
  return { resultSets: [{ name: 'Standings', headers: HEADERS, rowSet: rows }] };
}

describe('transformStandings', () => {
  it('returns { east: [], west: [] } for null input', () => {
    expect(transformStandings(null)).toEqual({ east: [], west: [] });
  });

  it('returns { east: [], west: [] } when Standings resultSet not found', () => {
    expect(transformStandings({ resultSets: [] })).toEqual({ east: [], west: [] });
  });

  it('separates East and West teams', () => {
    const raw = makeRaw([
      makeRow('East', 60, 22),
      makeRow('West', 55, 27, { teamId: 2, city: 'Denver', name: 'Nuggets', slug: 'nuggets' }),
    ]);
    const { east, west } = transformStandings(raw);
    expect(east).toHaveLength(1);
    expect(west).toHaveLength(1);
    expect(east[0].conference).toBe('East');
    expect(west[0].conference).toBe('West');
  });

  it('sorts east by wins descending', () => {
    const raw = makeRaw([
      makeRow('East', 40, 42, { teamId: 1 }),
      makeRow('East', 60, 22, { teamId: 2 }),
    ]);
    const { east } = transformStandings(raw);
    expect(east[0].wins).toBe(60);
    expect(east[1].wins).toBe(40);
  });

  it('sorts west by wins descending', () => {
    const raw = makeRaw([
      makeRow('West', 45, 37, { teamId: 3 }),
      makeRow('West', 58, 24, { teamId: 4 }),
    ]);
    const { west } = transformStandings(raw);
    expect(west[0].wins).toBe(58);
  });

  it('builds team name from city + name', () => {
    const raw = makeRaw([makeRow('East', 60, 22, { city: 'New York', name: 'Knicks' })]);
    const { east } = transformStandings(raw);
    expect(east[0].name).toBe('New York Knicks');
  });

  it('maps all relevant fields', () => {
    const raw = makeRaw([makeRow('East', 60, 22, { clinched: 'x' })]);
    const { east } = transformStandings(raw);
    const team = east[0];
    expect(team.wins).toBe(60);
    expect(team.losses).toBe(22);
    expect(team.homeRecord).toBe('34-7');
    expect(team.awayRecord).toBe('30-11');
    expect(team.lastTen).toBe('7-3');
    expect(team.streak).toBe('W3');
    expect(team.clinched).toBe('x');
  });

  it('sets clinched null when not clinched', () => {
    const raw = makeRaw([makeRow('West', 40, 42)]);
    const { west } = transformStandings(raw);
    expect(west[0].clinched).toBeNull();
  });
});
