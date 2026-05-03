'use strict';

const BaseRepository = require('./BaseRepository');

class TeamRepository extends BaseRepository {
  constructor() {
    super('teams', ['nba_team_id'], ['conference', 'division', 'is_active']);
  }

  async findByNbaId(nbaTeamId) {
    return this.db('teams').where({ nba_team_id: nbaTeamId }).first();
  }

  async findByAbbreviation(abbreviation) {
    return this.db('teams').where({ abbreviation }).first();
  }

  async findActive(conference = null) {
    const query = this.db('teams').where({ is_active: true });
    if (conference) query.where({ conference });
    return query.orderBy('full_name');
  }
}

module.exports = TeamRepository;
