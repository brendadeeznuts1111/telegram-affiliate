/**
 * Base Repository
 * Common functionality for all repositories
 */

import type { IDatabaseAdapter } from '../interface';

export abstract class BaseRepository {
  constructor(protected db: IDatabaseAdapter) {}

  /**
   * Find a single record by ID
   */
  protected async findById<T>(
    table: string,
    idColumn: string,
    id: number | string
  ): Promise<T | null> {
    return this.db.queryOne<T>(
      `SELECT * FROM ${table} WHERE ${idColumn} = ?`,
      [id]
    );
  }

  /**
   * Find all records in a table
   */
  protected async findAll<T>(
    table: string,
    orderBy?: string,
    limit?: number
  ): Promise<T[]> {
    let sql = `SELECT * FROM ${table}`;
    
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }
    
    if (limit) {
      sql += ` LIMIT ${limit}`;
    }
    
    return this.db.query<T>(sql);
  }

  /**
   * Find records with a WHERE clause
   */
  protected async findWhere<T>(
    table: string,
    where: string,
    params: unknown[]
  ): Promise<T[]> {
    return this.db.query<T>(
      `SELECT * FROM ${table} WHERE ${where}`,
      params
    );
  }

  /**
   * Find one record with a WHERE clause
   */
  protected async findOneWhere<T>(
    table: string,
    where: string,
    params: unknown[]
  ): Promise<T | null> {
    return this.db.queryOne<T>(
      `SELECT * FROM ${table} WHERE ${where}`,
      params
    );
  }

  /**
   * Count records
   */
  protected async count(
    table: string,
    where?: string,
    params?: unknown[]
  ): Promise<number> {
    const sql = where
      ? `SELECT COUNT(*) as count FROM ${table} WHERE ${where}`
      : `SELECT COUNT(*) as count FROM ${table}`;
    
    const result = await this.db.queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  /**
   * Check if a record exists
   */
  protected async exists(
    table: string,
    where: string,
    params: unknown[]
  ): Promise<boolean> {
    const count = await this.count(table, where, params);
    return count > 0;
  }

  /**
   * Insert a record
   */
  protected async insert(
    table: string,
    data: Record<string, unknown>
  ): Promise<number> {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    await this.db.run(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    return this.db.getLastInsertId();
  }

  /**
   * Update a record
   */
  protected async update(
    table: string,
    idColumn: string,
    id: number | string,
    data: Record<string, unknown>
  ): Promise<void> {
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = [...Object.values(data), id];

    await this.db.run(
      `UPDATE ${table} SET ${setClause} WHERE ${idColumn} = ?`,
      values
    );
  }

  /**
   * Delete a record
   */
  protected async delete(
    table: string,
    idColumn: string,
    id: number | string
  ): Promise<void> {
    await this.db.run(
      `DELETE FROM ${table} WHERE ${idColumn} = ?`,
      [id]
    );
  }

  /**
   * Execute a transaction
   */
  protected async transaction<T>(fn: () => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }
}
