/**
 * Database Package
 * Unified database interface for SQLite and Cloudflare D1
 */

// Export interface
export type {
  IDatabaseAdapter,
  DatabaseConfig,
  QueryResult,
  TransactionFn,
  Migration,
  IMigrationRunner,
} from './interface';

// Export adapters
export { SqliteAdapter } from './adapters/sqlite';
export { D1Adapter } from './adapters/d1';
export { MockAdapter } from './adapters/mock';

// Export factory
export {
  createDatabase,
  createDatabaseFromEnv,
  createMockDatabase,
} from './factory';

// Export migration runner
export { MigrationRunner } from './migrations/runner';
