# @affiliate/database

Unified database abstraction layer for the Telegram Affiliate Bot system. Provides a single interface for SQLite (local), Cloudflare D1 (production), and in-memory mocking.

## Features

- ✅ **Database Abstraction** - Single interface for SQLite, D1, and Mock databases
- ✅ **Repository Pattern** - Clean data access layer with BaseRepository
- ✅ **Type Safety** - Full TypeScript support with proper types
- ✅ **Async/Await** - Modern async API throughout
- ✅ **Transaction Support** - Database transactions for data consistency
- ✅ **Migration Runner** - Automatic database migration execution
- ✅ **Environment Detection** - Automatic adapter selection based on environment

## Installation

This is a workspace package, installed automatically with the monorepo.

```bash
bun install
```

## Quick Start

### Basic Usage

```typescript
import { createDatabaseFromEnv, userRepository } from '@affiliate/database';
import { getConfig } from '@affiliate/config';

// Create database adapter (auto-detects environment)
const config = getConfig(process.env);
const db = createDatabaseFromEnv(config);

// Use repositories
const user = await userRepository.getById(userId);
const users = await userRepository.getAll();
```

### Explicit Adapter Creation

```typescript
import { createDatabase } from '@affiliate/database';

// SQLite (local development)
const db = createDatabase({
  type: 'sqlite',
  path: './data/affiliate_system.db',
});

// Cloudflare D1 (production)
const db = createDatabase({
  type: 'd1',
  database: env.DB, // D1Database from Cloudflare Workers
});

// Mock (testing)
const db = createMockDatabase();
```

## Database Adapters

### SQLite Adapter

For local development with Bun's native SQLite.

```typescript
import { SqliteAdapter } from '@affiliate/database';

const db = new SqliteAdapter({
  path: './data/affiliate_system.db',
  journal_mode: 'WAL',
  foreign_keys: true,
});

// Use the adapter
const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### D1 Adapter

For Cloudflare Workers with D1 database.

```typescript
import { D1Adapter } from '@affiliate/database';

const db = new D1Adapter(env.DB); // env.DB from Cloudflare Workers

// Use the adapter
const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### Mock Adapter

For testing with in-memory database.

```typescript
import { MockAdapter } from '@affiliate/database';

const db = new MockAdapter();

// Seed test data
await db.execute(`
  INSERT INTO users (user_id, username, first_name)
  VALUES (?, ?, ?)
`, [123, 'testuser', 'Test']);
```

## Repositories

All repositories extend `BaseRepository` and provide async methods.

### User Repository

```typescript
import { UserRepository } from '@affiliate/database';

const userRepo = new UserRepository(db);

// Create user
const user = await userRepo.create({
  user_id: 123456789,
  username: 'john_doe',
  first_name: 'John',
  last_name: 'Doe',
});

// Get user
const user = await userRepo.getById(123456789);

// Make agent
await userRepo.makeAgent(userId, parentAgentId);

// Make super agent
await userRepo.makeSuperAgent(userId);

// Get agent stats
const stats = await userRepo.getAgentStats(userId);

// Get agent tree
const tree = await userRepo.getAgentTree(userId);
```

### Customer Repository

```typescript
import { CustomerRepository } from '@affiliate/database';

const customerRepo = new CustomerRepository(db);

// Create customer
const customer = await customerRepo.create({
  customer_name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1234567890',
  agent_id: 123,
});

// Get customers by agent
const customers = await customerRepo.getByAgent(agentId);

// Search customers
const results = await customerRepo.search('jane');

// Get recent customers
const recent = await customerRepo.getRecent(7); // last 7 days
```

### Commission Repository

```typescript
import { CommissionRepository } from '@affiliate/database';

const commissionRepo = new CommissionRepository(db);

// Create commission
const commission = await commissionRepo.create(
  agentId,
  customerId,
  amount,
  percentage
);

// Get commissions by agent
const commissions = await commissionRepo.getByAgent(agentId);

// Get pending commissions
const pending = await commissionRepo.getPendingByAgent(agentId);

// Mark commissions as paid
const count = await commissionRepo.markAsPaid(agentId, 5);

// Get statistics
const stats = await commissionRepo.getStatsByAgent(agentId);
```

### Deposit Repository

```typescript
import { DepositRepository } from '@affiliate/database';

const depositRepo = new DepositRepository(db);

// Create deposit
const deposit = await depositRepo.create(
  agentId,
  customerId,
  amount,
  'USD'
);

// Get deposits by agent
const deposits = await depositRepo.getByAgent(agentId);

// Get total deposits
const total = await depositRepo.getTotalByAgent(agentId);

// Check first deposit
const isFirst = await depositRepo.hasFirstDeposit(customerId);
```

## Database Interface (IDatabaseAdapter)

