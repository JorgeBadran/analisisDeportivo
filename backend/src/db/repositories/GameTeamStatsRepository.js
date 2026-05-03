'use strict';

const BaseRepository = require('./BaseRepository');

class GameTeamStatsRepository extends BaseRepository {
  constructor() {
    super('game_team_stats', ['game_id', 'team_id'], []);
  }

  async findByGame(gameId) {
    return this.db('game_team_stats').where({ game_id: gameId });
  }

  async findByTeamSeason(teamId, seasonId) {
    return this.db('game_team_stats as gts')
      .join('games as g', 'g.id', 'gts.game_id')
      .where({ 'gts.team_id': teamId, 'g.season_id': seasonId })
      .select('gts.*', 'g.game_date', 'g.nba_game_id')
      .orderBy('g.game_date', 'desc');
  }
}

module.exports = GameTeamStatsRepository;
