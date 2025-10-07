/**
 * Cloudflare D1 Database Adapter
 * Wraps D1 API with unified interface
 */

import type { IDatabaseAdapter, DatabaseConfig, QueryResult, TransactionFn } from '../interface';
import { DatabaseError } from '@affiliate/errors';

export class D1Adapter implements IDatabaseAdapter {
  private db: D1Database;
  private _isOpen: boolean = true;
  private lastInsertIdValue: number = 0;
  private debug: boolean;

  constructor(config: DatabaseConfig) {
    if (!config.d1Database) {
      throw new DatabaseError('D1 database instance is required');
    }

    this.db = config.d1Database;
    this.debug = config.debug || false;

    if (this.debug) {
      console.log('[D1] Adapter initialized');
    }
  }

  /**
   * Execute query and return all rows
   */
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    if (!this._isOpen) {
      throw new DatabaseError('Database connection is closed');
    }

    try {
      if (this.debug) {
        console.log('[D1 Query]', sql, params);
      }

      const stmt = this.db.prepare(sql);
      const bound = params ? stmt.bind(...params) : stmt;
      const result = await bound.all<T>();

      if (!result.success) {
        throw new Error('D1 query failed');
      }

      return result.results || [];
    } catch (error) {
      throw new DatabaseError(
        'Query failed',
        { sql, params, error: String(error) }
      );
    }
  }

  /**
   * Execute query and return first row
   */
  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    if (!this._isOpen) {
      throw new DatabaseError('Database connection is closed');
    }

    try {
      if (this.debug) {
        console.log('[D1 QueryOne]', sql, params);
      }

      const stmt = this.db.prepare(sql);
      const bound = params ? stmt.bind(...params) : stmt;
      const result = await bound.first<T>();

      return result || null;
    } catch (error) {
      throw new DatabaseError(
        'Query failed',
        { sql, params, error: String(error) }
      );
    }
  }

  /**
   * Execute query without returning results
   */
  async run(sql: string, params?: unknown[]): Promise<void> {
    if (!this._isOpen) {
      throw new DatabaseError('Database connection is closed');
    }

    try {
      if (this.debug) {
        console.log('[D1 Run]', sql, params);
      }

      const stmt = this.db.prepare(sql);
      const bound = params ? stmt.bind(...params) : stmt;
      const result = await bound.run();

      if (!result.success) {
        throw new Error('D1 run failed');
      }

      // Store last insert ID for INSERT operations
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        // D1 doesn't directly return last_insert_rowid, we need to query it
        // Use RETURNING clause or query separately
        if (result.meta && result.meta.last_row_id !== undefined) {
          this.lastInsertIdValue = result.meta.last_row_id;
        }
      }
    } catch (error) {
      throw new DatabaseError(
        'Execute failed',
        { sql, params, error: String(error) }
      );
    }
  }

  /**
   * Execute query and return result metadata
   */
  async execute<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
    if (!this._isOpen) {
      throw new DatabaseError('Database connection is closed');
    }

    try {
      if (this.debug) {
        console.log('[D1 Execute]', sql, params);
      }

      const stmt = this.db.prepare(sql);
      const bound = params ? stmt.bind(...params) : stmt;

      // For SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const result = await bound.all<T>();
        
        if (!result.success) {
          throw new Error('D1 execute failed');
        }

        return {
          rows: result.results || [],
          rowCount: result.results?.length || 0,
        };
      }

      // For INSERT/UPDATE/DELETE
      const result = await bound.run();

      if (!result.success) {
        throw new Error('D1 execute failed');
      }

      // Get last insert ID for INSERT
      let lastInsertId: number | undefined;
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        if (result.meta && result.meta.last_row_id !== undefined) {
          lastInsertId = result.meta.last_row_id;
          this.lastInsertIdValue = lastInsertId;
        }
      }

      return {
        rows: [],
        rowCount: result.meta?.changes || 0,
        lastInsertId,
      };
    } catch (error) {
      throw new DatabaseError(
        'Execute failed',
        { sql, params, error: String(error) }
      );
    }
  }

  /**
   * Get last insert ID
   */
  async getLastInsertId(): Promise<number> {
    return this.lastInsertIdValue;
  }

  /**
   * Execute transaction
   * Note: D1 transactions are more limited than SQLite
   */
  async transaction<T>(fn: TransactionFn<T>): Promise<T> {
    if (!this._isOpen) {
      throw new DatabaseError('Database connection is closed');
    }

    try {
      if (this.debug) {
        console.log('[D1] Starting transaction (batch mode)');
      }

      // D1 uses batch() for transactions
      // We'll execute the function and collect statements
      // For now, just execute the function (D1 transactions are automatic per request)
      const result = await fn();

      if (this.debug) {
        console.log('[D1] Transaction completed');
      }

      return result;
    } catch (error) {
      if (this.debug) {
        console.log('[D1] Transaction failed');
      }
      throw new DatabaseError(
        'Transaction failed',
        { error: String(error) }
      );
    }
  }

  /**
   * Close database connection
   * Note: D1 connections are managed by Cloudflare Workers
   */
  async close(): Promise<void> {
    this._isOpen = false;
    
    if (this.debug) {
      console.log('[D1] Adapter closed (connection managed by Workers)');
    }
  }

  /**
   * Check if database is open
   */
  isOpen(): boolean {
    return this._isOpen;
  }

  /**
   * Get adapter type
   */
  getType(): 'sqlite' | 'd1' | 'mock' {
    return 'd1';
  }

  /**
   * Get raw D1 instance (use sparingly)
   */
  getRawDb(): D1Database {
    return this.db;
  }
}
