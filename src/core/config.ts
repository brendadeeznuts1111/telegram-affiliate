/**
 * Bot Configuration - Now using shared config package
 * Migrated to @affiliate/config for centralized, validated configuration
 */

import { getConfig, type AppConfig } from '@affiliate/config';

// Get validated configuration
const appConfig = getConfig(Bun.env);

// Export config in the old format for backward compatibility
export const config = {
  bot: appConfig.bot,
  commission: appConfig.commission,
  database: appConfig.database,
  server: {
    port: appConfig.api.port,
    webhookPath: '/webhook/payment',
    webhookSecret: appConfig.cloudflare.webhookSecret || '',
  },
  logging: {
    level: Bun.env.LOG_LEVEL || 'info',
  },
  env: appConfig.env,
};

// Freeze configuration to prevent modifications
Object.freeze(config);
Object.freeze(config.bot);
Object.freeze(config.commission);
Object.freeze(config.database);
Object.freeze(config.server);
Object.freeze(config.logging);

// Export helper functions
export function isAdmin(userId: number): boolean {
  return config.bot.admins.includes(userId);
}

export function isDevelopment(): boolean {
  return config.env === 'development';
}

export function isProduction(): boolean {
  return config.env === 'production';
}

