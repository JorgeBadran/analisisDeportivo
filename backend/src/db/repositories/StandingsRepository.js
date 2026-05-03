'use strict';

const BaseRepository = require('./BaseRepository');

class StandingsRepository extends BaseRepository {
  constructor() {
    super('standings_snapshots', ['team_id', 'season_id', 'snapshot_date'], []);
  }

  async getLatestByDate(seasonId, date) {
    return this.db('standings_snapshots')
      .where({ season_id: seasonId, snapshot_date: date })
      .orderBy('conference')
      .orderBy('conference_rank');
  }

  async getLatest(seasonId) {
    const maxDate = await this.db('standings_snapshots')
      .where({ season_id: seasonId })
      .max('snapshot_date as max_date')
      .first();

    if (!maxDate?.max_date) return [];
    return this.getLatestByDate(seasonId, maxDate.max_date);
  }

  async getTeamHistory(teamId, seasonId) {
    return this.db('standings_snapshots')
      .where({ team_id: teamId, season_id: seasonId })
      .orderBy('snapshot_date');
  }
}

module.exports = StandingsRepository;
