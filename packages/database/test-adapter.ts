#!/usr/bin/env bun
/**
 * Test script for database adapters
 */

import { createDatabase, createMockDatabase } from './src/index';

console.log('🧪 Testing Database Adapters\n');

// Test 1: Mock Adapter
console.log('Test 1: Mock Adapter');
try {
  const mockDb = createMockDatabase();
  console.log('✅ Mock adapter created');
  console.log('   Type:', mockDb.getType());
  console.log('   Is open:', mockDb.isOpen());
  
  // Test basic operations
  await mockDb.run('INSERT INTO users (name) VALUES (?)', ['Test User']);
  const lastId = await mockDb.getLastInsertId();
  console.log('   Last insert ID:', lastId);
  
  await mockDb.close();
  console.log('✅ Mock adapter closed');
} catch (error) {
  console.log('❌ Failed:', error);
}

// Test 2: SQLite Adapter
console.log('\nTest 2: SQLite Adapter');
try {
  const sqliteDb = createDatabase('sqlite', {
    path: ':memory:',
    debug: false,
  });
  console.log('✅ SQLite adapter created (in-memory)');
  console.log('   Type:', sqliteDb.getType());
  console.log('   Is open:', sqliteDb.isOpen());
  
  // Create test table
  await sqliteDb.run(`
    CREATE TABLE test_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT
    )
  `);
  console.log('✅ Test table created');
  
  // Insert data
  await sqliteDb.run(
    'INSERT INTO test_users (name, email) VALUES (?, ?)',
    ['Alice', 'alice@example.com']
  );
  const lastId = await sqliteDb.getLastInsertId();
  console.log('✅ Data inserted, ID:', lastId);
  
  // Query data
  const users = await sqliteDb.query<{ id: number; name: string; email: string }>(
    'SELECT * FROM test_users'
  );
  console.log('✅ Query result:', users);
  
  // Query one
  const user = await sqliteDb.queryOne<{ id: number; name: string }>(
    'SELECT * FROM test_users WHERE id = ?',
    [lastId]
  );
  console.log('✅ QueryOne result:', user);
  
  // Transaction test
  await sqliteDb.transaction(async () => {
    await sqliteDb.run(
      'INSERT INTO test_users (name, email) VALUES (?, ?)',
      ['Bob', 'bob@example.com']
    );
    await sqliteDb.run(
      'INSERT INTO test_users (name, email) VALUES (?, ?)',
      ['Charlie', 'charlie@example.com']
    );
  });
  console.log('✅ Transaction completed');
  
  // Count users
  const allUsers = await sqliteDb.query<{ id: number; name: string }>(
    'SELECT * FROM test_users'
  );
  console.log('✅ Total users:', allUsers.length);
  
  await sqliteDb.close();
  console.log('✅ SQLite adapter closed');
} catch (error) {
  console.log('❌ Failed:', error);
}

console.log('\n✨ Database adapter tests complete!\n');
