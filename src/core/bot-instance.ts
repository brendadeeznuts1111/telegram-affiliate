/**
 * Grammy Bot Instance
 * Singleton bot configuration and initialization
 */

import { Bot } from 'grammy';
import type { BotContext } from '@/types/context';
import { config } from './config';
import { logger } from '@/utils/logger';

// Create bot instance
export const bot = new Bot<BotContext>(config.bot.token);

// Simple session middleware (in-memory for now)
const sessions = new Map<number, any>();

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (userId) {
    if (!sessions.has(userId)) {
      sessions.set(userId, {});
    }
    ctx.session = sessions.get(userId)!;
  } else {
    ctx.session = {};
  }
  await next();
});

// Error handler
bot.catch((err) => {
  logger.error('Bot error:', err);
});

logger.info('Bot instance created');

