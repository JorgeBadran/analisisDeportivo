'use strict';

const BaseRepository = require('./BaseRepository');

class GameRepository extends BaseRepository {
  constructor() {
    super('games', ['nba_game_id'], ['status', 'home_score', 'away_score', 'period', 'game_clock']);
  }

  async findByNbaId(nbaGameId) {
    return this.db('games').where({ nba_game_id: nbaGameId }).first();
  }

  async findByDate(date, seasonId = null) {
    const query = this.db('games').where({ game_date: date });
    if (seasonId) query.where({ season_id: seasonId });
    return query.orderBy('nba_game_id');
  }

  async findBySeason(seasonId, status = null, limit = 100, offset = 0) {
    const query = this.db('games').where({ season_id: seasonId });
    if (status) query.where({ status });
    return query.orderBy('game_date', 'desc').limit(limit).offset(offset);
  }

  // Returns games with status 'scheduled' or 'live' that lack a populated boxscore
  async findNeedingBoxscore(seasonId) {
    return this.db('games')
      .where({ season_id: seasonId })
      .whereIn('status', ['final'])
      .whereNotExists(
        this.db('game_team_stats').whereRaw('game_team_stats.game_id = games.id').limit(1)
      )
      .orderBy('game_date');
  }

  async findByTeam(teamId, seasonId = null, limit = 20) {
    const query = this.db('games').where(function () {
      this.where({ home_team_id: teamId }).orWhere({ away_team_id: teamId });
    });
    if (seasonId) query.where({ season_id: seasonId });
    return query.orderBy('game_date', 'desc').limit(limit);
  }
}

module.exports = GameRepository;
