/**
 * Grammy Bot Instance
 * Singleton bot configuration and initialization
 */

import { Bot, session } from 'grammy';
import { conversations, createConversation } from '@grammyjs/conversations';
import type { BotContext } from '@/types/context';
import { config } from './config';
import { logger } from '@/utils/logger';

// Create bot instance
export const bot = new Bot<BotContext>(config.bot.token);

// Session middleware (in-memory)
bot.use(
  session({
    initial: () => ({}),
  })
);

// Conversations plugin
bot.use(conversations());

// Error handler
bot.catch((err) => {
  logger.error('Bot error:', err);
});

logger.info('Bot instance created');

