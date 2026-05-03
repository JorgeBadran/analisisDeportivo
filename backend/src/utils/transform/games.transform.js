'use strict';

/**
 * Transformadores del marcador diario (scoreboard).
 * Convierten el JSON crudo de scoreboardV3 en el formato limpio que devuelve la API.
 *
 * El JSON de la NBA tiene una estructura profunda y con nombres de campo no intuitivos.
 * Estas funciones aplanan y renombran los campos para que el cliente reciba
 * un objeto predecible y fácil de consumir.
 */

/**
 * Transforma el JSON completo de scoreboardV3 en un array de partidos normalizados.
 *
 * @param {object} raw - Respuesta cruda de stats.nba.com/stats/scoreboardV3
 * @returns {Array} Array de objetos de partido con formato estándar de la API
 */
function transformScoreboard(raw) {
  // Acceso seguro: si el JSON no tiene la estructura esperada, devolver array vacío
  const games = raw?.scoreboard?.games || [];

  return games.map((g) => ({
    gameId: g.gameId,
    status: mapStatus(g.gameStatus),   // Código numérico → string legible
    statusText: g.gameStatusText,      // Texto original de la NBA (ej. "Q3 4:32")
    period: g.period,                  // Período actual (0 = no iniciado, 4 = 4to, >4 = prórroga)
    clock: g.gameClock || null,        // Reloj del partido (null si no ha empezado o terminó)
    homeTeam: {
      teamId: g.homeTeam?.teamId,
      abbreviation: g.homeTeam?.teamTricode,  // Siglas del equipo (ej. "LAL")
      name: `${g.homeTeam?.teamCity} ${g.homeTeam?.teamName}`,
      score: g.homeTeam?.score,
    },
    awayTeam: {
      teamId: g.awayTeam?.teamId,
      abbreviation: g.awayTeam?.teamTricode,
      name: `${g.awayTeam?.teamCity} ${g.awayTeam?.teamName}`,
      score: g.awayTeam?.score,
    },
    // Extraer solo la fecha (YYYY-MM-DD) del timestamp UTC completo
    date: g.gameTimeUTC ? g.gameTimeUTC.split('T')[0] : null,
  }));
}

/**
 * Convierte el código numérico de estado del partido en un string legible.
 * Valores definidos por la NBA:
 *   1 → partido programado pero no iniciado
 *   2 → partido en curso
 *   3 → partido finalizado
 *
 * @param {number} code - Código numérico de gameStatus
 * @returns {string} 'upcoming' | 'live' | 'final' | 'unknown'
 */
function mapStatus(code) {
  if (code === 1) return 'upcoming';
  if (code === 2) return 'live';
  if (code === 3) return 'final';
  return 'unknown';
}

module.exports = { transformScoreboard };
