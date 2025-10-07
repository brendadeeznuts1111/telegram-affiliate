/**
 * Bot Database Instance
 * Initializes the database adapter for the bot using the new abstraction layer
 */

import { createDatabaseFromEnv } from '@affiliate/database';
import { getConfig } from '@affiliate/config';
import { logger } from '@/utils/logger';

// Get configuration
const config = getConfig(Bun.env);

// Create database adapter
export const db = createDatabaseFromEnv({
  DATABASE_PATH: config.database.path,
  ENVIRONMENT: config.env,
});

// Initialize repositories (they will be exported from here for the bot)
import {
  UserRepository,
  CustomerRepository,
  CommissionRepository,
  DepositRepository,
} from '@affiliate/database';

// Create repository instances
export const userRepository = new UserRepository(db);
export const customerRepository = new CustomerRepository(db);
export const commissionRepository = new CommissionRepository(db);
export const depositRepository = new DepositRepository(db);

logger.info('✅ Bot database and repositories initialized');
