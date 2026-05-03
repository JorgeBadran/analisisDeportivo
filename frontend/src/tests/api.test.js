import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import client from '../api/client';
import {
  getGames,
  getBoxscore,
  getSchedule,
  getPlayerStats,
  getPlayerAverages,
  getTeams,
  getTeam,
  getStandings,
  getTeamsSelect,
  getPlayersForTeam,
  searchPlayers,
  getScrapeLogs,
  triggerScrape,
} from '../api/index';

let mock;

beforeEach(() => {
  mock = new MockAdapter(client);
});

afterEach(() => {
  mock.restore();
});

// ── Games ─────────────────────────────────────────────────────────────────────

describe('getGames', () => {
  it('calls GET /games with date and status params', async () => {
    const payload = { data: [{ gameId: 'G1' }] };
    mock.onGet('/games', { params: { date: '2025-04-10', status: 'final' } }).reply(200, payload);

    const res = await getGames('2025-04-10', 'final');
    expect(res.status).toBe(200);
    expect(res.data).toEqual(payload);
  });

  it('calls GET /games without params when omitted', async () => {
    mock.onGet('/games').reply(200, { data: [] });
    const res = await getGames();
    expect(res.status).toBe(200);
  });

  it('rejects on server error', async () => {
    mock.onGet('/games').reply(500);
    await expect(getGames()).rejects.toThrow();
  });
});

describe('getBoxscore', () => {
  it('calls GET /games/:gameId/boxscore', async () => {
    const payload = { data: { gameId: 'G001' } };
    mock.onGet('/games/G001/boxscore').reply(200, payload);

    const res = await getBoxscore('G001');
    expect(res.status).toBe(200);
    expect(res.data).toEqual(payload);
  });

  it('rejects on 404', async () => {
    mock.onGet('/games/INVALID/boxscore').reply(404, { error: 'Not found' });
    await expect(getBoxscore('INVALID')).rejects.toThrow();
  });
});

// ── Schedule ──────────────────────────────────────────────────────────────────

describe('getSchedule', () => {
  it('calls GET /schedule with provided params', async () => {
    const params = { season: '2024-25', from: '2024-10-22', to: '2025-04-13', page: 1, limit: 30 };
    const payload = { data: [], meta: { total: 0 } };
    mock.onGet('/schedule', { params }).reply(200, payload);

    const res = await getSchedule(params);
    expect(res.status).toBe(200);
    expect(res.data.meta).toBeDefined();
  });

  it('calls GET /schedule with teamId filter', async () => {
    const params = { season: '2024-25', teamId: '1610612747' };
    mock.onGet('/schedule', { params }).reply(200, { data: [] });
    const res = await getSchedule(params);
    expect(res.status).toBe(200);
  });
});

// ── Players ───────────────────────────────────────────────────────────────────

describe('getPlayerStats', () => {
  it('calls GET /players/:id/stats with params', async () => {
    const params = { season: '2024-25', seasonType: 'Regular Season' };
    const payload = { data: [] };
    mock.onGet('/players/2544/stats', { params }).reply(200, payload);

    const res = await getPlayerStats('2544', params);
    expect(res.status).toBe(200);
    expect(res.data).toEqual(payload);
  });

  it('rejects on 404 for unknown player', async () => {
    mock.onGet('/players/9999/stats').reply(404);
    await expect(getPlayerStats('9999', {})).rejects.toThrow();
  });
});

describe('getPlayerAverages', () => {
  it('calls GET /players/:id/averages with params', async () => {
    const params = { season: '2024-25' };
    const payload = { data: { pointsPerGame: 27.2 } };
    mock.onGet('/players/2544/averages', { params }).reply(200, payload);

    const res = await getPlayerAverages('2544', params);
    expect(res.status).toBe(200);
    expect(res.data.data.pointsPerGame).toBe(27.2);
  });
});

// ── Teams ─────────────────────────────────────────────────────────────────────

describe('getTeams', () => {
  it('calls GET /teams with params', async () => {
    const params = { season: '2024-25', seasonType: 'Regular Season' };
    const payload = { data: [{ teamId: 1, name: 'Lakers' }] };
    mock.onGet('/teams', { params }).reply(200, payload);

    const res = await getTeams(params);
    expect(res.status).toBe(200);
    expect(res.data.data).toHaveLength(1);
  });

  it('calls GET /teams with conference filter', async () => {
    const params = { conference: 'East' };
    mock.onGet('/teams', { params }).reply(200, { data: [] });
    const res = await getTeams(params);
    expect(res.status).toBe(200);
  });
});

