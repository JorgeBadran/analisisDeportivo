'use strict';

const { transformBoxscore } = require('../utils/transform/boxscore.transform');

const makePlayer = (overrides = {}) => ({
  personId: 2544,
  name: 'LeBron James',
  position: 'F',
  starter: '1',
  statistics: {
    minutesCalculated: '36:00',
    points: 30,
    reboundsTotal: 8,
    assists: 7,
    steals: 1,
    blocks: 1,
    turnovers: 3,
    fieldGoalsMade: 11,
    fieldGoalsAttempted: 20,
    threePointersMade: 2,
    threePointersAttempted: 6,
    freeThrowsMade: 6,
    freeThrowsAttempted: 8,
    plusMinusPoints: 10,
    ...overrides,
  },
});

const makeTeam = (id = 1, tricode = 'LAL') => ({
  teamId: id,
  teamTricode: tricode,
  players: [makePlayer()],
  statistics: { points: 115, reboundsTotal: 45, assists: 28, steals: 7, blocks: 5, turnovers: 14 },
});

const makeRaw = () => ({
  game: {
    gameId: 'G001',
    gameStatusText: 'Final',
    homeTeam: makeTeam(1, 'LAL'),
    awayTeam: makeTeam(2, 'GSW'),
  },
});

describe('transformBoxscore', () => {
  it('returns null for null input', () => {
    expect(transformBoxscore(null)).toBeNull();
    expect(transformBoxscore({})).toBeNull();
  });

  it('maps gameId and status', () => {
    const result = transformBoxscore(makeRaw());
    expect(result.gameId).toBe('G001');
    expect(result.status).toBe('Final');
  });

  it('includes homeTeam and awayTeam', () => {
    const result = transformBoxscore(makeRaw());
    expect(result.homeTeam.teamId).toBe(1);
    expect(result.homeTeam.abbreviation).toBe('LAL');
    expect(result.awayTeam.teamId).toBe(2);
    expect(result.awayTeam.abbreviation).toBe('GSW');
  });

  it('maps player stats correctly', () => {
    const result = transformBoxscore(makeRaw());
    const player = result.homeTeam.players[0];
    expect(player.personId).toBe(2544);
    expect(player.name).toBe('LeBron James');
    expect(player.starter).toBe(true);
    expect(player.minutes).toBe('36:00');
    expect(player.points).toBe(30);
    expect(player.rebounds).toBe(8);
    expect(player.assists).toBe(7);
    expect(player.fgm).toBe(11);
    expect(player.fga).toBe(20);
    expect(player.plusMinus).toBe(10);
  });

  it('maps starter "1" → true, non-1 → false', () => {
    const raw = makeRaw();
    raw.game.homeTeam.players[0].starter = '0';
    const result = transformBoxscore(raw);
    expect(result.homeTeam.players[0].starter).toBe(false);
  });

  it('falls back to "0:00" for missing minutes', () => {
    const raw = makeRaw();
    delete raw.game.homeTeam.players[0].statistics.minutesCalculated;
    delete raw.game.homeTeam.players[0].statistics.minutes;
    const result = transformBoxscore(raw);
    expect(result.homeTeam.players[0].minutes).toBe('0:00');
  });

  it('maps team totals', () => {
    const result = transformBoxscore(makeRaw());
    expect(result.homeTeam.totals.points).toBe(115);
    expect(result.homeTeam.totals.rebounds).toBe(45);
    expect(result.homeTeam.totals.assists).toBe(28);
  });

  it('defaults team stat fields to 0 when missing', () => {
    const raw = makeRaw();
    raw.game.homeTeam.statistics = {};
    const result = transformBoxscore(raw);
    expect(result.homeTeam.totals.points).toBe(0);
    expect(result.homeTeam.totals.rebounds).toBe(0);
  });

  it('handles team with no players', () => {
    const raw = makeRaw();
    raw.game.homeTeam.players = [];
    const result = transformBoxscore(raw);
    expect(result.homeTeam.players).toEqual([]);
  });
});
