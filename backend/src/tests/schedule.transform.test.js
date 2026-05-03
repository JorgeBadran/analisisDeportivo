'use strict';

const { transformSchedule } = require('../utils/transform/schedule.transform');

const makeGame = (id = 'G001') => ({
  gameId: id,
  gameDateTimeUTC: '2025-01-15T00:30:00Z',
  homeTeam: { teamId: 1, teamTricode: 'LAL', teamCity: 'Los Angeles', teamName: 'Lakers' },
  awayTeam: { teamId: 2, teamTricode: 'GSW', teamCity: 'Golden State', teamName: 'Warriors' },
  arenaName: 'Crypto.com Arena',
  broadcasters: { nationalTvBroadcasters: [{ broadcasterDisplay: 'TNT' }, { broadcasterDisplay: 'ESPN' }] },
});

describe('transformSchedule', () => {
  it('returns empty array for null/empty input', () => {
    expect(transformSchedule(null)).toEqual([]);
    expect(transformSchedule({})).toEqual([]);
    expect(transformSchedule({ leagueSchedule: { gameDates: [] } })).toEqual([]);
  });

  it('flattens multiple days into a single array', () => {
    const raw = {
      leagueSchedule: {
        gameDates: [
          { gameDate: '01/15/2025 00:00:00', games: [makeGame('G1'), makeGame('G2')] },
          { gameDate: '01/16/2025 00:00:00', games: [makeGame('G3')] },
        ],
      },
    };
    const result = transformSchedule(raw);
    expect(result).toHaveLength(3);
  });

  it('extracts date from gameDate (MM/DD/YYYY)', () => {
    const raw = {
      leagueSchedule: {
        gameDates: [{ gameDate: '01/15/2025 00:00:00', games: [makeGame()] }],
      },
    };
    const result = transformSchedule(raw);
    expect(result[0].date).toBe('01/15/2025');
  });

  it('preserves full UTC time', () => {
    const raw = {
      leagueSchedule: {
        gameDates: [{ gameDate: '01/15/2025 00:00:00', games: [makeGame()] }],
      },
    };
    expect(transformSchedule(raw)[0].time).toBe('2025-01-15T00:30:00Z');
  });

  it('builds team names from city + name', () => {
    const raw = {
      leagueSchedule: {
        gameDates: [{ gameDate: '01/15/2025 00:00:00', games: [makeGame()] }],
      },
    };
    const result = transformSchedule(raw);
    expect(result[0].homeTeam.name).toBe('Los Angeles Lakers');
    expect(result[0].awayTeam.name).toBe('Golden State Warriors');
  });

  it('maps team abbreviations', () => {
    const raw = {
      leagueSchedule: {
        gameDates: [{ gameDate: '01/15/2025 00:00:00', games: [makeGame()] }],
      },
    };
    const result = transformSchedule(raw);
    expect(result[0].homeTeam.abbreviation).toBe('LAL');
    expect(result[0].awayTeam.abbreviation).toBe('GSW');
  });

  it('maps venue', () => {
    const raw = {
      leagueSchedule: {
        gameDates: [{ gameDate: '01/15/2025 00:00:00', games: [makeGame()] }],
      },
    };
    expect(transformSchedule(raw)[0].venue).toBe('Crypto.com Arena');
  });

  it('extracts national TV broadcasters', () => {
    const raw = {
      leagueSchedule: {
        gameDates: [{ gameDate: '01/15/2025 00:00:00', games: [makeGame()] }],
      },
    };
    expect(transformSchedule(raw)[0].broadcasters).toEqual(['TNT', 'ESPN']);
  });

  it('returns empty broadcasters when none present', () => {
    const game = makeGame();
    game.broadcasters = { nationalTvBroadcasters: [] };
    const raw = { leagueSchedule: { gameDates: [{ gameDate: '01/15/2025 00:00:00', games: [game] }] } };
    expect(transformSchedule(raw)[0].broadcasters).toEqual([]);
  });

  it('handles missing arenaName', () => {
    const game = makeGame();
    delete game.arenaName;
    const raw = { leagueSchedule: { gameDates: [{ gameDate: '01/15/2025 00:00:00', games: [game] }] } };
    expect(transformSchedule(raw)[0].venue).toBeNull();
  });
});
