'use strict';

const BaseRepository = require('./BaseRepository');

class ScrapeLogRepository extends BaseRepository {
  constructor() {
    super('scrape_logs', ['id'], []);
  }

  async startRun(scrapeType, triggeredBy = 'scheduler', seasonId = null, targetDate = null) {
    const now = new Date().toISOString();
    const [id] = await this.db('scrape_logs').insert({
      scrape_type: scrapeType,
      status: 'running',
      triggered_by: triggeredBy,
      season_id: seasonId,
      target_date: targetDate,
      started_at: now,
      created_at: now,
      updated_at: now,
    });
    return id;
  }

  async finishRun(id, status, counts = {}, metadata = null) {
    const now = new Date().toISOString();
    const row = await this.db('scrape_logs').where({ id }).first();
    const durationMs = row ? new Date(now) - new Date(row.started_at) : null;

    await this.db('scrape_logs').where({ id }).update({
      status,
      finished_at: now,
      duration_ms: durationMs,
      records_fetched: counts.fetched ?? 0,
      records_inserted: counts.inserted ?? 0,
      records_updated: counts.updated ?? 0,
      records_skipped: counts.skipped ?? 0,
      error_count: counts.errors ?? 0,
      metadata: metadata ? JSON.stringify(metadata) : null,
      updated_at: now,
    });
  }

  async logError(scrapeLogId, scrapeType, errorCode, message, context = null, isRetryable = false, stack = null) {
    const now = new Date().toISOString();
    await this.db('scrape_errors').insert({
      scrape_log_id: scrapeLogId,
      scrape_type: scrapeType,
      error_code: errorCode,
      error_message: message,
      stack_trace: stack,
      context: context ? JSON.stringify(context) : null,
      is_retryable: isRetryable,
      occurred_at: now,
      created_at: now,
    });
    await this.db('scrape_logs').where({ id: scrapeLogId }).increment('error_count', 1);
  }

  // Guard: returns true if a run of the same type is already in progress (within 2h window)
  async isRunning(scrapeType) {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const row = await this.db('scrape_logs')
      .where({ scrape_type: scrapeType, status: 'running' })
      .where('started_at', '>=', twoHoursAgo)
      .first();
    return !!row;
  }

  async getRecent(scrapeType = null, limit = 20) {
    const query = this.db('scrape_logs');
    if (scrapeType) query.where({ scrape_type: scrapeType });
    return query.orderBy('started_at', 'desc').limit(limit);
  }
}

module.exports = ScrapeLogRepository;
