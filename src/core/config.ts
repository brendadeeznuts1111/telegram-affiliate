/**
 * Configuration management using Bun.env
 * All configuration is loaded from environment variables
 */

interface Config {
  bot: {
    token: string;
    admins: number[];
  };
  commission: {
    direct: number;
    super: number;
    currency: string;
  };
  database: {
    path: string;
  };
  server: {
    port: number;
    webhookPath: string;
    webhookSecret: string;
  };
  logging: {
    level: string;
  };
  env: string;
}

// Validate required environment variables
function validateEnv(): void {
  const required = ['BOT_TOKEN'];
  const missing = required.filter(key => !Bun.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Parse admin IDs from comma-separated string
function parseAdminIds(): number[] {
  const adminIds = Bun.env.ADMIN_IDS || '';
  return adminIds
    .split(',')
    .map(id => parseInt(id.trim(), 10))
    .filter(id => !isNaN(id));
}

// Initialize configuration
validateEnv();

export const config: Config = {
  bot: {
    token: Bun.env.BOT_TOKEN!,
    admins: parseAdminIds(),
  },
  commission: {
    direct: parseFloat(Bun.env.COMMISSION_DIRECT || '10'),
    super: parseFloat(Bun.env.COMMISSION_SUPER || '5'),
    currency: Bun.env.CURRENCY || '$',
  },
  database: {
    path: Bun.env.DATABASE_PATH || './data/affiliate_system.db',
  },
  server: {
    port: parseInt(Bun.env.PORT || '3000', 10),
    webhookPath: Bun.env.WEBHOOK_PATH || '/webhook/payment',
    webhookSecret: Bun.env.WEBHOOK_SECRET || '',
  },
  logging: {
    level: Bun.env.LOG_LEVEL || 'info',
  },
  env: Bun.env.NODE_ENV || 'production',
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