All adapters implement this interface:

```typescript
interface IDatabaseAdapter {
  // Query execution
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
  
  // Single statement execution
  execute(sql: string, params?: any[]): Promise<QueryResult>;
  
  // Batch execution
  batch(statements: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]>;
  
  // Transactions
  transaction<T>(fn: TransactionFn<T>): Promise<T>;
  
  // Connection management
  close(): Promise<void>;
}
```

## BaseRepository

All repositories extend this class:

```typescript
class BaseRepository<T> {
  constructor(protected db: IDatabaseAdapter, protected tableName: string);
  
  // CRUD operations
  async getById(id: number): Promise<T | null>;
  async getAll(): Promise<T[]>;
  async create(data: Partial<T>): Promise<T>;
  async update(id: number, data: Partial<T>): Promise<T>;
  async delete(id: number): Promise<void>;
  
  // Bulk operations
  async deleteAll(): Promise<void>;
  async count(): Promise<number>;
}
```

## Migrations

### Running Migrations

```typescript
import { MigrationRunner } from '@affiliate/database';

const runner = new MigrationRunner(db, './migrations');

// Run all pending migrations
await runner.runMigrations();

// Get migration status
const status = await runner.getMigrationStatus();
```

### Migration Files

Place migration files in `src/db/migrations/`:

```
migrations/
  001_initial.sql
  002_add_levels.sql
  003_add_indexes.sql
```

Example migration:

```sql
-- 001_initial.sql
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY,
  username TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  is_agent INTEGER DEFAULT 0,
  is_super_agent INTEGER DEFAULT 0,
  parent_agent_id INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (parent_agent_id) REFERENCES users(user_id)
);

CREATE INDEX idx_users_agent ON users(is_agent);
CREATE INDEX idx_users_parent ON users(parent_agent_id);
```

## Factory Functions

### createDatabase

```typescript
import { createDatabase } from '@affiliate/database';

const db = createDatabase({
  type: 'sqlite',
  path: './data/db.sqlite',
});
```

### createDatabaseFromEnv

```typescript
import { createDatabaseFromEnv } from '@affiliate/database';
import { getConfig } from '@affiliate/config';

const config = getConfig(process.env);
const db = createDatabaseFromEnv(config);
```

### createMockDatabase

```typescript
import { createMockDatabase } from '@affiliate/database';

const db = createMockDatabase();
// In-memory database for testing
```

## Benefits

### Before (Duplicate Repositories)

```typescript
// src/repositories/user.repository.ts (SQLite)
// apps/api/src/bot/repositories/user.repository.d1.ts (D1)
// Duplicate code, inconsistent APIs
```

### After (Unified Abstraction)

```typescript
import { userRepository } from '@affiliate/database';

// Same code works for SQLite and D1
const user = await userRepository.getById(userId);
```

## Environment Detection

The factory automatically detects the environment:

```typescript
// Local Development (Bun)
const db = createDatabaseFromEnv(config);
// → SqliteAdapter

// Cloudflare Workers
const db = createDatabaseFromEnv(config);
// → D1Adapter (if config.cloudflare.databaseId exists)

// Testing
const db = createMockDatabase();
// → MockAdapter
```

## TypeScript Types

```typescript
// Database configuration
interface DatabaseConfig {
  type: 'sqlite' | 'd1' | 'mock';
  path?: string;
  database?: D1Database;
  journal_mode?: 'WAL' | 'DELETE' | ...;
  foreign_keys?: boolean;
}

// Query result
interface QueryResult<T = any> {
  results: T[];
  rowsAffected?: number;
  lastInsertRowid?: number;
}

// Transaction function
type TransactionFn<T> = (db: IDatabaseAdapter) => Promise<T>;
```

## Testing

```typescript
import { createMockDatabase } from '@affiliate/database';
import { UserRepository } from '@affiliate/database';

describe('UserRepository', () => {
  let db: IDatabaseAdapter;
  let userRepo: UserRepository;

  beforeEach(async () => {
    db = createMockDatabase();
    userRepo = new UserRepository(db);
    
    // Run migrations
    await runMigrations(db);
  });

  test('creates user', async () => {
    const user = await userRepo.create({
      user_id: 123,
      username: 'test',
      first_name: 'Test',
    });
    
    expect(user.user_id).toBe(123);
  });
});
```

## Performance

- **SQLite**: Uses Bun's native `bun:sqlite` for maximum performance
- **D1**: Leverages Cloudflare's edge database
- **Transactions**: Automatic batching for better performance
- **Indexes**: Proper indexing on all foreign keys

## Related Packages

- `@affiliate/config` - Configuration management
- `@affiliate/schemas` - Zod validation schemas
- `@affiliate/errors` - Custom error classes

## License

MIT
