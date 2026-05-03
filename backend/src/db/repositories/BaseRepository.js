'use strict';

/**
 * BaseRepository — repositorio genérico del que heredan todos los demás.
 *
 * Proporciona las operaciones CRUD fundamentales y la lógica de upsert
 * con detección de cambios. Los repositorios hijos solo necesitan implementar
 * la lógica específica de su dominio.
 *
 * Filosofía de upsert:
 * - INSERT ... ON CONFLICT ... DO UPDATE SET actualiza solo los campos que cambiaron.
 * - created_at nunca se sobreescribe — registra la primera vez que se vio el registro.
 * - Si algún campo monitoreado cambió, se escribe una fila en data_changes.
 */

const db = require('../knex');

class BaseRepository {
  /**
   * @param {string}   tableName       - Nombre de la tabla en la BD
   * @param {string[]} conflictColumns - Columnas que definen unicidad para el upsert
   * @param {string[]} watchedFields   - Campos que se auditan en data_changes al cambiar
   */
  constructor(tableName, conflictColumns = ['id'], watchedFields = []) {
    this.tableName = tableName;
    this.conflictColumns = conflictColumns;
    this.watchedFields = watchedFields;
    this.db = db;
  }

  // ─── Lectura ─────────────────────────────────────────────────────────────────

  /**
   * Busca un registro por su PK interna.
   * @param {number} id
   * @returns {Promise<object|undefined>}
   */
  async findById(id) {
    return this.db(this.tableName).where({ id }).first();
  }

  /**
   * Busca todos los registros con filtros opcionales.
   * @param {object} filters  - Condiciones WHERE (igualdad simple)
   * @param {string} orderBy  - Columna de ordenamiento
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<Array>}
   */
  async findAll(filters = {}, orderBy = 'id', limit = 100, offset = 0) {
    return this.db(this.tableName)
      .where(filters)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
  }

  /**
   * Cuenta registros con filtros opcionales.
   * @param {object} filters
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    const result = await this.db(this.tableName)
      .where(filters)
      .count('id as count')
      .first();
    return parseInt(result.count);
  }

  // ─── Escritura ────────────────────────────────────────────────────────────────

  /**
   * Inserta o actualiza un registro.
   * - Si el registro es nuevo: INSERT con created_at y updated_at.
   * - Si ya existe: UPDATE de todos los campos excepto created_at.
   * - Si algún watchedField cambió: escribe una fila en data_changes.
   *
   * @param {object} data          - Datos a insertar o actualizar
   * @param {number} [scrapeLogId] - ID del job de scraping activo (para auditoría)
   * @returns {Promise<object>}    - El registro tal como quedó en la BD
   */
  async upsert(data, scrapeLogId = null) {
    const now = new Date().toISOString();
    const record = { ...data, updated_at: now };

    // Buscar el registro existente para poder comparar campos (auditoría)
    const existing = await this._findByConflictKey(data);

    // Construir la cláusula ON CONFLICT DO UPDATE (compatible con SQLite ≥ 3.24 y PostgreSQL)
    const insertData = existing ? record : { ...record, created_at: now };

    await this.db(this.tableName)
      .insert(insertData)
      .onConflict(this.conflictColumns)
      .merge(this._getMergeColumns(insertData));

    // Recuperar el registro final para devolverlo
    const saved = await this._findByConflictKey(data);

    // Auditar cambios en campos monitoreados
    if (existing && scrapeLogId && this.watchedFields.length > 0) {
      await this._logChanges(scrapeLogId, existing, data, saved.id);
    }

    return saved;
  }

