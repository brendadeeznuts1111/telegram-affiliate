/**
 * Grammy Bot Context Type
 * Extended context with session data and conversations
 */

import type { Context } from 'grammy';
import type { ConversationFlavor } from '@grammyjs/conversations';

export interface SessionData {
  expecting_customer?: boolean;
  [key: string]: unknown;
}

export interface BotContext extends Context, ConversationFlavor {
  session: SessionData;
}

