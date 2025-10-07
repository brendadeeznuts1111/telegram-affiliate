/**
 * Database Adapter Interface
 * Unified interface for SQLite and Cloudflare D1
 */

/**
 * Query result with metadata
 */
export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
  lastInsertId?: number;
}

/**
 * Transaction function type
 */
export type TransactionFn<T> = () => Promise<T>;

/**
 * Database adapter interface
 * All database operations must go through this interface
 */
export interface IDatabaseAdapter {
  /**
   * Execute a query and return all rows
   * @param sql SQL query string
   * @param params Query parameters
   * @returns Array of rows
   */
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;

  /**
   * Execute a query and return the first row
   * @param sql SQL query string
   * @param params Query parameters
   * @returns First row or null
   */
  queryOne<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;

  /**
   * Execute a query without returning results
   * @param sql SQL query string
   * @param params Query parameters
   */
  run(sql: string, params?: unknown[]): Promise<void>;

  /**
   * Execute a query and return result metadata
   * @param sql SQL query string
   * @param params Query parameters
   * @returns Query result with metadata
   */
  execute<T = unknown>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;

  /**
   * Get the ID of the last inserted row
   * @returns Last insert ID
   */
  getLastInsertId(): Promise<number>;

  /**
   * Execute multiple queries in a transaction
   * @param fn Transaction function
   * @returns Transaction result
   */
  transaction<T>(fn: TransactionFn<T>): Promise<T>;

  /**
   * Close the database connection
   */
  close(): Promise<void>;

  /**
   * Check if the database connection is open
   */
  isOpen(): boolean;

  /**
   * Get database adapter type
   */
  getType(): 'sqlite' | 'd1' | 'mock';
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  /**
   * SQLite: path to database file
   */
  path?: string;

  /**
   * D1: Cloudflare D1 database instance
   */
  d1Database?: D1Database;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * SQLite: journal mode
   */
  journalMode?: 'WAL' | 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'OFF';

  /**
   * SQLite: enable foreign keys
   */
  foreignKeys?: boolean;
}

/**
 * Migration definition
 */
export interface Migration {
  /**
   * Migration version/ID
   */
  version: number;

  /**
   * Migration name
   */
  name: string;

  /**
   * SQL to run for upgrade
   */
  up: string;

  /**
   * SQL to run for downgrade (optional)
   */
  down?: string;
}

/**
 * Migration runner interface
 */
export interface IMigrationRunner {
  /**
   * Run pending migrations
   */
  runMigrations(migrations: Migration[]): Promise<void>;

  /**
   * Get current migration version
   */
  getCurrentVersion(): Promise<number>;

  /**
   * Rollback to a specific version
   */
  rollback(toVersion: number): Promise<void>;
}
