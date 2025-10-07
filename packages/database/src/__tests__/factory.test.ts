/**
 * Database Factory Tests
 * Tests the database factory functions
 */

import { describe, test, expect } from 'bun:test';
import { createDatabase, createMockDatabase } from '../factory';

describe('Database Factory', () => {
  describe('createMockDatabase', () => {
    test('should create a mock database', () => {
      const db = createMockDatabase();

      expect(db).toBeDefined();
      expect(typeof db.query).toBe('function');
      expect(typeof db.execute).toBe('function');
    });

    test('should execute queries', async () => {
      const db = createMockDatabase();

      await db.execute(`
        CREATE TABLE IF NOT EXISTS test_table (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      await db.execute(
        'INSERT INTO test_table (id, name) VALUES (?, ?)',
        [1, 'Test']
      );

      const result = await db.query('SELECT * FROM test_table WHERE id = ?', [1]);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Test');
    });
  });

  describe('createDatabase', () => {
    test('should create a sqlite database', () => {
      const db = createDatabase({
        type: 'sqlite',
        path: ':memory:',
      });

      expect(db).toBeDefined();
      expect(typeof db.query).toBe('function');
    });

    test('should create a mock database when type is mock', () => {
      const db = createDatabase({
        type: 'mock',
      });

      expect(db).toBeDefined();
      expect(typeof db.query).toBe('function');
    });
  });
});
