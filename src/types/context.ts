/**
 * Grammy Bot Context Type
 * Extended context with session data
 */

import type { Context } from 'grammy';

export interface SessionData {
  expecting_customer?: boolean;
  [key: string]: unknown;
}

export interface BotContext extends Context {
  session: SessionData;
}

