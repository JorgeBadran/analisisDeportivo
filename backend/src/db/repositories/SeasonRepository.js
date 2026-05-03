'use strict';

const BaseRepository = require('./BaseRepository');

class SeasonRepository extends BaseRepository {
  constructor() {
    super('seasons', ['season_id'], []);
  }

  async getCurrent() {
    return this.db('seasons').where({ is_current: true }).first();
  }

  async findBySeasonId(seasonId) {
    return this.db('seasons').where({ season_id: seasonId }).first();
  }

  async setCurrentSeason(id) {
    await this.db('seasons').update({ is_current: false });
    await this.db('seasons').where({ id }).update({ is_current: true });
  }
}

module.exports = SeasonRepository;
