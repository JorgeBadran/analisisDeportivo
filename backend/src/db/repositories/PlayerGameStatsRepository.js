'use strict';

const BaseRepository = require('./BaseRepository');

class PlayerGameStatsRepository extends BaseRepository {
  constructor() {
    super('player_game_stats', ['game_id', 'player_id'], []);
  }

  async findByGame(gameId) {
    return this.db('player_game_stats').where({ game_id: gameId }).orderBy('pts', 'desc');
  }

  async findByPlayer(playerId, seasonId, limit = 30, offset = 0) {
    return this.db('player_game_stats')
      .where({ player_id: playerId, season_id: seasonId })
      .orderBy('game_date', 'desc')
      .limit(limit)
      .offset(offset);
  }

  async getSeasonAverages(playerId, seasonId) {
    return this.db('player_game_stats')
      .where({ player_id: playerId, season_id: seasonId, did_not_play: false })
      .avg({
        pts: 'pts', reb: 'reb', ast: 'ast', stl: 'stl', blk: 'blk',
        tov: 'tov', fg_pct: 'fg_pct', fg3_pct: 'fg3_pct', ft_pct: 'ft_pct',
      })
      .count('game_id as games_played')
      .first();
  }

  async getLeaders(seasonId, stat = 'pts', limit = 10) {
    return this.db('player_game_stats as pgs')
      .join('players as p', 'p.id', 'pgs.player_id')
      .where({ 'pgs.season_id': seasonId, 'pgs.did_not_play': false })
      .groupBy('pgs.player_id', 'p.first_name', 'p.last_name')
      .avg({ stat_avg: stat })
      .count('pgs.game_id as games_played')
      .select('p.first_name', 'p.last_name', 'pgs.player_id')
      .orderBy('stat_avg', 'desc')
      .limit(limit);
  }
}

module.exports = PlayerGameStatsRepository;
