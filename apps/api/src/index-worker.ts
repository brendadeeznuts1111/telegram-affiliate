/**
 * Cloudflare Workers entry point
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

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
};

const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['https://yourdomain.com', 'http://localhost:5175', 'http://localhost:5173'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data'],
}));
app.use('*', prettyJSON());

// Health routes (public)
app.route('/health', healthRoutes);

// Root endpoint
app.get('/', (c) => c.json({ 
  message: 'Telegram Affiliate API (Cloudflare Workers)',
  version: '1.0.0',
  worker: true,
  endpoints: {
    health: '/health',
    api: '/api/*',
    telegram: '/telegram/*',
    affiliate: '/api/affiliate/*'
  }
}));

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

