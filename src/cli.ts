#!/usr/bin/env bun
/**
 * CLI Tool for Affiliate Bot Management
 * Usage: bun run cli.ts <command> [options]
 */

import { userRepository } from './repositories/user.repository';
import { customerRepository } from './repositories/customer.repository';
import { commissionService } from './services/commission.service';
import { commissionRepository } from './repositories/commission.repository';
import { logger } from './utils/logger';
import { config } from './core/config';

const args = process.argv.slice(2);
const command = args[0];
const subcommand = args[1];

async function main() {
  if (!command) {
    showHelp();
    process.exit(0);
  }

  switch (command) {
    case 'admin':
      await handleAdmin(subcommand);
      break;

    case 'help':
      showHelp();
      break;

    default:
      logger.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

async function handleAdmin(subcommand: string) {
  switch (subcommand) {
    case 'stats':
      await showStats();
      break;

    case 'top-agents': {
      const limit = parseInt(getFlag('--limit') || '10', 10);
      await showTopAgents(limit);
      break;
    }

    case 'make-super-agent': {
      const userId = parseInt(getFlag('--user-id') || '0', 10);
      if (!userId) {
        logger.error('Missing --user-id flag');
        process.exit(1);
      }
      await makeSuperAgent(userId);
      break;
    }

    case 'agent-details': {
      const userId = parseInt(getFlag('--user-id') || '0', 10);
      if (!userId) {
        logger.error('Missing --user-id flag');
        process.exit(1);
      }
      await showAgentDetails(userId);
      break;
    }

    default:
      logger.error(`Unknown admin command: ${subcommand}`);
      showHelp();
      process.exit(1);
  }
}

function getFlag(flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index === -1 || index === args.length - 1) {
    return undefined;
  }
  return args[index + 1];
}

async function showStats() {
  logger.info('📊 System Statistics\n');

  const totalUsers = userRepository.getTotalCount();
  const totalAgents = userRepository.getTotalAgentCount();
  const totalCustomers = customerRepository.getTotalCount();
  const commissionStats = commissionRepository.getOverallStats();

  console.log(`👥 Total Users:     ${totalUsers}`);
  console.log(`🤝 Total Agents:    ${totalAgents}`);
  console.log(`👨‍👩‍👧‍👦 Total Customers:  ${totalCustomers}\n`);
  console.log(`💰 Commissions:`);
  console.log(`   ✅ Paid:    ${config.commission.currency}${commissionStats.total_paid.toFixed(2)} (${commissionStats.count_paid})`);
  console.log(`   ⏳ Pending: ${config.commission.currency}${commissionStats.total_pending.toFixed(2)} (${commissionStats.count_pending})\n`);
  
  if (totalAgents > 0) {
    console.log(`📈 Avg Customers/Agent: ${(totalCustomers / totalAgents).toFixed(2)}`);
  }
}

async function showTopAgents(limit: number) {
  logger.info(`🏆 Top ${limit} Agents\n`);

  const topAgents = userRepository.getTopAgents(limit);

  if (topAgents.length === 0) {
    console.log('No agents found.');
    return;
  }

  topAgents.forEach((agent, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    console.log(`${medal} ${agent.first_name}${agent.username ? ` (@${agent.username})` : ''}`);
    console.log(`   ID: ${agent.user_id}`);
    console.log(`   👥 ${agent.customer_count} customers`);
    console.log(`   💰 ${config.commission.currency}${agent.commission_total.toFixed(2)} earned\n`);
  });
}

async function makeSuperAgent(userId: number) {
  const user = userRepository.getById(userId);

  if (!user) {
    logger.error(`User ${userId} not found`);
    process.exit(1);
  }

  if (user.is_super_agent) {
    logger.info(`User ${userId} is already a super agent`);
    return;
  }

  userRepository.makeSuperAgent(userId);
  logger.info(`✅ User ${userId} (${user.first_name}) promoted to Super Agent`);
}

async function showAgentDetails(userId: number) {
  const user = userRepository.getById(userId);

  if (!user) {
    logger.error(`User ${userId} not found`);
    process.exit(1);
  }

  logger.info(`👤 Agent Details: ${user.first_name}\n`);

  console.log(`ID:         ${user.user_id}`);
  console.log(`Username:   ${user.username || 'N/A'}`);
  console.log(`Status:     ${user.is_super_agent ? '⭐ Super Agent' : '🤝 Agent'}`);
  console.log(`Parent:     ${user.parent_agent_id || 'None'}\n`);

  const stats = userRepository.getAgentStats(userId);
  console.log(`📊 Statistics:`);
  console.log(`   👥 Customers:    ${stats.customers}`);
  console.log(`   🤝 Sub-Agents:   ${stats.sub_agents}`);
  console.log(`   💰 Commission:   ${config.commission.currency}${stats.commission.toFixed(2)}\n`);

  const customers = customerRepository.getByAgent(userId);
  if (customers.length > 0) {
    console.log(`Recent Customers (${Math.min(5, customers.length)}):`);
    customers.slice(0, 5).forEach((customer) => {
      console.log(`   • ${customer.customer_name} (${customer.customer_email})`);
    });
  }
}

function showHelp() {
  console.log(`
Telegram Affiliate Bot CLI

Usage: bun run cli.ts <command> [options]

Commands:
  admin stats                                    Show system statistics
  admin top-agents [--limit N]                   Show top N agents (default: 10)
  admin make-super-agent --user-id <id>          Promote agent to super agent
  admin agent-details --user-id <id>             Show agent details and statistics
  help                                           Show this help message

Examples:
  bun run cli.ts admin stats
  bun run cli.ts admin top-agents --limit 20
  bun run cli.ts admin make-super-agent --user-id 123456789
  bun run cli.ts admin agent-details --user-id 123456789
`);
}

// Run CLI
main();

