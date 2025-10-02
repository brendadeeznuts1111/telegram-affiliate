#!/usr/bin/env bun
/**
 * Health Check Script
 * Verifies bot and database are operational
 */

import { db } from '../src/core/database';
import { config } from '../src/core/config';
import { logger } from '../src/utils/logger';

let exitCode = 0;

try {
  // Check database connection
  logger.info('🔍 Checking database...');
  const result = db.queryOne<{ value: number }>('SELECT 1 as value');
  
  if (result?.value === 1) {
    logger.info('✅ Database: OK');
  } else {
    throw new Error('Database check failed');
  }
  
  // Check configuration
  logger.info('🔍 Checking configuration...');
  if (!config.bot.token) {
    throw new Error('BOT_TOKEN not configured');
  }
  logger.info('✅ Configuration: OK');
  
  // Check table counts
  const userCount = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
  const customerCount = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM customers');
  const commissionCount = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM commissions');
  
  logger.info(`\n📊 Database Statistics:`);
  logger.info(`   Users: ${userCount?.count || 0}`);
  logger.info(`   Customers: ${customerCount?.count || 0}`);
  logger.info(`   Commissions: ${commissionCount?.count || 0}`);
  
  logger.info('\n✨ Health check passed!');
  
} catch (error) {
  logger.error('❌ Health check failed:', error);
  exitCode = 1;
}

process.exit(exitCode);

