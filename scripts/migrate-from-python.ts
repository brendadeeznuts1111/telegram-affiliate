#!/usr/bin/env bun
/**
 * Migration Script from Python SQLite to Bun SQLite
 * Copies data from the old affiliate_system.db to the new one
 */

import { Database } from 'bun:sqlite';
import { db } from '../src/core/database';
import { logger } from '../src/utils/logger';
import { existsSync } from 'node:fs';

const PYTHON_DB_PATH = './affiliate_system.db';

async function migrate() {
  logger.info('🔄 Starting migration from Python database...');

  // Check if Python database exists
  if (!existsSync(PYTHON_DB_PATH)) {
    logger.error(`Python database not found at: ${PYTHON_DB_PATH}`);
    logger.info('Make sure the old affiliate_system.db file is in the project root');
    process.exit(1);
  }

  try {
    // Open Python database (read-only)
    const pythonDb = new Database(PYTHON_DB_PATH, { readonly: true });

    // Migrate Users
    logger.info('📋 Migrating users...');
    const users = pythonDb.query('SELECT * FROM users').all() as any[];
    
    for (const user of users) {
      db.run(
        `INSERT OR REPLACE INTO users 
         (user_id, username, first_name, last_name, is_agent, is_super_agent, 
          parent_agent_id, created_at, total_commission, total_customers)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.user_id,
          user.username,
          user.first_name,
          user.last_name,
          user.is_agent ? 1 : 0,
          user.is_super_agent ? 1 : 0,
          user.parent_agent_id,
          user.created_at || Math.floor(Date.now() / 1000),
          user.total_commission || 0,
          user.total_customers || 0,
        ]
      );
    }
    logger.info(`✅ Migrated ${users.length} users`);

    // Migrate Customers
    logger.info('📋 Migrating customers...');
    const customers = pythonDb.query('SELECT * FROM customers').all() as any[];
    
    for (const customer of customers) {
      db.run(
        `INSERT OR REPLACE INTO customers 
         (customer_id, user_id, customer_name, customer_phone, customer_email, 
          referred_by, created_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customer.customer_id,
          customer.user_id,
          customer.customer_name,
          customer.customer_phone,
          customer.customer_email,
          customer.referred_by,
          customer.created_at || Math.floor(Date.now() / 1000),
          customer.status || 'active',
        ]
      );
    }
    logger.info(`✅ Migrated ${customers.length} customers`);

    // Migrate Commissions
    logger.info('📋 Migrating commissions...');
    const commissions = pythonDb.query('SELECT * FROM commissions').all() as any[];
    
    for (const commission of commissions) {
      db.run(
        `INSERT OR REPLACE INTO commissions 
         (commission_id, agent_id, customer_id, amount, percentage, created_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          commission.commission_id,
          commission.agent_id,
          commission.customer_id,
          commission.amount,
          commission.percentage || 10,
          commission.created_at || Math.floor(Date.now() / 1000),
          commission.status || 'pending',
        ]
      );
    }
    logger.info(`✅ Migrated ${commissions.length} commissions`);

    pythonDb.close();

    // Verify migration
    logger.info('\n📊 Verifying migration...');
    const newUserCount = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const newCustomerCount = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM customers');
    const newCommissionCount = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM commissions');

    logger.info(`Users: ${users.length} → ${newUserCount?.count || 0}`);
    logger.info(`Customers: ${customers.length} → ${newCustomerCount?.count || 0}`);
    logger.info(`Commissions: ${commissions.length} → ${newCommissionCount?.count || 0}`);

    if (
      users.length === newUserCount?.count &&
      customers.length === newCustomerCount?.count &&
      commissions.length === newCommissionCount?.count
    ) {
      logger.info('\n✨ Migration completed successfully!');
      logger.info('🎉 All data transferred without loss');
    } else {
      logger.warn('\n⚠️  Migration completed with discrepancies');
      logger.warn('Please verify the data manually');
    }

  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();

