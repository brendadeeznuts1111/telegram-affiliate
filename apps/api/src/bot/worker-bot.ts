/**
 * Worker Bot Instance
 * Grammy bot configured for Cloudflare Workers with D1
 */

import { Bot, webhookCallback, Context } from 'grammy';

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
}

/**
 * Create and configure bot instance for Worker
 */
export function createWorkerBot(env: WorkerContext['env']): Bot<WorkerContext> {
  const bot = new Bot<WorkerContext>(env.BOT_TOKEN);

  // Attach environment to context
  bot.use(async (ctx, next) => {
    ctx.env = env;
    await next();
  });

  // Import and register handlers
  registerCommands(bot);
  registerCallbacks(bot);

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
    dashboard: async (ctx: WorkerContext) => {
      const { dashboardHandler } = await import('./handlers/dashboard.handler');
      return dashboardHandler(ctx);
    },
    qr: async (ctx: WorkerContext) => {
      const { qrHandler } = await import('./handlers/qr.handler');
      return qrHandler(ctx);
    },
    withdraw: async (ctx: WorkerContext) => {
      const { withdrawHandler } = await import('./handlers/withdraw.handler');
      return withdrawHandler(ctx);
    },
    super: async (ctx: WorkerContext) => {
      const { superHandler } = await import('./handlers/super.handler');
      return superHandler(ctx);
    },
  };

  bot.command('start', handlers.start);
  bot.command('dashboard', handlers.dashboard);
  bot.command('qr', handlers.qr);
  bot.command('withdraw', handlers.withdraw);
  bot.command('super', handlers.super);
}

/**
 * Register callback query handlers
 */
function registerCallbacks(bot: Bot<WorkerContext>) {
  bot.on('callback_query:data', async (ctx) => {
    await ctx.answerCallbackQuery();

    const data = ctx.callbackQuery?.data;
    if (!data) return;

    const { callbackHandler } = await import('./handlers/callback.handler');
    return callbackHandler(ctx);
  });
}

/**
 * Get webhook callback for Hono integration
 */
export function getWebhookHandler(bot: Bot<WorkerContext>) {
  return webhookCallback(bot, 'hono');
}

