/**
 * Bun SQLite Database Wrapper
 * 100% Bun-native using bun:sqlite
 */

import { Database } from 'bun:sqlite';
import { config } from '@/core/config';
import { logger } from '@/utils/logger';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export class AffiliateDatabase {
  private db: Database;
  private static instance: AffiliateDatabase;

  private constructor() {
    // Ensure data directory exists
    const dbDir = dirname(config.database.path);
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    // Open database
    this.db = new Database(config.database.path);
    
    // Enable WAL mode for better concurrency
    this.db.run('PRAGMA journal_mode = WAL');
    this.db.run('PRAGMA foreign_keys = ON');
    
    logger.info(`Database initialized at: ${config.database.path}`);
    
    // Initialize schema
    this.initSchema();
  }

  public static getInstance(): AffiliateDatabase {
    if (!AffiliateDatabase.instance) {
      AffiliateDatabase.instance = new AffiliateDatabase();
    }
    return AffiliateDatabase.instance;
  }

  private initSchema(): void {
    logger.info('Initializing database schema...');

    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT,
        is_agent INTEGER DEFAULT 0,
        is_super_agent INTEGER DEFAULT 0,
        parent_agent_id INTEGER,
        created_at INTEGER DEFAULT (unixepoch()),
        total_commission REAL DEFAULT 0,
        total_customers INTEGER DEFAULT 0,
        FOREIGN KEY (parent_agent_id) REFERENCES users(user_id)
      )
    `);

    // Customers table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        referred_by INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        status TEXT DEFAULT 'active',
        FOREIGN KEY (referred_by) REFERENCES users(user_id)
      )
    `);

    // Commissions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS commissions (
        commission_id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id INTEGER NOT NULL,
        customer_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        percentage REAL NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (agent_id) REFERENCES users(user_id),
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
      )
    `);

    // Create indexes for better query performance
    this.db.run('CREATE INDEX IF NOT EXISTS idx_users_agent ON users(is_agent) WHERE is_agent = 1');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_agent_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_customers_referred ON customers(referred_by)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status)');

    logger.info('Database schema initialized successfully');
  }

  // Query methods
  public query<T = unknown>(sql: string, params?: unknown[]): T[] {
    try {
      const stmt = this.db.prepare(sql);
      return stmt.all(params) as T[];
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  }

  public queryOne<T = unknown>(sql: string, params?: unknown[]): T | null {
    try {
      const stmt = this.db.prepare(sql);
      return (stmt.get(params) as T) || null;
    } catch (error) {
      logger.error('Database queryOne error:', error);
      throw error;
    }
  }

  public run(sql: string, params?: unknown[]): void {
    try {
      const stmt = this.db.prepare(sql);
      stmt.run(params);
    } catch (error) {
      logger.error('Database run error:', error);
      throw error;
    }
  }

  public prepare(sql: string) {
    return this.db.prepare(sql);
  }

  // Transaction support
  public transaction<T>(fn: () => T): T {
    const txn = this.db.transaction(fn);
    return txn();
  }

  // Get last inserted row ID
  public getLastInsertId(): number {
    const result = this.db.query('SELECT last_insert_rowid() as id').get() as { id: number };
    return result.id;
  }

  // Close database connection
  public close(): void {
    this.db.close();
    logger.info('Database connection closed');
  }

  // Get raw database instance (use sparingly)
  public getRawDb(): Database {
    return this.db;
  }
}

// Export singleton instance
export const db = AffiliateDatabase.getInstance();

