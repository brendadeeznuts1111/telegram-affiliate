#!/usr/bin/env bun
/**
 * SQLite to D1 Migration Script
 * Exports data from local SQLite database to SQL file for D1 import
 */

import { Database } from 'bun:sqlite';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SQLITE_PATH = resolve(import.meta.dir, '../data/affiliate_system.db');
const OUTPUT_PATH = resolve(import.meta.dir, '../data/d1-migration.sql');

console.log('🔄 Starting SQLite to D1 migration...\n');

try {
  // Open SQLite database
  const db = new Database(SQLITE_PATH, { readonly: true });
  console.log(`✅ Opened SQLite database: ${SQLITE_PATH}`);

  const sqlStatements: string[] = [];

  // Add header comment
  sqlStatements.push('-- SQLite to D1 Migration');
  sqlStatements.push('-- Generated: ' + new Date().toISOString());
  sqlStatements.push('');

  // Disable foreign key checks during migration
  sqlStatements.push('PRAGMA foreign_keys = OFF;');
  sqlStatements.push('');

  // Export Users
  console.log('📤 Exporting users...');
  const users = db.query('SELECT * FROM users').all() as any[];
  console.log(`   Found ${users.length} users`);

  for (const user of users) {
    const values = [
      user.id,
      user.telegram_id,
      user.username ? `'${user.username.replace(/'/g, "''")}'` : 'NULL',
      user.first_name ? `'${user.first_name.replace(/'/g, "''")}'` : 'NULL',
      user.last_name ? `'${user.last_name.replace(/'/g, "''")}'` : 'NULL',
      user.parent_agent_id || 'NULL',
      user.is_super_agent ? 1 : 0,
      user.total_customers || 0,
      user.net_deposited || 0,
      user.created_at ? `'${user.created_at}'` : `'${new Date().toISOString()}'`,
    ].join(', ');

    sqlStatements.push(
      `INSERT INTO users (id, telegram_id, username, first_name, last_name, parent_agent_id, is_super_agent, total_customers, net_deposited, created_at) VALUES (${values});`
    );
  }
  sqlStatements.push('');

  // Export Agents
  console.log('📤 Exporting agents...');
  const agents = db.query('SELECT * FROM agents').all() as any[];
  console.log(`   Found ${agents.length} agents`);

  for (const agent of agents) {
    const values = [
      agent.id,
      agent.user_id,
      `'${agent.level || 'agent'}'`,
      agent.total_commission || 0,
      agent.total_customers || 0,
      agent.active_customers || 0,
      agent.created_at ? `'${agent.created_at}'` : `'${new Date().toISOString()}'`,
    ].join(', ');

    sqlStatements.push(
      `INSERT INTO agents (id, user_id, level, total_commission, total_customers, active_customers, created_at) VALUES (${values});`
    );
  }
  sqlStatements.push('');

  // Export Commissions
  console.log('📤 Exporting commissions...');
  const commissions = db.query('SELECT * FROM commissions').all() as any[];
  console.log(`   Found ${commissions.length} commissions`);

  for (const commission of commissions) {
    const values = [
      commission.id,
      commission.agent_id,
      commission.customer_id || 'NULL',
      `'${commission.event_type}'`,
      commission.amount,
      commission.level || 1,
      commission.is_paid ? 1 : 0,
      commission.created_at ? `'${commission.created_at}'` : `'${new Date().toISOString()}'`,
    ].join(', ');

    sqlStatements.push(
      `INSERT INTO commissions (id, agent_id, customer_id, event_type, amount, level, is_paid, created_at) VALUES (${values});`
    );
  }
  sqlStatements.push('');

  // Export Customers
  console.log('📤 Exporting customers...');
  const customers = db.query('SELECT * FROM customers').all() as any[];
  console.log(`   Found ${customers.length} customers`);

  for (const customer of customers) {
    const values = [
      customer.id,
      customer.agent_id,
      customer.telegram_id,
      customer.username ? `'${customer.username.replace(/'/g, "''")}'` : 'NULL',
      customer.net_deposit || 0,
      customer.deposit_count || 0,
      customer.first_deposit_at ? `'${customer.first_deposit_at}'` : 'NULL',
      customer.created_at ? `'${customer.created_at}'` : `'${new Date().toISOString()}'`,
    ].join(', ');

    sqlStatements.push(
      `INSERT INTO customers (id, agent_id, telegram_id, username, net_deposit, deposit_count, first_deposit_at, created_at) VALUES (${values});`
    );
  }
  sqlStatements.push('');

  // Export Agent Hierarchy
  console.log('📤 Exporting agent hierarchy...');
  const hierarchy = db.query('SELECT * FROM agent_hierarchy').all() as any[];
  console.log(`   Found ${hierarchy.length} hierarchy records`);

  for (const hier of hierarchy) {
    const values = [hier.id, hier.agent_id, hier.ancestor_id, hier.depth].join(', ');

    sqlStatements.push(
      `INSERT INTO agent_hierarchy (id, agent_id, ancestor_id, depth) VALUES (${values});`
    );
  }
  sqlStatements.push('');

  // Re-enable foreign key checks
  sqlStatements.push('PRAGMA foreign_keys = ON;');

  // Write to file
  const sqlContent = sqlStatements.join('\n');
  writeFileSync(OUTPUT_PATH, sqlContent, 'utf-8');

  console.log(`\n✅ Migration SQL file created: ${OUTPUT_PATH}`);
  console.log(`📊 Total statements: ${sqlStatements.length}`);
  console.log(`📦 File size: ${(sqlContent.length / 1024).toFixed(2)} KB`);

  // Summary
  console.log('\n📊 Migration Summary:');
  console.log(`   Users: ${users.length}`);
  console.log(`   Agents: ${agents.length}`);
  console.log(`   Commissions: ${commissions.length}`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Hierarchy: ${hierarchy.length}`);

  console.log('\n🚀 Next Steps:');
  console.log('   1. Review the generated SQL file');
  console.log('   2. Run: cd apps/api');
  console.log('   3. Run: bunx wrangler d1 execute affiliate-system --remote --file=../../data/d1-migration.sql');

  db.close();
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}

