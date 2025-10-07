/**
 * Cloudflare Workers-specific entry point for @affiliate/database
 * This file excludes Bun-specific modules to avoid bundling issues
 */

export type {
  IDatabaseAdapter,
  DatabaseConfig,
  QueryResult,
  TransactionFn,
  Migration,
  IMigrationRunner,
} from './interface';

// Only export D1 and Mock adapters (no SQLite for Workers)
export { D1Adapter } from './adapters/d1';
export { MockAdapter } from './adapters/mock';

// Export repositories
export * from './repositories';

// Export a simplified factory for Workers
import type { IDatabaseAdapter, DatabaseConfig } from './interface';
import { DatabaseError } from '@affiliate/errors';

/**
 * Create a database adapter (Workers-only version)
 * @param type Adapter type ('d1' or 'mock')
 * @param config Database configuration
 * @returns Database adapter instance
 */
export async function createDatabase(
  type: 'd1' | 'mock',
  config: DatabaseConfig
): Promise<IDatabaseAdapter> {
  switch (type) {
    case 'd1': {
      if (!config.d1Database) {
        throw new DatabaseError('D1 database instance is required');
      }
      const { D1Adapter } = await import('./adapters/d1');
      return new D1Adapter(config);
    }

    case 'mock': {
      const { MockAdapter } = await import('./adapters/mock');
      return new MockAdapter(config);
    }

    default:
      throw new DatabaseError(`Unknown database type for Workers: ${type}`);
  }
}
