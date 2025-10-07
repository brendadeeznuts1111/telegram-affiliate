/**
 * Database Factory
 * Creates the appropriate database adapter based on configuration
 */

import type { IDatabaseAdapter, DatabaseConfig } from './interface';
import { SqliteAdapter } from './adapters/sqlite';
import { D1Adapter } from './adapters/d1';
import { MockAdapter } from './adapters/mock';
import { DatabaseError } from '@affiliate/errors';

/**
 * Create a database adapter
 * @param type Adapter type ('sqlite', 'd1', or 'mock')
 * @param config Database configuration
 * @returns Database adapter instance
 */
export function createDatabase(
  type: 'sqlite' | 'd1' | 'mock',
  config: DatabaseConfig
): IDatabaseAdapter {
  switch (type) {
    case 'sqlite':
      if (!config.path) {
        throw new DatabaseError('SQLite path is required');
      }
      return new SqliteAdapter(config);

    case 'd1':
      if (!config.d1Database) {
        throw new DatabaseError('D1 database instance is required');
      }
      return new D1Adapter(config);

    case 'mock':
      return new MockAdapter(config);

    default:
      throw new DatabaseError(`Unknown database type: ${type}`);
  }
}

/**
 * Create database from environment
 * Auto-detects the appropriate adapter based on available configuration
 */
export function createDatabaseFromEnv(env: Record<string, string | undefined>): IDatabaseAdapter {
  // Check if D1 database is available (Cloudflare Workers)
  if ('DB' in env && typeof env.DB === 'object') {
    return createDatabase('d1', {
      d1Database: env.DB as unknown as D1Database,
      debug: env.DEBUG === 'true',
    });
  }

  // Fall back to SQLite
  const dbPath = env.DB_PATH || env.DATABASE_PATH || './data/affiliate_system.db';
  return createDatabase('sqlite', {
    path: dbPath,
    journalMode: (env.DB_JOURNAL_MODE as any) || 'WAL',
    foreignKeys: env.DB_FOREIGN_KEYS !== 'false',
    debug: env.DEBUG === 'true',
  });
}

/**
 * Create a mock database for testing
 */
export function createMockDatabase(): IDatabaseAdapter {
  return createDatabase('mock', {});
}
