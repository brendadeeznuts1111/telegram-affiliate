/**
 * Mock Database Adapter
 * In-memory adapter for testing
 */

import type { IDatabaseAdapter, DatabaseConfig, QueryResult, TransactionFn } from '../interface';
import { DatabaseError } from '@affiliate/errors';

interface MockTable {
  [key: string]: Record<string, unknown>[];
}

export class MockAdapter implements IDatabaseAdapter {
  private tables: MockTable = {};
  private _isOpen: boolean = true;
  private lastInsertIdValue: number = 0;
  private debug: boolean;
  private idCounters: Map<string, number> = new Map();

  constructor(config: DatabaseConfig = {}) {
    this.debug = config.debug || false;
    
    if (this.debug) {
      console.log('[Mock] Adapter initialized');
    }
  }

  /**
   * Execute query and return all rows
   */
  async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    if (!this._isOpen) {
      throw new DatabaseError('Database connection is closed');
    }

    if (this.debug) {
      console.log('[Mock Query]', sql, params);
    }

    // Simple mock implementation - just return empty array
    // In a real implementation, you'd parse SQL and query mock data
    return [];
  }

  /**
   * Execute query and return first row
   */
  async queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null> {
    if (!this._isOpen) {
      throw new DatabaseError('Database connection is closed');
    }

    if (this.debug) {
      console.log('[Mock QueryOne]', sql, params);
    }

    const rows = await this.query<T>(sql, params);
    return rows[0] || null;
  }

  /**
   * Execute query without returning results
   */
  async run(sql: string, params?: unknown[]): Promise<void> {
    if (!this._isOpen) {
      throw new DatabaseError('Database connection is closed');
    }

    if (this.debug) {
      console.log('[Mock Run]', sql, params);
    }

    // Simple mock - just track insert IDs
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      this.lastInsertIdValue++;
    }
  }

  /**
   * Execute query and return result metadata
   */
  async execute<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
    if (!this._isOpen) {
      throw new DatabaseError('Database connection is closed');
    }

    if (this.debug) {
      console.log('[Mock Execute]', sql, params);
    }

    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await this.query<T>(sql, params);
      return {
        rows,
        rowCount: rows.length,
      };
    }

    // For INSERT/UPDATE/DELETE
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      this.lastInsertIdValue++;
      return {
        rows: [],
        rowCount: 1,
        lastInsertId: this.lastInsertIdValue,
      };
    }

    return {
      rows: [],
      rowCount: 1,
    };
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

    if (this.debug) {
      console.log('[Mock] Starting transaction');
    }

    try {
      const result = await fn();
      
      if (this.debug) {
        console.log('[Mock] Transaction committed');
      }
      
      return result;
    } catch (error) {
      if (this.debug) {
        console.log('[Mock] Transaction rolled back');
      }
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    this._isOpen = false;
    
    if (this.debug) {
      console.log('[Mock] Adapter closed');
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
    return 'mock';
  }

  /**
   * Add mock data to a table (for testing)
   */
  setMockData(tableName: string, data: Record<string, unknown>[]): void {
    this.tables[tableName] = data;
  }

  /**
   * Get mock data from a table (for testing)
   */
  getMockData(tableName: string): Record<string, unknown>[] {
    return this.tables[tableName] || [];
  }

  /**
   * Clear all mock data
   */
  clearMockData(): void {
    this.tables = {};
    this.lastInsertIdValue = 0;
    this.idCounters.clear();
  }
}
