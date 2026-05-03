'use strict';

/**
 * Migración 010 — Tabla: scrape_logs
 *
 * Registro de ejecución de cada proceso de scraping.
 * Una fila por ejecución; se actualiza al finalizar con métricas y estado.
 *
 * Estados posibles:
 *   'running'  → el job está en ejecución (no ha terminado)
 *   'success'  → completó sin errores
 *   'partial'  → completó pero con errores en algunos items individuales
 *   'failed'   → falló completamente y no produjo datos útiles
 *
 * El campo metadata (JSON) permite almacenar contexto arbitrario sin
 * necesitar migraciones adicionales cuando se añaden nuevos tipos de scraping.
 */

exports.up = async (knex) => {
  await knex.schema.createTable('scrape_logs', (t) => {
    t.increments('id').primary();

    // Tipo de scraping ejecutado
    // 'scoreboard' | 'boxscore' | 'schedule' | 'player_averages'
    // 'team_stats' | 'standings' | 'full_daily' (job orquestador)
    t.string('scrape_type', 40).notNullable();

    // Estado de la ejecución
    t.string('status', 20).notNullable().defaultTo('running');

    // Quién disparó el job: 'scheduler' | 'manual' | 'api'
    t.string('triggered_by', 20).notNullable().defaultTo('scheduler');

    // Temporada y fecha objetivo del scraping (opcionales para jobs de configuración)
    t.integer('season_id').nullable().references('id').inTable('seasons');
    t.date('target_date').nullable().comment('Fecha de partido procesada, si aplica');

    // ─── Tiempos ──────────────────────────────────────────────────────────────
    t.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('finished_at').nullable().comment('NULL mientras el job está en ejecución');
    // Duración en ms (calculada y guardada al hacer finishRun)
    t.integer('duration_ms').nullable();

    // ─── Contadores de registros procesados ───────────────────────────────────
    t.integer('records_fetched').notNullable().defaultTo(0);
    t.integer('records_inserted').notNullable().defaultTo(0);
    t.integer('records_updated').notNullable().defaultTo(0);
    t.integer('records_skipped').notNullable().defaultTo(0);
    t.integer('error_count').notNullable().defaultTo(0);

    // JSON con contexto adicional del job (ej. lista de gameIds procesados)
    t.text('metadata').nullable();

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.raw('CREATE INDEX idx_sl_scrape_type  ON scrape_logs (scrape_type)');
  await knex.schema.raw('CREATE INDEX idx_sl_status       ON scrape_logs (status)');
  await knex.schema.raw('CREATE INDEX idx_sl_started_at   ON scrape_logs (started_at)');
  await knex.schema.raw('CREATE INDEX idx_sl_target_date  ON scrape_logs (target_date)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('scrape_logs');
};
