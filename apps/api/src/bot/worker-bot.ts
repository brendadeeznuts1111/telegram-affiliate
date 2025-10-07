/**
 * Worker Bot Instance - Complete Implementation with Phase 1 Features
 * Grammy bot configured for Cloudflare Workers with D1
 * Uses unified database abstraction from @affiliate/database
 */

import { Bot, webhookCallback, Context } from 'grammy';
import { createDatabase, UserRepository, CustomerRepository, CommissionRepository, DepositRepository } from '@affiliate/database/index.workers';
import type { IDatabaseAdapter } from '@affiliate/database/index.workers';

// Type for our custom context with D1 and environment
export interface WorkerContext extends Context {
  env: {
    DB: D1Database;
    AFFILIATE_KV: KVNamespace;
    BOT_TOKEN: string;
    ADMIN_IDS: string;
    PUBLIC_URL?: string;
    TELEGRAM_BOT_USERNAME?: string;
  };
  db: IDatabaseAdapter;
  userRepository: UserRepository;
  customerRepository: CustomerRepository;
  commissionRepository: CommissionRepository;
  depositRepository: DepositRepository;
}

/**
 * Create and configure bot instance for Worker
 */
export async function createWorkerBot(env: WorkerContext['env']): Promise<Bot<WorkerContext>> {
  const bot = new Bot<WorkerContext>(env.BOT_TOKEN);

  // Create D1 database adapter
  const db = await createDatabase('d1', { d1Database: env.DB });

  // Create repository instances
  const userRepository = new UserRepository(db);
  const customerRepository = new CustomerRepository(db);
  const commissionRepository = new CommissionRepository(db);
  const depositRepository = new DepositRepository(db);

  // Attach environment and repositories to context
  bot.use(async (ctx, next) => {
    ctx.env = env;
    ctx.db = db;
    ctx.userRepository = userRepository;
    ctx.customerRepository = customerRepository;
    ctx.commissionRepository = commissionRepository;
    ctx.depositRepository = depositRepository;
    await next();
  });

  // Register all handlers
  registerCommands(bot);
  registerMessages(bot);
  registerCallbacks(bot);

  // Error handler
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  return bot;
}

/**
 * Register all bot commands
 */
function registerCommands(bot: Bot<WorkerContext>) {
  // Import handlers lazily to avoid circular dependencies
  const handlers = {
    start: async (ctx: WorkerContext) => {
      const { startHandler } = await import('./handlers/start.handler');
      return startHandler(ctx);
    },
    
    // Dashboard
    dashboard: async (ctx: WorkerContext) => {
      const { dashboardHandler } = await import('./handlers/dashboard.handler');
      return dashboardHandler(ctx);
    },
    
    // Customer management
    addcustomer: async (ctx: WorkerContext) => {
      const { addCustomerHandler } = await import('./handlers/customer.handler');
      return addCustomerHandler(ctx);
    },
    customers: async (ctx: WorkerContext) => {
      const { listCustomersHandler } = await import('./handlers/customer.handler');
      return listCustomersHandler(ctx);
    },
    
    // Deposit management
    deposit: async (ctx: WorkerContext) => {
      const { depositHandler } = await import('./handlers/deposit.handler');
      return depositHandler(ctx);
    },
    deposits: async (ctx: WorkerContext) => {
      const { listDepositsHandler } = await import('./handlers/deposit.handler');
      return listDepositsHandler(ctx);
    },
    
    // Commission tracking
    commissions: async (ctx: WorkerContext) => {
      const { commissionsHandler } = await import('./handlers/commission.handler');
      return commissionsHandler(ctx);
    },
    pending: async (ctx: WorkerContext) => {
      const { pendingCommissionsHandler } = await import('./handlers/commission.handler');
      return pendingCommissionsHandler(ctx);
    },
    paid: async (ctx: WorkerContext) => {
      const { paidCommissionsHandler } = await import('./handlers/commission.handler');
      return paidCommissionsHandler(ctx);
    },
    
    // QR code
    qr: async (ctx: WorkerContext) => {
      const { qrHandler } = await import('./handlers/qr.handler');
      return qrHandler(ctx);
    },
    
    // Withdrawal (admin)
    withdraw: async (ctx: WorkerContext) => {
      const { withdrawHandler } = await import('./handlers/withdraw.handler');
      return withdrawHandler(ctx);
    },
    
    // Super agent panel
    super: async (ctx: WorkerContext) => {
      const { superHandler } = await import('./handlers/super.handler');
      return superHandler(ctx);
    },
  };

  // Register all commands
  bot.command('start', handlers.start);
  bot.command('dashboard', handlers.dashboard);
  bot.command('addcustomer', handlers.addcustomer);
  bot.command('customers', handlers.customers);
  bot.command('deposit', handlers.deposit);
  bot.command('deposits', handlers.deposits);
  bot.command('commissions', handlers.commissions);
  bot.command('pending', handlers.pending);
  bot.command('paid', handlers.paid);
  bot.command('qr', handlers.qr);
  bot.command('withdraw', handlers.withdraw);
  bot.command('super', handlers.super);

  console.log('✅ Registered 12 bot commands');
}

/**
 * Register message handlers for conversation flows
 */
function registerMessages(bot: Bot<WorkerContext>) {
  // Handle text messages for conversation flows
  bot.on('message:text', async (ctx) => {
    // Skip if it's a command
    if (ctx.message.text?.startsWith('/')) return;

    // Try customer flow handler
    const { handleCustomerFlow } = await import('./handlers/customer.handler');
    const customerHandled = await handleCustomerFlow(ctx);
    if (customerHandled) return;

    // Try deposit flow handler
    const { handleDepositFlow } = await import('./handlers/deposit.handler');
    const depositHandled = await handleDepositFlow(ctx);
    if (depositHandled) return;

    // If no flow handled it, just log
    console.log('Unhandled text message:', ctx.message.text);
  });
}

/**
 * Register callback query handlers
 */
function registerCallbacks(bot: Bot<WorkerContext>) {
  bot.on('callback_query:data', async (ctx) => {
    const { callbackHandler } = await import('./handlers/callback.handler');
    return callbackHandler(ctx);
  });

  console.log('✅ Registered callback handler');
}

/**
 * Get webhook callback for Hono integration
 */
export function getWebhookHandler(bot: Bot<WorkerContext>) {
  return webhookCallback(bot, 'hono');
}