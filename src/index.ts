#!/usr/bin/env bun
/**
 * Main Entry Point
 * Telegram Affiliate Bot - Bun Native Edition
 */

import { bot } from './core/bot-instance';
import { createConversation } from '@grammyjs/conversations';
import { logger } from './utils/logger';
import { config } from './core/config';
import { db } from './core/database';

// Import handlers
import { startHandler } from './api/handlers/start.handler';
import { callbackHandler } from './api/handlers/callback.handler';
import { messageHandler } from './api/handlers/message.handler';
import {
  adminMiddleware,
  statsHandler,
  topAgentsHandler,
  makeSuperHandler,
  payHandler,
  broadcastHandler,
  setCommissionHandler,
  customerPaidHandler,
} from './api/handlers/admin.handler';
import {
  levelHandler,
  treeHandler,
  enhancedStatsHandler,
  leaderboardHandler,
  projectionsHandler,
} from './api/handlers/level.handler';
import {
  adminMenuHandler,
  adminMenuCallbackHandler,
} from './api/handlers/admin-menu.handler';
import {
  dashboardHandler,
  withdrawHandler,
  superHandler,
  qrHandler,
} from './api/handlers/affiliate.handler';
import {
  addCustomerHandler,
  addCustomerConversation,
  listCustomersHandler,
  customerCallbackHandler,
} from './api/handlers/customer.handler';
import {
  depositHandler,
  depositConversation,
  listDepositsHandler,
  depositCallbackHandler,
} from './api/handlers/deposit.handler';
import {
  commissionsHandler,
  pendingCommissionsHandler,
  paidCommissionsHandler,
  commissionCallbackHandler,
} from './api/handlers/commission.handler';

// Register conversations
bot.use(createConversation(addCustomerConversation));
bot.use(createConversation(depositConversation));

// Register command handlers
bot.command('start', startHandler);

// Affiliate commands
bot.command('dashboard', dashboardHandler);
bot.command('withdraw', withdrawHandler);
bot.command('super', superHandler);
bot.command('qr', qrHandler);

// Customer commands
bot.command('addcustomer', addCustomerHandler);
bot.command('customers', listCustomersHandler);

// Deposit commands
bot.command('deposit', depositHandler);
bot.command('deposits', listDepositsHandler);

// Commission commands
bot.command('commissions', commissionsHandler);
bot.command('pending', pendingCommissionsHandler);
bot.command('paid', paidCommissionsHandler);

// Level system commands (available to all agents)
bot.command('level', levelHandler);
bot.command('tree', treeHandler);
bot.command('stats', enhancedStatsHandler);
bot.command('leaderboard', leaderboardHandler);
bot.command('projections', projectionsHandler);

// Agent commands
bot.command('customerpaid', customerPaidHandler);

// Register admin commands (with admin middleware)
const adminBot = bot.filter(ctx => {
  const userId = ctx.from?.id;
  return userId ? config.bot.admins.includes(userId) : false;
});

adminBot.command('admin', adminMenuHandler);
adminBot.command('adminstats', statsHandler);
adminBot.command('topagents', topAgentsHandler);
adminBot.command('makesuper', makeSuperHandler);
adminBot.command('pay', payHandler);
adminBot.command('broadcast', broadcastHandler);
adminBot.command('setcommission', setCommissionHandler);

// Admin menu callbacks
bot.on('callback_query:data', async (ctx, next) => {
  const data = ctx.callbackQuery?.data;
  if (data?.startsWith('admin_')) {
    await adminMenuCallbackHandler(ctx);
  } else {
    await next();
  }
});

// Customer callbacks
bot.on('callback_query:data', async (ctx, next) => {
  const data = ctx.callbackQuery?.data;
  if (data === 'add_customer' || data === 'view_customers' || data === 'refresh_customers' ||
      data === 'confirm_customer' || data === 'cancel_customer') {
    await customerCallbackHandler(ctx);
  } else {
    await next();
  }
});

// Deposit callbacks
bot.on('callback_query:data', async (ctx, next) => {
  const data = ctx.callbackQuery?.data;
  if (data === 'record_deposit' || data === 'refresh_deposits' ||
      data === 'confirm_deposit' || data === 'cancel_deposit' || data?.startsWith('select_customer_')) {
    await depositCallbackHandler(ctx);
  } else {
    await next();
  }
});

// Commission callbacks
bot.on('callback_query:data', async (ctx, next) => {
  const data = ctx.callbackQuery?.data;
  if (data?.startsWith('comm_') || data === 'view_commissions') {
    await commissionCallbackHandler(ctx);
  } else {
    await next();
  }
});

// Register callback query handler (button clicks)
bot.on('callback_query:data', callbackHandler);

// Register message handler (text messages)
bot.on('message:text', messageHandler);

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down bot...');
  await bot.stop();
  db.close();
  logger.info('Bot stopped gracefully');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  shutdown();
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
});

// Start bot
async function main() {
  try {
    logger.info('🚀 Starting Telegram Affiliate Bot...');
    logger.info(`Environment: ${config.env}`);
    logger.info(`Database: ${config.database.path}`);
    logger.info(`Admin IDs: ${config.bot.admins.join(', ')}`);
    logger.info(`Commission: Direct ${config.commission.direct}%, Super ${config.commission.super}%`);

    // Start polling
    await bot.start({
      onStart: (botInfo) => {
        logger.info(`✅ Bot started successfully as @${botInfo.username}`);
        logger.info(`Bot ID: ${botInfo.id}`);
        logger.info('Listening for messages...');
      },
    });

  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.main) {
  main();
}

export { bot };

