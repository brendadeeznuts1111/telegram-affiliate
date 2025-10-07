/**
 * Centralized Configuration Management
 * Uses Zod for runtime validation of environment variables
 */

import { z } from 'zod';

/**
 * Environment type
 */
const environmentSchema = z.enum(['development', 'staging', 'production']);
export type Environment = z.infer<typeof environmentSchema>;

/**
 * Database configuration schema
 */
const databaseConfigSchema = z.object({
  path: z.string().default('./data/affiliate_system.db'),
  journal_mode: z.enum(['WAL', 'DELETE', 'TRUNCATE', 'PERSIST', 'MEMORY', 'OFF']).default('WAL'),
  foreign_keys: z.boolean().default(true),
});

/**
 * Bot configuration schema
 */
const botConfigSchema = z.object({
  token: z.string().min(1, 'BOT_TOKEN is required'),
  admins: z.array(z.number()).min(1, 'At least one admin ID is required'),
  username: z.string().optional(),
});

/**
 * Commission configuration schema
 */
const commissionConfigSchema = z.object({
  direct: z.number().min(0).max(100).default(5),
  super: z.number().min(0).max(100).default(2),
  currency: z.string().default('USD'),
});

/**
 * API configuration schema
 */
const apiConfigSchema = z.object({
  port: z.number().min(1).max(65535).default(3001),
  host: z.string().default('localhost'),
  corsOrigins: z.array(z.string()).default([
    'http://localhost:5173',
    'http://localhost:5175',
    'http://localhost:3000',
  ]),
  publicUrl: z.string().url().optional(),
});

/**
 * Cloudflare configuration schema
 */
const cloudflareConfigSchema = z.object({
  accountId: z.string().optional(),
  databaseId: z.string().optional(),
  kvNamespaceId: z.string().optional(),
  webhookSecret: z.string().optional(),
});

/**
 * Complete application configuration schema
 */
const configSchema = z.object({
  env: environmentSchema.default('development'),
  database: databaseConfigSchema,
  bot: botConfigSchema,
  commission: commissionConfigSchema,
  api: apiConfigSchema,
  cloudflare: cloudflareConfigSchema,
});

export type AppConfig = z.infer<typeof configSchema>;

/**
 * Parse environment variable as number
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse environment variable as array of numbers
 */
function parseNumberArray(value: string | undefined): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n));
}

/**
 * Parse environment variable as array of strings
 */
function parseStringArray(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Get configuration from environment variables
 * Validates all required variables and fails fast with clear error messages
 * 
 * @param env - Environment variables object (process.env or Cloudflare env)
 * @returns Validated configuration object
 * @throws Error if required variables are missing or invalid
 */
export function getConfig(env: Record<string, string | undefined> = {}): AppConfig {
  // Merge with process.env as fallback
  const envVars = { ...process.env, ...env };

  const rawConfig = {
    env: envVars.NODE_ENV || envVars.ENVIRONMENT || 'development',
    database: {
      path: envVars.DB_PATH || envVars.DATABASE_PATH || './data/affiliate_system.db',
      journal_mode: envVars.DB_JOURNAL_MODE || 'WAL',
      foreign_keys: envVars.DB_FOREIGN_KEYS !== 'false',
    },
    bot: {
      token: envVars.BOT_TOKEN || '',
      admins: parseNumberArray(envVars.ADMIN_IDS),
      username: envVars.BOT_USERNAME,
    },
    commission: {
      direct: parseNumber(envVars.COMMISSION_DIRECT, 5),
      super: parseNumber(envVars.COMMISSION_SUPER, 2),
      currency: envVars.COMMISSION_CURRENCY || 'USD',
    },
    api: {
      port: parseNumber(envVars.PORT || envVars.API_PORT, 3001),
      host: envVars.HOST || envVars.API_HOST || 'localhost',
      corsOrigins: parseStringArray(envVars.CORS_ORIGINS, [
        'http://localhost:5173',
        'http://localhost:5175',
        'http://localhost:3000',
      ]),
      publicUrl: envVars.PUBLIC_URL,
    },
    cloudflare: {
      accountId: envVars.CLOUDFLARE_ACCOUNT_ID,
      databaseId: envVars.CLOUDFLARE_DATABASE_ID,
      kvNamespaceId: envVars.CLOUDFLARE_KV_NAMESPACE_ID,
      webhookSecret: envVars.WEBHOOK_SECRET,
    },
  };

  // Validate configuration
  const result = configSchema.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.errors.map(err => {
      return `  - ${err.path.join('.')}: ${err.message}`;
    });

    throw new Error(
      `❌ Configuration validation failed:\n\n${errors.join('\n')}\n\n` +
      `Please check your environment variables. See env.example for required variables.`
    );
  }

  return result.data;
}

/**
 * Get configuration with optional overrides (useful for testing)
 */
export function getConfigWithOverrides(
  env: Record<string, string | undefined> = {},
  overrides: Partial<AppConfig> = {}
): AppConfig {
  const config = getConfig(env);
  return { ...config, ...overrides };
}

/**
 * Validate that required environment variables are present
 * Returns validation errors without throwing
 */
export function validateConfig(env: Record<string, string | undefined> = {}): {
  valid: boolean;
  errors: string[];
  config?: AppConfig;
} {
  try {
    const config = getConfig(env);
    return {
      valid: true,
      errors: [],
      config,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        valid: false,
        errors: [error.message],
      };
    }
    return {
      valid: false,
      errors: ['Unknown configuration error'],
    };
  }
}

/**
 * Pretty-print configuration (safe for logging - hides secrets)
 */
export function printConfig(config: AppConfig): string {
  const safe = {
    env: config.env,
    database: {
      path: config.database.path,
      journal_mode: config.database.journal_mode,
    },
    bot: {
      token: config.bot.token ? '***' + config.bot.token.slice(-8) : '[NOT SET]',
      admins: config.bot.admins,
      username: config.bot.username || '[NOT SET]',
    },
    commission: config.commission,
    api: {
      ...config.api,
      publicUrl: config.api.publicUrl || '[NOT SET]',
    },
    cloudflare: {
      accountId: config.cloudflare.accountId ? '***' : '[NOT SET]',
      databaseId: config.cloudflare.databaseId ? '***' : '[NOT SET]',
      kvNamespaceId: config.cloudflare.kvNamespaceId ? '***' : '[NOT SET]',
      webhookSecret: config.cloudflare.webhookSecret ? '***' : '[NOT SET]',
    },
  };

  return JSON.stringify(safe, null, 2);
}

// Export schemas for external use
export {
  environmentSchema,
  databaseConfigSchema,
  botConfigSchema,
  commissionConfigSchema,
  apiConfigSchema,
  cloudflareConfigSchema,
  configSchema,
};
