'use strict';

const BaseRepository = require('./BaseRepository');

class PlayerRepository extends BaseRepository {
  constructor() {
    super('players', ['nba_player_id'], ['current_team_id', 'jersey_number', 'is_active']);
  }

  async findByNbaId(nbaPlayerId) {
    return this.db('players').where({ nba_player_id: nbaPlayerId }).first();
  }

  async findByTeam(teamId) {
    return this.db('players')
      .where({ current_team_id: teamId, is_active: true })
      .orderBy('last_name');
  }

  async findActive() {
    return this.db('players').where({ is_active: true }).orderBy('last_name');
  }

  async searchByName(lastName) {
    return this.db('players')
      .whereILike('last_name', `%${lastName}%`)
      .orderBy('last_name');
  }
}

module.exports = PlayerRepository;
