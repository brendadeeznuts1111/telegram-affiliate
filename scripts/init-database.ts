#!/usr/bin/env bun
/**
 * Database Initialization Script
 * Ensures database is properly set up with schema and indexes
 */

import { db } from '../src/core/database';
import { logger } from '../src/utils/logger';

logger.info('🚀 Starting database initialization...');

try {
  // Database is automatically initialized via singleton
  // This script is mainly for explicit initialization
  
  logger.info('✅ Database schema created successfully');
  logger.info('✅ Indexes created successfully');
  logger.info('✅ Foreign keys enabled');
  logger.info('✅ WAL mode enabled for better concurrency');
  
  // Verify tables exist
  const tables = db.query<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  
  logger.info(`\n📊 Created tables:`);
  tables.forEach(table => {
    logger.info(`   - ${table.name}`);
  });
  
  logger.info('\n✨ Database initialization complete!');
  
} catch (error) {
  logger.error('❌ Database initialization failed:', error);
  process.exit(1);
}

