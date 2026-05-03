'use strict';

const { transformGameLog, transformAverages } = require('../utils/transform/players.transform');

const GAME_LOG_HEADERS = [
  'Game_ID', 'GAME_DATE', 'MATCHUP', 'WL', 'MIN', 'PTS', 'REB', 'AST',
  'STL', 'BLK', 'TOV', 'FGM', 'FGA', 'FG_PCT', 'FG3M', 'FG3A', 'FG3_PCT',
  'FTM', 'FTA', 'FT_PCT', 'PLUS_MINUS',
];

const makeGameLogRow = (overrides = {}) => {
  const defaults = ['G001', 'APR 10, 2025', 'LAL vs. GSW', 'W', 36, 29, 8, 5, 2, 1, 3, 11, 20, 0.55, 3, 7, 0.43, 4, 5, 0.8, 12];
  return defaults;
};

const makeGameLogRaw = (rows = [makeGameLogRow()]) => ({
  resultSets: [{ name: 'PlayerGameLog', headers: GAME_LOG_HEADERS, rowSet: rows }],
});

const AVG_HEADERS = ['SEASON_ID', 'TEAM_ABBREVIATION', 'GP', 'MIN', 'PTS', 'REB', 'AST', 'STL', 'BLK', 'TOV', 'FG_PCT', 'FG3_PCT', 'FT_PCT'];
const makeAvgRow = () => ['2024-25', 'LAL', 60, 35.5, 25.0, 7.5, 8.3, 1.3, 0.5, 3.5, 0.52, 0.38, 0.79];

describe('transformGameLog', () => {
  it('returns empty array for null input', () => {
    expect(transformGameLog(null)).toEqual([]);
  });

  it('returns empty array when resultSet not found', () => {
    expect(transformGameLog({ resultSets: [] })).toEqual([]);
    expect(transformGameLog({ resultSets: [{ name: 'Other', headers: [], rowSet: [] }] })).toEqual([]);
  });

  it('maps core fields correctly', () => {
    const result = transformGameLog(makeGameLogRaw());
    expect(result[0].gameId).toBe('G001');
    expect(result[0].date).toBe('APR 10, 2025');
    expect(result[0].result).toBe('W');
    expect(result[0].points).toBe(29);
    expect(result[0].rebounds).toBe(8);
    expect(result[0].assists).toBe(5);
  });

  it('extracts opponent from MATCHUP (last token)', () => {
    const result = transformGameLog(makeGameLogRaw());
    expect(result[0].opponent).toBe('GSW');
  });

  it('sets homeAway to home when MATCHUP contains "vs."', () => {
    const result = transformGameLog(makeGameLogRaw());
    expect(result[0].homeAway).toBe('home');
  });

  it('sets homeAway to away when MATCHUP contains "@"', () => {
    const awayRow = [...makeGameLogRow()];
    awayRow[2] = 'LAL @ GSW';
    const result = transformGameLog(makeGameLogRaw([awayRow]));
    expect(result[0].homeAway).toBe('away');
  });

  it('transforms multiple rows', () => {
    const result = transformGameLog(makeGameLogRaw([makeGameLogRow(), makeGameLogRow()]));
    expect(result).toHaveLength(2);
  });
});

describe('transformAverages', () => {
  it('returns null for null input', () => {
    expect(transformAverages(null)).toBeNull();
  });

  it('returns null when resultSet not found', () => {
    expect(transformAverages({ resultSets: [] })).toBeNull();
  });

  it('returns null when rowSet is empty', () => {
    const raw = { resultSets: [{ name: 'SeasonTotalsRegularSeason', headers: AVG_HEADERS, rowSet: [] }] };
    expect(transformAverages(raw)).toBeNull();
  });

  it('uses the last row (totals row)', () => {
    const row1 = [...makeAvgRow()]; row1[1] = 'BOS';
    const row2 = [...makeAvgRow()]; row2[1] = 'LAL';
    const raw = { resultSets: [{ name: 'SeasonTotalsRegularSeason', headers: AVG_HEADERS, rowSet: [row1, row2] }] };
    const result = transformAverages(raw);
    expect(result.teamAbbreviation).toBe('LAL');
  });

  it('maps all stat fields', () => {
    const raw = { resultSets: [{ name: 'SeasonTotalsRegularSeason', headers: AVG_HEADERS, rowSet: [makeAvgRow()] }] };
    const result = transformAverages(raw);
    expect(result.season).toBe('2024-25');
    expect(result.gamesPlayed).toBe(60);
    expect(result.pointsPerGame).toBe(25.0);
    expect(result.reboundsPerGame).toBe(7.5);
    expect(result.assistsPerGame).toBe(8.3);
    expect(result.fgPct).toBe(0.52);
  });
});
