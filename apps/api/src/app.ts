/**
 * Unified API Application
 * Shared Hono app for both Bun (local) and Cloudflare Workers
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { getConfig } from '@affiliate/config';

// Import routes
import userRoutes from './routes/user';
import agentRoutes from './routes/agent';
import healthRoutes from './routes/health';
// import telegramRoutes from './routes/telegram'; // Temporarily disabled for Workers deployment
import monitoringRoutes from './routes/monitoring';
import affiliateRoutes from './routes/affiliate';

// Middleware
import { telegramAuth } from './middleware/telegram';
import { errorHandler } from './utils/error-handling';
import { databaseMiddleware } from './db';

/**
 * Cloudflare Workers Bindings
 */
export type WorkerBindings = {
  DB: D1Database;
  BOT_TOKEN: string;
  ADMIN_IDS: string;
  WEBHOOK_SECRET: string;
  AFFILIATE_KV: KVNamespace;
  PUBLIC_URL?: string;
  TELEGRAM_BOT_USERNAME?: string;
  TELEGRAM_BOT_TOKEN?: string;
  WITHDRAWAL_PRIVATE_KEY?: string;
  ENVIRONMENT?: string;
  CORS_ORIGINS?: string;
  DEBUG?: string;
};

/**
 * App context type
 */
export type AppContext = {
  Bindings: WorkerBindings;
};

/**
 * Get CORS origins based on environment
 */
function getCorsOrigins(env: Record<string, string | undefined>): string[] {
  const config = getConfig(env);
  return [
    ...config.api.corsOrigins,
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5173',
    'https://telegram-affiliate-dashboard.pages.dev',
  ];
}

/**
 * Create and configure the Hono app
 */
export function createApp() {
  const app = new Hono<AppContext>();

  // Global middleware
  app.use('*', logger());
  
  // Database middleware (inject db and repositories into context)
  app.use('*', databaseMiddleware());

  // CORS middleware
  app.use('*', async (c, next) => {
    const env = c.env as Record<string, string | undefined>;
    const origins = getCorsOrigins(env);
    const origin = c.req.header('origin') || '';
    
    // Check if origin is allowed
    const allowedOrigin = origins.includes(origin) ? origin : origins[0];
    
    c.header('Access-Control-Allow-Origin', allowedOrigin);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Telegram-Init-Data');
    
    if (c.req.method === 'OPTIONS') {
      return c.text('', 204);
    }
    
    await next();
  });

  app.use('*', prettyJSON());

  // Health routes (public)
  app.route('/health', healthRoutes);

  // Root endpoint
  app.get('/', (c) => {
    const env = c.env as Record<string, string | undefined>;
    const config = getConfig(env);
    const isWorker = typeof env.DB !== 'undefined';
    
    return c.json({ 
      message: `Telegram Affiliate API${isWorker ? ' (Cloudflare Workers)' : ''}`,
      version: '1.0.0',
      environment: config.env,
      runtime: isWorker ? 'cloudflare-workers' : 'bun',
      endpoints: {
        health: '/health',
        api: '/api/*',
        telegram: '/telegram/*',
        affiliate: '/api/affiliate/*'
      }
    });
  });

  // Telegram webhook routes (no auth required - Telegram verifies)
  app.route('/telegram', telegramRoutes);

  // Affiliate routes (public for link tracking, QR codes)
  // MUST come before auth middleware
  app.route('/api/affiliate', affiliateRoutes);

  // API routes (protected with Telegram auth)
  app.use('/api/*', telegramAuth);
  app.route('/api/user', userRoutes);
  app.route('/api/agent', agentRoutes);

  // Monitoring routes (public, but could add auth)
  app.route('/api/monitoring', monitoringRoutes);

  // Error handling
  app.onError(errorHandler);

  return app;
}
