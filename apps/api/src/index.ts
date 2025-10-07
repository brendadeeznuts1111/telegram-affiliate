import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { getConfig } from '@affiliate/config';

// Import routes
import userRoutes from './routes/user';
import agentRoutes from './routes/agent';
import healthRoutes from './routes/health';
import telegramRoutes from './routes/telegram';
import monitoringRoutes from './routes/monitoring';
import affiliateRoutes from './routes/affiliate';

// Middleware
import { telegramAuth } from './middleware/telegram';
import { errorHandler as customErrorHandler } from './utils/error-handling';

type Bindings = {
  ENVIRONMENT?: string;
  DEBUG?: string;
  CORS_ORIGINS?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Get validated configuration
const config = getConfig(process.env);

// CORS configuration from validated config
function getCorsOrigins(): string[] {
  return [
    ...config.api.corsOrigins,
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5173',
    'https://telegram-affiliate-dashboard.pages.dev',
  ];
}

// Global middleware
app.use('*', logger());

app.use('*', async (c, next) => {
  const origins = getCorsOrigins();
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
  return c.json({ 
    message: 'Telegram Affiliate API',
    version: '1.0.0',
    environment: config.env,
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// Telegram webhook routes (no auth required - Telegram verifies)
app.route('/telegram', telegramRoutes);

// Affiliate routes (public for link tracking, QR codes) - MUST come before auth middleware
app.route('/api/affiliate', affiliateRoutes);

// API routes (protected with Telegram auth)
app.use('/api/*', telegramAuth);
app.route('/api/user', userRoutes);
app.route('/api/agent', agentRoutes);

// Monitoring routes (public, but could add auth)
app.route('/api/monitoring', monitoringRoutes);

// Error handling
app.onError(customErrorHandler);

// For local development with Bun
if (config.env !== 'production') {
  console.log(`🚀 API Server starting...`);
  console.log(`📡 Port: ${config.api.port}`);
  console.log(`🔗 URL: http://${config.api.host}:${config.api.port}`);
  console.log(`🌍 Environment: ${config.env}`);
  console.log(`💚 Bun ${Bun.version}`);
  console.log(`\n✅ Configuration validated successfully`);
}

export default {
  port: config.api.port,
  fetch: app.fetch,
};