  /**
   * Inserta o actualiza múltiples registros en lotes (batch).
   * Usa transacciones por lote para atomicidad y rendimiento.
   *
   * @param {Array}  rows       - Array de objetos a insertar/actualizar
   * @param {number} batchSize  - Filas por transacción (default 500)
   * @param {number} [scrapeLogId]
   * @returns {Promise<{inserted: number, updated: number, skipped: number}>}
   */
  async bulkUpsert(rows, batchSize = 500, scrapeLogId = null) {
    const counts = { inserted: 0, updated: 0, skipped: 0 };
    if (!rows || rows.length === 0) return counts;

    const now = new Date().toISOString();

    // Dividir en lotes para no sobrecargar la BD con inserciones masivas
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      await this.db.transaction(async (trx) => {
        for (const row of batch) {
          const record = { ...row, updated_at: now };
          const existing = await trx(this.tableName)
            .where(this._buildConflictWhere(row))
            .first();

          if (!existing) {
            // Registro nuevo
            await trx(this.tableName).insert({ ...record, created_at: now });
            counts.inserted++;
          } else {
            // Registro existente: actualizar solo si hay diferencias
            const hasChanges = this._hasChanges(existing, record);
            if (hasChanges) {
              await trx(this.tableName)
                .where({ id: existing.id })
                .update(this._getMergeColumns(record));
              counts.updated++;

              // Auditar cambios si hay campos monitoreados
              if (scrapeLogId && this.watchedFields.length > 0) {
                await this._logChanges(scrapeLogId, existing, record, existing.id);
              }
            } else {
              counts.skipped++;
            }
          }
        }
      });
    }

    return counts;
  }

  /**
   * Elimina un registro por su PK. Usar con precaución.
   * @param {number} id
   */
  async deleteById(id) {
    return this.db(this.tableName).where({ id }).delete();
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────────

  /**
   * Busca un registro usando las columnas de conflicto como condición WHERE.
   * @private
   */
  async _findByConflictKey(data) {
    return this.db(this.tableName)
      .where(this._buildConflictWhere(data))
      .first();
  }

  /**
   * Construye el objeto WHERE con las claves de conflicto extraídas de data.
   * @private
   */
  _buildConflictWhere(data) {
    const where = {};
    for (const col of this.conflictColumns) {
      if (data[col] !== undefined) where[col] = data[col];
    }
    return where;
  }

  /**
   * Devuelve el objeto de datos sin las columnas que NO deben actualizarse
   * (created_at y las claves de conflicto).
   * @private
   */
  _getMergeColumns(data) {
    const exclude = new Set([...this.conflictColumns, 'created_at', 'id']);
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (!exclude.has(key)) result[key] = value;
    }
    return result;
  }

  /**
   * Compara si alguno de los campos de 'newData' difiere del registro existente.
   * Solo compara campos que existen en ambos objetos.
   * @private
   */
  _hasChanges(existing, newData) {
    const skip = new Set([...this.conflictColumns, 'id', 'created_at', 'updated_at']);
    for (const [key, value] of Object.entries(newData)) {
      if (skip.has(key)) continue;
      // Comparación loose: null == undefined, pero '5' != 5
      if (existing[key] != null && String(existing[key]) !== String(value)) return true;
      if (existing[key] == null && value != null) return true;
    }
    return false;
  }

  /**
   * Escribe filas en data_changes para cada campo monitoreado que cambió.
   * @private
   */
  async _logChanges(scrapeLogId, existing, newData, recordId) {
    const now = new Date().toISOString();
    const changes = [];

    for (const field of this.watchedFields) {
      const oldVal = existing[field];
      const newVal = newData[field];

      // Solo registrar si el valor realmente cambió (evitar ruido de null vs undefined)
      if (String(oldVal ?? '') !== String(newVal ?? '') && newVal !== undefined) {
        changes.push({
          scrape_log_id: scrapeLogId,
          table_name: this.tableName,
          record_id: recordId,
          field_name: field,
          old_value: oldVal != null ? String(oldVal) : null,
          new_value: newVal != null ? String(newVal) : null,
          changed_by: 'scraper',
          changed_at: now,
          created_at: now,
        });
      }
    }

    if (changes.length > 0) {
      await this.db('data_changes').insert(changes);
    }
  }
}

module.exports = BaseRepository;
