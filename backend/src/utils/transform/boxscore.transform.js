'use strict';

/**
 * Transformadores del boxscore de un partido.
 * Convierten el JSON crudo de boxscoretraditionalv3 en el formato de la API.
 *
 * Un boxscore contiene las estadísticas individuales de cada jugador que participó
 * en el partido, más los totales del equipo. La NBA usa nombres de campo muy
 * técnicos (ej. 'reboundsTotal', 'minutesCalculated') que aquí se simplifican.
 */

/**
 * Transforma el JSON completo del boxscore en el objeto estándar de la API.
 *
 * @param {object} raw - Respuesta cruda de boxscoretraditionalv3
 * @returns {object|null} Boxscore normalizado, o null si el JSON es inválido
 */
function transformBoxscore(raw) {
  const game = raw?.game;
  if (!game) return null;

  return {
    gameId: game.gameId,
    status: game.gameStatusText,
    homeTeam: transformTeamBox(game.homeTeam),
    awayTeam: transformTeamBox(game.awayTeam),
  };
}

/**
 * Transforma los datos de un equipo dentro del boxscore:
 * normaliza la lista de jugadores y calcula los totales del equipo.
 *
 * @param {object} team - Objeto de equipo del JSON crudo de la NBA
 * @returns {object|null} Datos del equipo normalizados con jugadores y totales
 */
function transformTeamBox(team) {
  if (!team) return null;

  // Mapear cada jugador a un objeto plano con nombres de campo legibles
  const players = (team.players || []).map((p) => {
    const s = p.statistics || {}; // Alias corto para no repetir 'p.statistics' en cada campo

    return {
      personId: p.personId,
      name: p.name,
      position: p.position,
      starter: p.starter === '1',  // La NBA envía '1' (string) para titulares
      // minutesCalculated es la versión precisa; minutes es el fallback legacy
      minutes: s.minutesCalculated || s.minutes || '0:00',
      points: s.points ?? 0,
      rebounds: s.reboundsTotal ?? 0,  // reboundsTotal = ofensivos + defensivos
      assists: s.assists ?? 0,
      steals: s.steals ?? 0,
      blocks: s.blocks ?? 0,
      turnovers: s.turnovers ?? 0,
      fgm: s.fieldGoalsMade ?? 0,       // Tiros de campo anotados
      fga: s.fieldGoalsAttempted ?? 0,  // Tiros de campo intentados
      tpm: s.threePointersMade ?? 0,    // Triples anotados
      tpa: s.threePointersAttempted ?? 0,
      ftm: s.freeThrowsMade ?? 0,       // Tiros libres anotados
      fta: s.freeThrowsAttempted ?? 0,
      plusMinus: s.plusMinusPoints ?? 0, // Diferencial de puntuación con el jugador en cancha
    };
  });

  // Totales del equipo (suma de todos los jugadores)
  const totals = team.statistics || {};
  return {
    teamId: team.teamId,
    abbreviation: team.teamTricode,
    players,
    totals: {
      points: totals.points ?? 0,
      rebounds: totals.reboundsTotal ?? 0,
      assists: totals.assists ?? 0,
      steals: totals.steals ?? 0,
      blocks: totals.blocks ?? 0,
      turnovers: totals.turnovers ?? 0,
    },
  };
}

module.exports = { transformBoxscore };
