/**
 * SQLite Database Adapter
 * Wraps bun:sqlite with async interface
 * 
 * ⚠️ This module is ONLY for Bun runtime - NOT for Cloudflare Workers!
 * For Workers, use D1Adapter instead.
 */

import type { IDatabaseAdapter, DatabaseConfig, QueryResult, TransactionFn } from '../interface';
import { DatabaseError } from '@affiliate/errors';

// Dynamic import to prevent bundlers from including bun:sqlite
// This will only work in Bun runtime, not in Workers
let Database: any;
try {
  if (typeof Bun !== 'undefined') {
    Database = require('bun:sqlite').Database;
  }
} catch (e) {
  // Ignore - this adapter won't work in Workers anyway
}

export class SqliteAdapter implements IDatabaseAdapter {
  private db: Database;
  private _isOpen: boolean = false;
  private lastInsertIdValue: number = 0;
  private debug: boolean;

  constructor(config: DatabaseConfig) {
    if (!config.path) {
      throw new DatabaseError('SQLite path is required');
    }

    try {
      this.db = new Database(config.path);
      this._isOpen = true;
      this.debug = config.debug || false;

      // Configure SQLite
      if (config.journalMode) {
        this.db.run(`PRAGMA journal_mode = ${config.journalMode}`);
      }

      if (config.foreignKeys !== false) {
        this.db.run('PRAGMA foreign_keys = ON');
      }

      if (this.debug) {
        console.log(`[SQLite] Connected to database: ${config.path}`);
      }
    } catch (error) {
      throw new DatabaseError(
        'Failed to initialize SQLite database',
        { path: config.path, error: String(error) }
      );
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
        console.log('[SQLite Query]', sql, params);
      }

      const stmt = this.db.prepare(sql);
      const rows = stmt.all(params) as T[];
      
      return rows;
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
        console.log('[SQLite QueryOne]', sql, params);
      }

      const stmt = this.db.prepare(sql);
      const row = stmt.get(params) as T | undefined;
      
      return row || null;
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
        console.log('[SQLite Run]', sql, params);
      }

      const stmt = this.db.prepare(sql);
      stmt.run(params);

      // Store last insert ID for INSERT operations
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const result = this.db.query('SELECT last_insert_rowid() as id').get() as { id: number };
        this.lastInsertIdValue = result.id;
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
        console.log('[SQLite Execute]', sql, params);
      }

      const stmt = this.db.prepare(sql);
      
      // For SELECT queries
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = stmt.all(params) as T[];
        return {
          rows,
          rowCount: rows.length,
        };
      }

      // For INSERT/UPDATE/DELETE
      stmt.run(params);
      
      // Get last insert ID for INSERT
      let lastInsertId: number | undefined;
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        const result = this.db.query('SELECT last_insert_rowid() as id').get() as { id: number };
        lastInsertId = result.id;
        this.lastInsertIdValue = lastInsertId;
      }

      // Get affected rows count
      const changes = this.db.query('SELECT changes() as count').get() as { count: number };

      return {
        rows: [],
        rowCount: changes.count,
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
   */
  async transaction<T>(fn: TransactionFn<T>): Promise<T> {
    if (!this._isOpen) {
      throw new DatabaseError('Database connection is closed');
    }

    try {
      if (this.debug) {
        console.log('[SQLite] Starting transaction');
      }

      // Wrap the async function in Bun's transaction
      const txn = this.db.transaction(async () => {
        return await fn();
      });

      const result = txn();

      if (this.debug) {
        console.log('[SQLite] Transaction committed');
      }

      return result;
    } catch (error) {
      if (this.debug) {
        console.log('[SQLite] Transaction rolled back');
      }
      throw new DatabaseError(
        'Transaction failed',
        { error: String(error) }
      );
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this._isOpen) {
      this.db.close();
      this._isOpen = false;
      
      if (this.debug) {
        console.log('[SQLite] Database connection closed');
      }
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
    return 'sqlite';
  }

  /**
   * Get raw database instance (use sparingly)
   */
  getRawDb(): Database {
    return this.db;
  }
}
