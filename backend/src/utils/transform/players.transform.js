'use strict';

/**
 * Transformadores de estadísticas de jugadores.
 *
 * La API de la NBA devuelve los datos en formato "tabla relacional":
 * un array de cabeceras (headers) y un array de filas (rowSet), donde
 * cada fila es un array de valores en el mismo orden que las cabeceras.
 *
 * Ejemplo:
 *   headers: ['PLAYER_ID', 'GAME_DATE', 'PTS', ...]
 *   rowSet:  [[2544, 'APR 10, 2025', 29, ...], ...]
 *
 * La función zipRow() convierte cada fila en un objeto clave-valor antes de
 * extraer los campos que necesitamos.
 */

/**
 * Transforma el historial de partidos (game log) de un jugador.
 * Convierte el resultSet 'PlayerGameLog' en un array de objetos legibles.
 *
 * @param {object} raw - Respuesta cruda de playergamelog
 * @returns {Array} Array de partidos con estadísticas individuales por partido
 */
function transformGameLog(raw) {
  const resultSet = raw?.resultSets?.find((r) => r.name === 'PlayerGameLog');
  if (!resultSet) return [];

  const headers = resultSet.headers;
  return resultSet.rowSet.map((row) => {
    const r = zipRow(headers, row); // Convertir fila array → objeto

    return {
      gameId: r.Game_ID,
      date: r.GAME_DATE,
      // MATCHUP tiene formato "LAL vs. GSW" (local) o "LAL @ GSW" (visitante)
      opponent: r.MATCHUP?.split(' ').pop(),            // Último token = siglas del rival
      homeAway: r.MATCHUP?.includes('vs.') ? 'home' : 'away',
      result: r.WL,       // 'W' (victoria) o 'L' (derrota)
      minutes: r.MIN,
      points: r.PTS,
      rebounds: r.REB,
      assists: r.AST,
      steals: r.STL,
      blocks: r.BLK,
      turnovers: r.TOV,
      fgm: r.FGM,
      fga: r.FGA,
      fgPct: r.FG_PCT,    // Porcentaje de tiros de campo (0.0 – 1.0)
      tpm: r.FG3M,
      tpa: r.FG3A,
      tpPct: r.FG3_PCT,   // Porcentaje de triples
      ftm: r.FTM,
      fta: r.FTA,
      ftPct: r.FT_PCT,    // Porcentaje de tiros libres
      plusMinus: r.PLUS_MINUS,
    };
  });
}

/**
 * Transforma los promedios de temporada de un jugador.
 * Usa el último elemento de 'SeasonTotalsRegularSeason', que corresponde
 * a la temporada más reciente cuando el jugador ha jugado en varios equipos.
 *
 * @param {object} raw - Respuesta cruda de playerprofilev2
 * @returns {object|null} Promedios por partido de la temporada, o null si no hay datos
 */
function transformAverages(raw) {
  const set = raw?.resultSets?.find((r) => r.name === 'SeasonTotalsRegularSeason');
  if (!set || !set.rowSet.length) return null;

  const headers = set.headers;
  // Tomar la última fila: si el jugador fue traspasado, hay una fila por equipo
  // + una fila de totales al final que resume toda la temporada
  const r = zipRow(headers, set.rowSet[set.rowSet.length - 1]);

  return {
    season: r.SEASON_ID,
    teamAbbreviation: r.TEAM_ABBREVIATION,
    gamesPlayed: r.GP,
    minutesPerGame: r.MIN,
    pointsPerGame: r.PTS,
    reboundsPerGame: r.REB,
    assistsPerGame: r.AST,
    stealsPerGame: r.STL,
    blocksPerGame: r.BLK,
    turnoversPerGame: r.TOV,
    fgPct: r.FG_PCT,
    tpPct: r.FG3_PCT,
    ftPct: r.FT_PCT,
  };
}

/**
 * Convierte una fila del formato tabular de la NBA en un objeto clave-valor.
 * Necesario porque la NBA devuelve datos como arrays de valores sin claves.
 *
 * @param {string[]} headers - Array de nombres de columna
 * @param {Array}    row     - Array de valores en el mismo orden que headers
 * @returns {object} Objeto { columna: valor }
 */
function zipRow(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i]; });
  return obj;
}

module.exports = { transformGameLog, transformAverages };
