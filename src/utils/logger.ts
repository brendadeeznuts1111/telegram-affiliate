/**
 * Simple logger utility using Bun-native console
 * Supports different log levels and timestamps
 */

import { config } from '@/core/config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = levels[config.logging.level as LogLevel] || levels.info;

function timestamp(): string {
  return new Date().toISOString();
}

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= currentLevel;
}

export const logger = {
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(`[${timestamp()}] [DEBUG]`, message, ...args);
    }
  },

  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(`[${timestamp()}] [INFO]`, message, ...args);
    }
  },

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(`[${timestamp()}] [WARN]`, message, ...args);
    }
  },

  error(message: string, error?: unknown): void {
    if (shouldLog('error')) {
      console.error(`[${timestamp()}] [ERROR]`, message, error);
    }
  },

  // Special method for debugging data in table format
  table(data: unknown[], properties?: string[]): void {
    if (shouldLog('debug')) {
      Bun.inspect.table(data, properties);
    }
  },
};