describe('getTeam', () => {
  it('calls GET /teams/:teamId with params', async () => {
    const params = { season: '2024-25' };
    const payload = { data: { teamId: 1, name: 'Lakers', roster: [] } };
    mock.onGet('/teams/1', { params }).reply(200, payload);

    const res = await getTeam(1, params);
    expect(res.status).toBe(200);
    expect(res.data.data.name).toBe('Lakers');
  });

  it('rejects on 404 for unknown team', async () => {
    mock.onGet('/teams/9999').reply(404);
    await expect(getTeam(9999, {})).rejects.toThrow();
  });
});

// ── Standings ─────────────────────────────────────────────────────────────────

describe('getStandings', () => {
  it('calls GET /standings with params', async () => {
    const params = { season: '2024-25', seasonType: 'Regular Season', group: 'conference' };
    const payload = { data: { east: [], west: [] } };
    mock.onGet('/standings', { params }).reply(200, payload);

    const res = await getStandings(params);
    expect(res.status).toBe(200);
    expect(res.data.data).toHaveProperty('east');
    expect(res.data.data).toHaveProperty('west');
  });
});

// ── Select lists ──────────────────────────────────────────────────────────────

describe('getTeamsSelect', () => {
  it('calls GET /select/teams without conference', async () => {
    const payload = { data: [{ teamId: 1, name: 'Lakers' }] };
    mock.onGet('/select/teams', { params: { conference: undefined } }).reply(200, payload);

    const res = await getTeamsSelect();
    expect(res.status).toBe(200);
    expect(res.data.data).toHaveLength(1);
  });

  it('calls GET /select/teams with conference filter', async () => {
    mock.onGet('/select/teams', { params: { conference: 'East' } }).reply(200, { data: [] });
    const res = await getTeamsSelect('East');
    expect(res.status).toBe(200);
  });
});

describe('getPlayersForTeam', () => {
  it('calls GET /select/teams/:teamId/players', async () => {
    const payload = { data: [{ personId: 2544, name: 'LeBron James' }] };
    mock.onGet('/select/teams/1/players').reply(200, payload);

    const res = await getPlayersForTeam(1);
    expect(res.status).toBe(200);
    expect(res.data.data[0].name).toBe('LeBron James');
  });

  it('rejects on 404 for unknown team', async () => {
    mock.onGet('/select/teams/9999/players').reply(404);
    await expect(getPlayersForTeam(9999)).rejects.toThrow();
  });
});

describe('searchPlayers', () => {
  it('calls GET /select/players/search with q param', async () => {
    const payload = { data: [{ personId: 2544, name: 'LeBron James' }] };
    mock.onGet('/select/players/search', { params: { q: 'lebron' } }).reply(200, payload);

    const res = await searchPlayers('lebron');
    expect(res.status).toBe(200);
    expect(res.data.data).toHaveLength(1);
  });

  it('rejects on 400 when query is too short', async () => {
    mock.onGet('/select/players/search', { params: { q: 'a' } }).reply(400, { error: 'Query too short' });
    await expect(searchPlayers('a')).rejects.toThrow();
  });
});

// ── Scrape ────────────────────────────────────────────────────────────────────

describe('getScrapeLogs', () => {
  it('calls GET /scrape/logs with params', async () => {
    const params = { limit: 10 };
    const payload = { data: [{ id: 1, status: 'success' }] };
    mock.onGet('/scrape/logs', { params }).reply(200, payload);

    const res = await getScrapeLogs(params);
    expect(res.status).toBe(200);
    expect(res.data.data[0].status).toBe('success');
  });
});

describe('triggerScrape', () => {
  it('calls POST /scrape/run', async () => {
    const payload = { message: 'Scrape started' };
    mock.onPost('/scrape/run').reply(202, payload);

    const res = await triggerScrape();
    expect(res.status).toBe(202);
    expect(res.data.message).toBe('Scrape started');
  });

  it('rejects on server error', async () => {
    mock.onPost('/scrape/run').reply(503);
    await expect(triggerScrape()).rejects.toThrow();
  });
});
