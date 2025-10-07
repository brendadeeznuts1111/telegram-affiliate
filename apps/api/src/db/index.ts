/**
 * API Database Instance
 * Initializes database adapter and repositories for API routes
 * Works with both SQLite (local Bun) and D1 (Cloudflare Workers)
 */

import { createDatabaseFromEnv, createDatabase } from '@affiliate/database';
import { 
  UserRepository,
  CustomerRepository,
  CommissionRepository,
  DepositRepository,
  type IDatabaseAdapter
} from '@affiliate/database';
import { getConfig } from '@affiliate/config';

/**
 * Initialize database adapter based on environment
 * For Cloudflare Workers, pass c.env.DB
 * For local Bun, pass process.env
 */
export function initDatabase(env: Record<string, any>): {
  db: IDatabaseAdapter;
  userRepository: UserRepository;
  customerRepository: CustomerRepository;
  commissionRepository: CommissionRepository;
  depositRepository: DepositRepository;
} {
  // Check if we're in Cloudflare Workers (has DB binding)
  const isWorker = typeof env.DB !== 'undefined';
  
  let db: IDatabaseAdapter;
  
  if (isWorker) {
    // Cloudflare Workers - use D1
    db = createDatabase({
      type: 'd1',
      database: env.DB,
    });
  } else {
    // Local Bun - use SQLite
    const config = getConfig(env);
    db = createDatabase({
      type: 'sqlite',
      path: config.database.path,
    });
  }
  
  // Create repository instances
  const userRepository = new UserRepository(db);
  const customerRepository = new CustomerRepository(db);
  const commissionRepository = new CommissionRepository(db);
  const depositRepository = new DepositRepository(db);
  
  return {
    db,
    userRepository,
    customerRepository,
    commissionRepository,
    depositRepository,
  };
}

/**
 * Middleware to inject database and repositories into context
 */
export function databaseMiddleware() {
  return async (c: any, next: any) => {
    const { db, userRepository, customerRepository, commissionRepository, depositRepository } = 
      initDatabase(c.env);
    
    // Inject into context
    c.set('db', db);
    c.set('userRepository', userRepository);
    c.set('customerRepository', customerRepository);
    c.set('commissionRepository', commissionRepository);
    c.set('depositRepository', depositRepository);
    
    await next();
  };
}
