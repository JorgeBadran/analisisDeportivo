'use strict';

const BaseRepository = require('./BaseRepository');

class PlayerSeasonAveragesRepository extends BaseRepository {
  constructor() {
    // Append-only — conflict key includes snapshot_date for idempotency
    super('player_season_averages', ['player_id', 'season_id', 'snapshot_date'], []);
  }

  async getLatest(playerId, seasonId) {
    return this.db('player_season_averages')
      .where({ player_id: playerId, season_id: seasonId })
      .orderBy('snapshot_date', 'desc')
      .first();
  }

  async getHistory(playerId, seasonId) {
    return this.db('player_season_averages')
      .where({ player_id: playerId, season_id: seasonId })
      .orderBy('snapshot_date');
  }
}

module.exports = PlayerSeasonAveragesRepository;
