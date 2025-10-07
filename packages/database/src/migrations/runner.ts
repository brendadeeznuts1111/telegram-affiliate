/**
 * Migration Runner
 * Manages database schema migrations
 */

import type { IDatabaseAdapter, Migration, IMigrationRunner } from '../interface';
import { DatabaseError } from '@affiliate/errors';

export class MigrationRunner implements IMigrationRunner {
  constructor(private db: IDatabaseAdapter) {}

  /**
   * Initialize migrations table
   */
  private async initMigrationsTable(): Promise<void> {
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      )
    `);
  }

  /**
   * Get current migration version
   */
  async getCurrentVersion(): Promise<number> {
    await this.initMigrationsTable();

    const result = await this.db.queryOne<{ version: number }>(
      'SELECT MAX(version) as version FROM migrations'
    );

    return result?.version || 0;
  }

  /**
   * Check if migration has been applied
   */
  private async isMigrationApplied(version: number): Promise<boolean> {
    await this.initMigrationsTable();

    const result = await this.db.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM migrations WHERE version = ?',
      [version]
    );

    return (result?.count || 0) > 0;
  }

  /**
   * Record migration as applied
   */
  private async recordMigration(migration: Migration): Promise<void> {
    await this.db.run(
      'INSERT INTO migrations (version, name, applied_at) VALUES (?, ?, ?)',
      [migration.version, migration.name, Date.now()]
    );
  }

  /**
   * Remove migration record
   */
  private async removeMigration(version: number): Promise<void> {
    await this.db.run(
      'DELETE FROM migrations WHERE version = ?',
      [version]
    );
  }

  /**
   * Run pending migrations
   */
  async runMigrations(migrations: Migration[]): Promise<void> {
    // Sort migrations by version
    const sortedMigrations = [...migrations].sort((a, b) => a.version - b.version);

    const currentVersion = await this.getCurrentVersion();
    console.log(`Current migration version: ${currentVersion}`);

    for (const migration of sortedMigrations) {
      // Skip if already applied
      if (await this.isMigrationApplied(migration.version)) {
        console.log(`Migration ${migration.version} (${migration.name}) already applied, skipping`);
        continue;
      }

      console.log(`Running migration ${migration.version}: ${migration.name}`);

      try {
        // Run migration in a transaction
        await this.db.transaction(async () => {
          // Split SQL by semicolon and run each statement
          const statements = migration.up
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

          for (const statement of statements) {
            await this.db.run(statement);
          }

          // Record migration
          await this.recordMigration(migration);
        });

        console.log(`✓ Migration ${migration.version} completed successfully`);
      } catch (error) {
        console.error(`✗ Migration ${migration.version} failed:`, error);
        throw new DatabaseError(
          `Migration ${migration.version} failed: ${String(error)}`,
          { migration: migration.name, error: String(error) }
        );
      }
    }

    const newVersion = await this.getCurrentVersion();
    console.log(`All migrations complete. Current version: ${newVersion}`);
  }

  /**
   * Rollback to a specific version
   */
  async rollback(toVersion: number): Promise<void> {
    const currentVersion = await this.getCurrentVersion();

    if (toVersion >= currentVersion) {
      throw new DatabaseError(
        `Cannot rollback to version ${toVersion} (current version is ${currentVersion})`
      );
    }

    console.log(`Rolling back from version ${currentVersion} to ${toVersion}`);

    // Get migrations to rollback (in reverse order)
    const migrations = await this.db.query<{ version: number; name: string }>(
      'SELECT version, name FROM migrations WHERE version > ? ORDER BY version DESC',
      [toVersion]
    );

    for (const migration of migrations) {
      console.log(`Rolling back migration ${migration.version}: ${migration.name}`);

      try {
        // Note: We don't have the down migration SQL here
        // This would need to be loaded from the migration definition
        console.warn(`Warning: Down migrations not implemented. Removing migration record only.`);

        // Remove migration record
        await this.removeMigration(migration.version);

        console.log(`✓ Migration ${migration.version} rolled back`);
      } catch (error) {
        console.error(`✗ Rollback of migration ${migration.version} failed:`, error);
        throw new DatabaseError(
          `Rollback of migration ${migration.version} failed: ${String(error)}`,
          { migration: migration.name, error: String(error) }
        );
      }
    }

    const newVersion = await this.getCurrentVersion();
    console.log(`Rollback complete. Current version: ${newVersion}`);
  }
}
