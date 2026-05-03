'use strict';

/**
 * Transformador de la clasificación (standings) de la NBA.
 *
 * El resultSet 'Standings' tiene una fila por equipo con ~50 campos.
 * Esta función extrae solo los campos relevantes y separa los equipos
 * por conferencia (Este / Oeste) ordenados por victorias.
 */

/**
 * Transforma el JSON crudo de leaguestandingsv3 en el objeto de clasificación de la API.
 * Devuelve dos arrays (east / west), cada uno ordenado de más victorias a menos.
 *
 * @param {object} raw - Respuesta cruda de leaguestandingsv3
 * @returns {{ east: Array, west: Array }} Clasificación separada por conferencia
 */
function transformStandings(raw) {
  const set = raw?.resultSets?.find((r) => r.name === 'Standings');
  // Si no hay datos válidos devolver estructura vacía para no romper el servicio
  if (!set) return { east: [], west: [] };

  const headers = set.headers;

  // Convertir cada fila tabular en un objeto de equipo normalizado
  const teams = set.rowSet.map((row) => {
    const r = zipRow(headers, row);

    return {
      // PlayoffRank es la posición en playoffs; si no existe, usar récord de conferencia
      rank: r.PlayoffRank || r.ConferenceRecord,
      teamId: r.TeamID,
      name: r.TeamCity + ' ' + r.TeamName,
      abbreviation: r.TeamSlug?.toUpperCase() || '',
      conference: r.Conference,  // 'East' o 'West'
      division: r.Division,      // ej. 'Atlantic', 'Pacific'
      wins: r.WINS,
      losses: r.LOSSES,
      winPct: r.WinPCT,
      // ConferenceGamesBack: diferencia de juegos respecto al líder; '--' para el primero
      gamesBehind: r.ConferenceGamesBack || '--',
      homeRecord: r.HOME,        // ej. '34-7'
      awayRecord: r.ROAD,        // ej. '30-11'
      lastTen: r.L10,            // Récord en los últimos 10 partidos
      streak: r.CurrentStreak,   // ej. 'W3' (3 victorias consecutivas)
      // clinchIndicator: 'x' = clasificado, 'y' = ganó división, 'z' = mejor registro
      clinched: r.clinchIndicator || null,
    };
  });

  return {
    // Filtrar y ordenar cada conferencia por victorias (descendente)
    east: teams.filter((t) => t.conference === 'East').sort((a, b) => a.wins - b.wins ? b.wins - a.wins : 0),
    west: teams.filter((t) => t.conference === 'West').sort((a, b) => b.wins - a.wins),
  };
}

/**
 * Convierte una fila del formato tabular de la NBA en un objeto clave-valor.
 *
 * @param {string[]} headers - Nombres de columna
 * @param {Array}    row     - Valores en el mismo orden que headers
 * @returns {object}
 */
function zipRow(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i]; });
  return obj;
}

module.exports = { transformStandings };
