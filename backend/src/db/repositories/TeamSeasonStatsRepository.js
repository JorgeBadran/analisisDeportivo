'use strict';

const BaseRepository = require('./BaseRepository');

class TeamSeasonStatsRepository extends BaseRepository {
  constructor() {
    super('team_season_stats', ['team_id', 'season_id', 'snapshot_date'], []);
  }

  async getLatest(teamId, seasonId) {
    return this.db('team_season_stats')
      .where({ team_id: teamId, season_id: seasonId })
      .orderBy('snapshot_date', 'desc')
      .first();
  }

  async getAllLatestForSeason(seasonId) {
    // Subquery to get the most recent snapshot_date per team for this season
    const subquery = this.db('team_season_stats')
      .where({ season_id: seasonId })
      .groupBy('team_id')
      .max('snapshot_date as max_date')
      .select('team_id');

    return this.db('team_season_stats as tss')
      .join(subquery.as('latest'), function () {
        this.on('tss.team_id', 'latest.team_id').andOn('tss.snapshot_date', 'latest.max_date');
      })
      .where({ 'tss.season_id': seasonId });
  }
}

module.exports = TeamSeasonStatsRepository;
