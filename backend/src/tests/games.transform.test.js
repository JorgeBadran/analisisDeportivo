'use strict';

const { transformScoreboard } = require('../utils/transform/games.transform');

const makeGame = (overrides = {}) => ({
  gameId: 'G001',
  gameStatus: 3,
  gameStatusText: 'Final',
  period: 4,
  gameClock: null,
  gameTimeUTC: '2025-04-10T00:00:00Z',
  homeTeam: { teamId: 1, teamTricode: 'LAL', teamCity: 'Los Angeles', teamName: 'Lakers', score: 110 },
  awayTeam: { teamId: 2, teamTricode: 'GSW', teamCity: 'Golden State', teamName: 'Warriors', score: 105 },
  ...overrides,
});

describe('transformScoreboard', () => {
  it('returns empty array for null/empty input', () => {
    expect(transformScoreboard(null)).toEqual([]);
    expect(transformScoreboard({})).toEqual([]);
    expect(transformScoreboard({ scoreboard: { games: [] } })).toEqual([]);
  });

  it('maps gameId, statusText, period, clock', () => {
    const result = transformScoreboard({ scoreboard: { games: [makeGame()] } });
    expect(result[0].gameId).toBe('G001');
    expect(result[0].statusText).toBe('Final');
    expect(result[0].period).toBe(4);
    expect(result[0].clock).toBeNull();
  });

  it('maps status code 1 → upcoming', () => {
    const result = transformScoreboard({ scoreboard: { games: [makeGame({ gameStatus: 1 })] } });
    expect(result[0].status).toBe('upcoming');
  });

  it('maps status code 2 → live', () => {
    const result = transformScoreboard({ scoreboard: { games: [makeGame({ gameStatus: 2 })] } });
    expect(result[0].status).toBe('live');
  });

  it('maps status code 3 → final', () => {
    const result = transformScoreboard({ scoreboard: { games: [makeGame({ gameStatus: 3 })] } });
    expect(result[0].status).toBe('final');
  });

  it('maps unknown status code → unknown', () => {
    const result = transformScoreboard({ scoreboard: { games: [makeGame({ gameStatus: 99 })] } });
    expect(result[0].status).toBe('unknown');
  });

  it('builds homeTeam with name, abbreviation and score', () => {
    const result = transformScoreboard({ scoreboard: { games: [makeGame()] } });
    expect(result[0].homeTeam).toEqual({
      teamId: 1,
      abbreviation: 'LAL',
      name: 'Los Angeles Lakers',
      score: 110,
    });
  });

  it('builds awayTeam correctly', () => {
    const result = transformScoreboard({ scoreboard: { games: [makeGame()] } });
    expect(result[0].awayTeam.name).toBe('Golden State Warriors');
    expect(result[0].awayTeam.score).toBe(105);
  });

  it('extracts only date from gameTimeUTC', () => {
    const result = transformScoreboard({ scoreboard: { games: [makeGame()] } });
    expect(result[0].date).toBe('2025-04-10');
  });

  it('returns null date when gameTimeUTC is missing', () => {
    const result = transformScoreboard({ scoreboard: { games: [makeGame({ gameTimeUTC: null })] } });
    expect(result[0].date).toBeNull();
  });

  it('transforms multiple games', () => {
    const raw = { scoreboard: { games: [makeGame({ gameId: 'A' }), makeGame({ gameId: 'B' })] } };
    const result = transformScoreboard(raw);
    expect(result).toHaveLength(2);
    expect(result[0].gameId).toBe('A');
    expect(result[1].gameId).toBe('B');
  });
});
