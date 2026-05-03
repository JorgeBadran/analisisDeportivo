import client from './client';

// ── Games ─────────────────────────────────────────────────────────────────────
export const getGames      = (date, status)       => client.get('/games', { params: { date, status } });
export const getBoxscore   = (gameId)             => client.get(`/games/${gameId}/boxscore`);

// ── Schedule ──────────────────────────────────────────────────────────────────
export const getSchedule   = (params)             => client.get('/schedule', { params });

// ── Players ───────────────────────────────────────────────────────────────────
export const getPlayerStats    = (id, params)     => client.get(`/players/${id}/stats`, { params });
export const getPlayerAverages = (id, params)     => client.get(`/players/${id}/averages`, { params });

// ── Teams ─────────────────────────────────────────────────────────────────────
export const getTeams      = (params)             => client.get('/teams', { params });
export const getTeam       = (teamId, params)     => client.get(`/teams/${teamId}`, { params });

// ── Standings ─────────────────────────────────────────────────────────────────
export const getStandings  = (params)             => client.get('/standings', { params });

// ── Select lists (dedicated lightweight endpoints) ────────────────────────────
export const getTeamsSelect       = (conference)  => client.get('/select/teams', { params: { conference } });
export const getPlayersForTeam    = (teamId)      => client.get(`/select/teams/${teamId}/players`);
export const searchPlayers        = (q)           => client.get('/select/players/search', { params: { q } });

// ── Playoffs ──────────────────────────────────────────────────────────────────
export const getPlayoffBracket = () => client.get('/playoffs/bracket');

// ── Scrape ────────────────────────────────────────────────────────────────────
export const getScrapeLogs = (params)             => client.get('/scrape/logs', { params });
export const triggerScrape = ()                   => client.post('/scrape/run');
