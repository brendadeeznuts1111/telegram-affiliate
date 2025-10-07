/**
 * Cloudflare Workers entry point
 * Now using @affiliate/config for centralized configuration
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { getConfig } from '@affiliate/config';

// Import routes
// import userRoutes from './routes/user'; // TODO: Refactor to use D1
// import agentRoutes from './routes/agent'; // TODO: Refactor to use D1
import affiliateRoutes from './routes/affiliate';
import telegramRoutes from './routes/telegram';
import healthRoutes from './routes/health';
import monitoringRoutes from './routes/monitoring';

// Middleware
import { telegramAuth } from './middleware/telegram';
import { errorHandler } from './utils/error-handling';

type Bindings = {
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
};

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());

// CORS middleware with config-based origins
app.use('*', async (c, next) => {
  // Get config from environment
  const config = getConfig(c.env);
  
  const origin = c.req.header('origin') || '';
  const allowedOrigins = [
    ...config.api.corsOrigins,
    'https://telegram-affiliate-dashboard.pages.dev',
  ];
  
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
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
  const config = getConfig(c.env);
  return c.json({ 
    message: 'Telegram Affiliate API (Cloudflare Workers)',
    version: '1.0.0',
    worker: true,
    environment: config.env,
    endpoints: {
      health: '/health',
      api: '/api/*',
      telegram: '/telegram/*',
      affiliate: '/api/affiliate/*'
    }
  });
});

// Telegram webhook routes (no auth - Telegram verifies)
app.route('/telegram', telegramRoutes);

// Affiliate routes (public for link tracking, QR codes) - MUST come before auth middleware
app.route('/api/affiliate', affiliateRoutes);

// API routes (protected with Telegram auth)
app.use('/api/*', telegramAuth);
// TODO: Refactor to use D1 instead of bun:sqlite
// app.route('/api/user', userRoutes);
// app.route('/api/agent', agentRoutes);

// Monitoring routes
app.route('/api/monitoring', monitoringRoutes);

// Error handling
app.onError(errorHandler);

export default app;

