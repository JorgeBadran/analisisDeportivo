'use strict';

/**
 * Transformador del calendario de la temporada NBA.
 *
 * El JSON de scheduleleaguev2 organiza los partidos en grupos por fecha (gameDates),
 * cada uno con un array de partidos (games). Esta función aplana esa estructura
 * en un array lineal de partidos, más fácil de paginar y filtrar.
 */

/**
 * Transforma el calendario completo de una temporada en un array plano de partidos.
 * Aplana la estructura anidada gameDates → games en un único array.
 *
 * @param {object} raw - Respuesta cruda de scheduleleaguev2
 * @returns {Array} Array plano de partidos, ordenados cronológicamente (como los devuelve la NBA)
 */
function transformSchedule(raw) {
  // gameDates es un array donde cada elemento agrupa los partidos de un día
  const gameDates = raw?.leagueSchedule?.gameDates || [];
  const games = [];

  for (const gd of gameDates) {
    // Iterar sobre los partidos del día y aplanarlos al array principal
    for (const g of gd.games || []) {
      games.push({
        gameId: g.gameId,
        // gameDate tiene formato 'MM/DD/YYYY HH:MM:SS' → extraer solo la fecha
        date: gd.gameDate ? gd.gameDate.split(' ')[0] : null,
        // Hora de inicio en UTC (formato ISO completo)
        time: g.gameDateTimeUTC || null,
        homeTeam: {
          teamId: g.homeTeam?.teamId,
          abbreviation: g.homeTeam?.teamTricode,
          name: `${g.homeTeam?.teamCity} ${g.homeTeam?.teamName}`,
        },
        awayTeam: {
          teamId: g.awayTeam?.teamId,
          abbreviation: g.awayTeam?.teamTricode,
          name: `${g.awayTeam?.teamCity} ${g.awayTeam?.teamName}`,
        },
        venue: g.arenaName || null,
        // Solo canales de TV nacionales (sin broadcasting local de cada ciudad)
        broadcasters: (g.broadcasters?.nationalTvBroadcasters || []).map((b) => b.broadcasterDisplay),
      });
    }
  }

  return games;
}

module.exports = { transformSchedule };
